import { createServiceLogger, safeErrorFields, type ServiceLogger } from "@haloai/logger";
import { DemoDocumentAuthorization } from "./adapters/demo-authorization";
import { InMemoryDemoDocumentPersistence } from "./adapters/in-memory-demo-persistence";
import {
  hasCollaborationDemoIdentity,
  readCollaborationConfig,
  type CollaborationConfig,
} from "./config";
import { createCollaborationService } from "./server";

function createDemoAuthorization(config: CollaborationConfig) {
  if (!hasCollaborationDemoIdentity(config)) {
    /**
     * 当前可执行入口只接受完整的本地演示 ticket。日常登录与种子不依赖本进程；
     * 生产部署必须从自己的组合根调用 createCollaborationService，并注入真实授权端口
     * 与 persistenceKind=persistent 的实现。缺失端口时绝不回落到“允许全部”。
     */
    throw new Error("collaboration-production-ports-unconfigured");
  }

  return new DemoDocumentAuthorization({
    token: config.DEMO_TOKEN,
    actorId: config.DEMO_ACTOR_ID,
    workspaceId: config.DEMO_WORKSPACE_ID,
    documentId: config.DEMO_DOCUMENT_ID,
    access: config.DEMO_ACCESS,
  });
}

async function main(): Promise<ServiceLogger> {
  const config = readCollaborationConfig();
  const logger = createServiceLogger({
    service: "collab",
    environment: config.NODE_ENV,
    level: config.LOG_LEVEL,
    logDirectory: config.LOG_DIR,
  });
  const authorization = createDemoAuthorization(config);
  const service = createCollaborationService(
    config,
    {
      authorization,
      persistence: new InMemoryDemoDocumentPersistence(),
    },
    logger,
  );

  let shuttingDown = false;
  async function shutdown(signal: NodeJS.Signals): Promise<void> {
    if (shuttingDown) {
      return;
    }
    shuttingDown = true;
    logger.info({ signal }, "正在关闭协作服务");
    try {
      await service.close();
    } catch (error) {
      logger.fatal(safeErrorFields(error), "协作服务关闭失败");
      process.exitCode = 1;
    }
  }

  process.once("SIGINT", () => void shutdown("SIGINT"));
  process.once("SIGTERM", () => void shutdown("SIGTERM"));
  await service.listen();
  return logger;
}

let startupLogger: ServiceLogger | undefined;
try {
  startupLogger = await main();
} catch (error) {
  /**
   * 启动异常只记录类别，不序列化环境配置、ticket 或适配器错误对象，避免普通日志泄露凭据。
   */
  const logger =
    startupLogger ??
    createServiceLogger({
      service: "collab",
      environment: process.env.NODE_ENV === "production" ? "production" : "development",
      level: "info",
      logDirectory: process.env.LOG_DIR,
    });
  logger.fatal(safeErrorFields(error), "协作服务启动失败");
  process.exitCode = 1;
}
