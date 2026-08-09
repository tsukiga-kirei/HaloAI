import { readConfig } from "./config";
import { createServer } from "./server";

const config = readConfig();
const app = await createServer(config);

/**
 * 先停止接收新请求，再等待 Fastify 关闭连接。耐久 Agent 任务不运行在 API 进程中，
 * 因此 API 重启不会悄悄终止模型调用或外部副作用。
 */
async function shutdown(signal: NodeJS.Signals): Promise<void> {
  app.log.info({ signal }, "正在关闭 API");
  await app.close();
  process.exit(0);
}

process.once("SIGINT", () => void shutdown("SIGINT"));
process.once("SIGTERM", () => void shutdown("SIGTERM"));

try {
  await app.listen({ host: config.HOST, port: config.PORT });
} catch (error) {
  app.log.fatal({ error }, "API 启动失败");
  process.exit(1);
}
