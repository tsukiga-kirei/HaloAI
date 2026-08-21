import cors from "@fastify/cors";
import helmet from "@fastify/helmet";
import rateLimit from "@fastify/rate-limit";
import { createAuth } from "./auth";
import {
  createDatabaseClient,
  SystemAdministrationRepository,
  WorkspaceGovernanceRepository,
  WorkspaceOnboardingRepository,
} from "@haloai/db";
import { createSessionPolicy } from "./session-policy";
import { createServiceLogger } from "@haloai/logger";
import Fastify, { type FastifyBaseLogger, type FastifyInstance, LogController } from "fastify";
import type { ApiConfig } from "./config";
import { handleError } from "./errors";
import { registerDemoEventRoutes } from "./routes/demo-events";
import { registerHealthRoutes } from "./routes/health";
import { registerAuthRoutes } from "./routes/auth";
import { registerCollaborationRoutes } from "./routes/collaboration";
import { registerWorkspaceRoutes } from "./routes/workspaces";
import { registerWorkspaceGovernanceRoutes } from "./routes/workspace-governance";
import { registerSystemAdministrationRoutes } from "./routes/system-administration";
import { webOriginAllowlist } from "./web-origins";
import { ModelSecretCipher } from "./model-secret";

export async function createServer(config: ApiConfig): Promise<FastifyInstance> {
  const logger = createServiceLogger({
    service: "api",
    environment: config.NODE_ENV,
    level: config.LOG_LEVEL,
    logDirectory: config.LOG_DIR,
  });
  const applicationDatabase = createDatabaseClient({
    url: config.DATABASE_URL,
    applicationName: "haloai-api",
  });
  const authenticationDatabase = createDatabaseClient({
    url: config.AUTH_DATABASE_URL,
    applicationName: "haloai-auth",
    maxConnections: 5,
  });
  const onboardingRepository = new WorkspaceOnboardingRepository(applicationDatabase);
  const governanceRepository = new WorkspaceGovernanceRepository(applicationDatabase);
  const systemAdministrationRepository = new SystemAdministrationRepository(applicationDatabase);
  const sessionPolicy = createSessionPolicy({
    sessionExpiresInSeconds: config.AUTH_SESSION_EXPIRES_IN_SECONDS,
    sessionUpdateAgeSeconds: config.AUTH_SESSION_UPDATE_AGE_SECONDS,
    slidingRenewal: config.AUTH_SESSION_UPDATE_AGE_SECONDS > 0,
  });
  try {
    const stored = await systemAdministrationRepository.getSettings({
      sessionExpiresInSeconds: config.AUTH_SESSION_EXPIRES_IN_SECONDS,
      sessionUpdateAgeSeconds: config.AUTH_SESSION_UPDATE_AGE_SECONDS,
    });
    sessionPolicy.replace(stored.authentication);
  } catch {
    // 健康检查与无库测试不能被系统设置表绑死；缺库时继续使用启动缺省。
  }
  const auth = createAuth(authenticationDatabase.db, config, sessionPolicy);
  const modelSecretCipher = new ModelSecretCipher(
    config.MODEL_SECRET_ENCRYPTION_KEY,
    config.MODEL_SECRET_KEY_VERSION,
  );
  const app = Fastify({
    // Fastify 只依赖其基础 Logger 契约；收窄类型避免 Pino 专有泛型污染全部路由注册签名。
    loggerInstance: logger as FastifyBaseLogger,
    trustProxy: false,
    requestIdHeader: "x-request-id",
    logController: new LogController({ disableRequestLogging: config.NODE_ENV === "test" }),
  });

  await app.register(helmet, {
    // SSE 使用同源 API；Web 文档协作服务会在独立入口配置自己的 CSP/连接策略。
    contentSecurityPolicy: false,
  });
  await app.register(cors, {
    origin: webOriginAllowlist(config.WEB_ORIGIN),
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  });
  await app.register(rateLimit, { global: false });

  app.addHook("onClose", async () => {
    await Promise.all([applicationDatabase.close(), authenticationDatabase.close()]);
  });

  app.setErrorHandler(handleError);
  await registerHealthRoutes(app);
  await registerDemoEventRoutes(app);
  await registerAuthRoutes(app, auth, config);
  await registerWorkspaceRoutes(app, auth, onboardingRepository, config);
  await registerWorkspaceGovernanceRoutes(
    app,
    auth,
    onboardingRepository,
    governanceRepository,
    systemAdministrationRepository,
  );
  await registerSystemAdministrationRoutes(
    app,
    auth,
    systemAdministrationRepository,
    modelSecretCipher,
    config,
    sessionPolicy,
  );
  await registerCollaborationRoutes(app, auth, applicationDatabase, onboardingRepository);
  return app;
}
