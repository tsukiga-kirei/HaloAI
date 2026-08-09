import cors from "@fastify/cors";
import helmet from "@fastify/helmet";
import Fastify, { type FastifyInstance, LogController } from "fastify";
import type { ApiConfig } from "./config";
import { handleError } from "./errors";
import { registerDemoEventRoutes } from "./routes/demo-events";
import { registerHealthRoutes } from "./routes/health";

export async function createServer(config: ApiConfig): Promise<FastifyInstance> {
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
    origin: config.WEB_ORIGIN,
    credentials: true,
    methods: ["GET", "POST", "PATCH", "DELETE", "OPTIONS"],
  });

  app.setErrorHandler(handleError);
  await registerHealthRoutes(app);
  await registerDemoEventRoutes(app);
  return app;
}
