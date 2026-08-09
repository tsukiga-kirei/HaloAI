import pino from "pino";
import { DemoDocumentAuthorization } from "./adapters/demo-authorization";
import { InMemoryDemoDocumentPersistence } from "./adapters/in-memory-demo-persistence";
import { readCollaborationConfig, type CollaborationConfig } from "./config";
import { createCollaborationService } from "./server";

function errorName(error: unknown): string {
  return error instanceof Error ? "startup_error" : "unknown_failure";
}

function createDemoAuthorization(config: CollaborationConfig) {
  if (
    !config.DEMO_MODE ||
    config.DEMO_TOKEN === undefined ||
    config.DEMO_ACTOR_ID === undefined ||
    config.DEMO_WORKSPACE_ID === undefined ||
    config.DEMO_DOCUMENT_ID === undefined ||
    config.DEMO_ACCESS === undefined
  ) {
    /**
     * 当前可执行入口只为 Foundation Demo 组合。生产部署必须从自己的组合根调用
     * createCollaborationService，并注入真实授权端口与 persistenceKind=persistent 的实现；
     * 这里绝不在缺失端口时回落到“允许全部”或临时内存。
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

async function main(): Promise<void> {
  const config = readCollaborationConfig();
  const logger = pino({ level: config.LOG_LEVEL });
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
      logger.fatal({ errorName: errorName(error) }, "协作服务关闭失败");
      process.exitCode = 1;
    }
  }

  process.once("SIGINT", () => void shutdown("SIGINT"));
  process.once("SIGTERM", () => void shutdown("SIGTERM"));
  await service.listen();
}

try {
  await main();
} catch (error) {
  /**
   * 启动异常只记录类别，不序列化环境配置、ticket 或适配器错误对象，避免普通日志泄露凭据。
   */
  pino().fatal({ errorName: errorName(error) }, "协作服务启动失败");
  process.exitCode = 1;
}
