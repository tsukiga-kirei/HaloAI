import { run } from "graphile-worker";
import pino from "pino";
import { readWorkerConfig } from "./config";
import { taskList } from "./tasks";

const config = readWorkerConfig();
const logger = pino({ level: config.LOG_LEVEL });

const runner = await run({
  connectionString: config.DATABASE_URL,
  concurrency: config.WORKER_CONCURRENCY,
  noHandleSignals: true,
  pollInterval: 1_000,
  taskList,
});

/**
 * Worker 收到终止信号后停止领取新任务，并为当前任务保留收尾时间。每个外部副作用仍需
 * 独立幂等键，因为强制终止可能发生在“对方已成功、我方尚未记账”的狭窄窗口。
 */
async function shutdown(signal: NodeJS.Signals): Promise<void> {
  logger.info({ signal }, "正在关闭 Worker");
  await runner.stop();
}

process.once("SIGINT", () => void shutdown("SIGINT"));
process.once("SIGTERM", () => void shutdown("SIGTERM"));

logger.info({ concurrency: config.WORKER_CONCURRENCY }, "HaloAI Worker 已启动");
