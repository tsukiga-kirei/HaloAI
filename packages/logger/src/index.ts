import { existsSync, mkdirSync } from "node:fs";
import path from "node:path";
import pino, { type Level, type Logger } from "pino";

export type HaloLogLevel = Level | "silent";
export type ServiceLogger = Logger;

export interface ServiceLoggerOptions {
  service: string;
  environment: "development" | "test" | "production";
  level: HaloLogLevel;
  logDirectory?: string | undefined;
  writeToStdout?: boolean | undefined;
}

const redactedPaths = [
  "password",
  "secret",
  "token",
  "accessToken",
  "refreshToken",
  "apiKey",
  "authorization",
  "cookie",
  "*.password",
  "*.secret",
  "*.token",
  "*.accessToken",
  "*.refreshToken",
  "*.apiKey",
  "*.authorization",
  "*.cookie",
  "headers.authorization",
  "headers.cookie",
  "headers['set-cookie']",
  "req.headers.authorization",
  "req.headers.cookie",
  "req.headers['set-cookie']",
  "request.headers.authorization",
  "request.headers.cookie",
  "request.headers['set-cookie']",
] as const;

/**
 * 各应用由 pnpm 在自己的包目录启动。相对日志目录必须锚定仓库根，否则同一个 LOG_DIR 会悄悄
 * 分裂成 apps/api/logs、apps/worker/logs 等多个位置，开发者无法从一个入口排障。
 */
function findWorkspaceRoot(startDirectory: string): string {
  let current = path.resolve(startDirectory);
  while (true) {
    if (existsSync(path.join(current, "pnpm-workspace.yaml"))) {
      return current;
    }
    const parent = path.dirname(current);
    if (parent === current) {
      return path.resolve(startDirectory);
    }
    current = parent;
  }
}

function resolveLogDirectory(directory: string): string {
  if (path.isAbsolute(directory)) {
    return directory;
  }
  return path.resolve(findWorkspaceRoot(process.cwd()), directory);
}

/**
 * 诊断日志始终保留结构化 stdout，便于容器运行时采集。本地显式设置 LOG_DIR 时再增加同步文件流；
 * 同步写入牺牲少量开发性能，换取 watch 进程被中断时最后几条错误不会遗失。生产 Compose 不传
 * LOG_DIR，避免把容器可写层误当成耐久日志盘。
 */
export function createServiceLogger(options: ServiceLoggerOptions): Logger {
  const streams: pino.StreamEntry[] = [];
  if (options.writeToStdout !== false) {
    streams.push({ stream: pino.destination({ dest: 1, sync: false }) });
  }

  if (options.logDirectory) {
    const directory = resolveLogDirectory(options.logDirectory);
    mkdirSync(directory, { recursive: true });
    streams.push({
      stream: pino.destination({
        dest: path.join(directory, `${options.service}.log`),
        mkdir: true,
        sync: true,
      }),
    });
  }

  if (streams.length === 0) {
    streams.push({ stream: pino.destination({ dest: "/dev/null", sync: true }) });
  }

  return pino(
    {
      level: options.level,
      base: {
        service: options.service,
        environment: options.environment,
      },
      redact: {
        paths: [...redactedPaths],
        censor: "[REDACTED]",
      },
    },
    pino.multistream(streams),
  );
}

/**
 * 未知异常可能把 SQL、URL、请求正文或供应商响应塞进 message/stack。普通日志默认只保留可分组的
 * 类型和稳定 code；调用方若要增加内容，必须逐字段证明其不包含凭据和租户正文。
 */
export function safeErrorFields(error: unknown): { errorName: string; errorCode?: string } {
  const errorName = error instanceof Error ? error.name : "UnknownError";
  if (typeof error !== "object" || error === null || !("code" in error)) {
    return { errorName };
  }
  const code = error.code;
  if ((typeof code !== "string" && typeof code !== "number") || String(code).length > 120) {
    return { errorName };
  }
  return { errorName, errorCode: String(code) };
}
