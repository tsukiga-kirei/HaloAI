import cors from "@fastify/cors";
import helmet from "@fastify/helmet";
import rateLimit from "@fastify/rate-limit";
import { createAuth } from "./auth";
import { createDatabaseClient, WorkspaceOnboardingRepository } from "@haloai/db";
import Fastify, { type FastifyInstance, LogController } from "fastify";
import type { ApiConfig } from "./config";
import { handleError } from "./errors";
import { registerDemoEventRoutes } from "./routes/demo-events";
import { registerHealthRoutes } from "./routes/health";
import { registerAuthRoutes } from "./routes/auth";
import { registerCollaborationRoutes } from "./routes/collaboration";
import { registerWorkspaceRoutes } from "./routes/workspaces";
import { webOriginAllowlist } from "./web-origins";

export async function createServer(config: ApiConfig): Promise<FastifyInstance> {
  const applicationDatabase = createDatabaseClient({
    url: config.DATABASE_URL,
    applicationName: "haloai-api",
  });
  const authenticationDatabase = createDatabaseClient({
    url: config.AUTH_DATABASE_URL,
    applicationName: "haloai-auth",
    maxConnections: 5,
  });
  const auth = createAuth(authenticationDatabase.db, config);
  const onboardingRepository = new WorkspaceOnboardingRepository(applicationDatabase);
  const app = Fastify({
    logger: { level: config.LOG_LEVEL },
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
    methods: ["GET", "POST", "PATCH", "DELETE", "OPTIONS"],
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
  await registerCollaborationRoutes(app, auth, applicationDatabase, onboardingRepository);
  return app;
}
