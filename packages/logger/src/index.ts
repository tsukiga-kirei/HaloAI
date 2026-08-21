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

/**
 * 只按字段名脱敏。值模式扫描会误伤 UUID 与摘要，真正的正文/密钥禁止进入日志对象。
 * 同时覆盖驼峰和蛇形，避免适配器或 HTTP 头换一种命名就漏网。
 */
const redactedPaths = [
  "password",
  "secret",
  "token",
  "accessToken",
  "refreshToken",
  "apiKey",
  "authorization",
  "cookie",
  "setCookie",
  "clientSecret",
  "privateKey",
  "databaseUrl",
  "connectionString",
  "encryptionKey",
  "modelSecret",
  "secretCiphertext",
  "ciphertext",
  "prompt",
  "systemPrompt",
  "api_key",
  "access_token",
  "refresh_token",
  "client_secret",
  "private_key",
  "database_url",
  "connection_string",
  "encryption_key",
  "model_secret",
  "secret_ciphertext",
  "system_prompt",
  "*.password",
  "*.secret",
  "*.token",
  "*.accessToken",
  "*.refreshToken",
  "*.apiKey",
  "*.authorization",
  "*.cookie",
  "*.setCookie",
  "*.clientSecret",
  "*.privateKey",
  "*.databaseUrl",
  "*.connectionString",
  "*.encryptionKey",
  "*.modelSecret",
  "*.secretCiphertext",
  "*.ciphertext",
  "*.prompt",
  "*.systemPrompt",
  "*.api_key",
  "*.access_token",
  "*.refresh_token",
  "*.client_secret",
  "*.private_key",
  "*.database_url",
  "*.connection_string",
  "*.encryption_key",
  "*.model_secret",
  "*.secret_ciphertext",
  "*.system_prompt",
  "headers.authorization",
  "headers.cookie",
  "headers['set-cookie']",
  "headers.set-cookie",
  "req.headers.authorization",
  "req.headers.cookie",
  "req.headers['set-cookie']",
  "request.headers.authorization",
  "request.headers.cookie",
  "request.headers['set-cookie']",
] as const;

export interface DiagnosticContext {
  requestId?: string;
  method?: string;
  path?: string;
  statusCode?: number;
  durationMs?: number;
  workspaceId?: string;
  actorId?: string;
  runId?: string;
  jobId?: string | number;
  documentId?: string;
  taskIdentifier?: string;
  outboxEventId?: string;
  attempt?: number;
}

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

/** 查询串可能携带 ticket 或令牌，诊断日志只保留路径。 */
export function diagnosticRequestPath(url: string): string {
  const pathOnly = url.split("?")[0] ?? "/";
  return pathOnly.length > 180 ? pathOnly.slice(0, 180) : pathOnly;
}

/**
 * 只复制已审查的关联字段。调用方不得把请求体、Cookie、提示词或异常原文塞进这个对象。
 */
export function diagnosticFields(context: DiagnosticContext): Record<string, string | number> {
  const fields: Record<string, string | number> = {};
  if (context.requestId) fields.requestId = context.requestId;
  if (context.method) fields.method = context.method;
  if (context.path) fields.path = diagnosticRequestPath(context.path);
  if (context.statusCode !== undefined) fields.statusCode = context.statusCode;
  if (context.durationMs !== undefined) fields.durationMs = context.durationMs;
  if (context.workspaceId) fields.workspaceId = context.workspaceId;
  if (context.actorId) fields.actorId = context.actorId;
  if (context.runId) fields.runId = context.runId;
  if (context.jobId !== undefined) fields.jobId = context.jobId;
  if (context.documentId) fields.documentId = context.documentId;
  if (context.taskIdentifier) fields.taskIdentifier = context.taskIdentifier;
  if (context.outboxEventId) fields.outboxEventId = context.outboxEventId;
  if (context.attempt !== undefined) fields.attempt = context.attempt;
  return fields;
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
      serializers: {
        err: (error: unknown) => safeErrorFields(error),
        req: (request: { id?: string; method?: string; url?: string }) => ({
          requestId: request.id,
          method: request.method,
          path: diagnosticRequestPath(request.url ?? "/"),
        }),
        res: (reply: { statusCode?: number }) => ({ statusCode: reply.statusCode }),
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
