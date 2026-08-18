import { Logger as GraphileLogger, type LogFunctionFactory, type LogLevel } from "graphile-worker";
import type { ServiceLogger } from "@haloai/logger";

interface GraphileLogScope {
  label?: string;
  workerId?: string;
  taskIdentifier?: string;
  jobId?: string;
}

/**
 * Graphile Worker 默认使用自己的文本 Logger。这里把 scope 转入统一 Pino 事件，但有意丢弃任意
 * metadata：第三方错误 metadata 可能携带 SQL 或任务 payload，未经字段审查不能进入普通日志。
 */
export function createGraphileLogger(logger: ServiceLogger): GraphileLogger {
  const factory: LogFunctionFactory =
    (scope: Partial<GraphileLogScope>) =>
    (level: LogLevel, message: string): void => {
      const fields = { component: "graphile-worker", ...scope };
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
