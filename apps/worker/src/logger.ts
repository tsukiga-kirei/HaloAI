import { createServiceLogger, diagnosticFields, type ServiceLogger } from "@haloai/logger";
import { Logger as GraphileLogger, type LogFunctionFactory, type LogLevel } from "graphile-worker";
import type { WorkerConfig } from "./config";

interface GraphileLogScope {
  label?: string;
  workerId?: string;
  taskIdentifier?: string;
  jobId?: string;
}

let workerLogger: ServiceLogger | undefined;

export function createWorkerLogger(
  config: Pick<WorkerConfig, "NODE_ENV" | "LOG_LEVEL" | "LOG_DIR">,
): ServiceLogger {
  workerLogger = createServiceLogger({
    service: "worker",
    environment: config.NODE_ENV,
    level: config.LOG_LEVEL,
    logDirectory: config.LOG_DIR,
  });
  return workerLogger;
}

export function getWorkerLogger(): ServiceLogger {
  if (!workerLogger) {
    throw new Error("Worker 诊断日志尚未初始化");
  }
  return workerLogger;
}

/**
 * Graphile Worker 默认使用自己的文本 Logger。这里把 scope 转入统一 Pino 事件，但有意丢弃任意
 * metadata：第三方错误 metadata 可能携带 SQL 或任务 payload，未经字段审查不能进入普通日志。
 */
export function createGraphileLogger(logger: ServiceLogger): GraphileLogger {
  const factory: LogFunctionFactory =
    (scope: Partial<GraphileLogScope>) =>
    (level: LogLevel, message: string): void => {
      const fields = {
        component: "graphile-worker",
        ...diagnosticFields({
          ...(scope.jobId ? { jobId: scope.jobId } : {}),
          ...(scope.taskIdentifier ? { taskIdentifier: scope.taskIdentifier } : {}),
        }),
      };
      switch (level) {
        case "error":
          logger.error(fields, message);
          break;
        case "warning":
          logger.warn(fields, message);
          break;
        case "debug":
          logger.debug(fields, message);
          break;
        default:
          logger.info(fields, message);
      }
    };
  return new GraphileLogger(factory);
}
