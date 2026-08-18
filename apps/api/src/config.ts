import { z } from "zod";

const WebOriginSchema = z
  .string()
  .url()
  .refine((value) => {
    const url = new URL(value);
    return (url.protocol === "http:" || url.protocol === "https:") && url.origin === value;
  }, "API_WEB_ORIGIN 必须是不含路径、查询参数或凭据的规范 HTTP(S) Origin");

const developmentModelSecretKey = "aGFsb2FpLWRldi1tb2RlbC1zZWNyZXQta2V5LTMyISE=";
const ModelSecretKeySchema = z.string().refine((value) => {
  try {
    return Buffer.from(value, "base64").byteLength === 32;
  } catch {
    return false;
  }
}, "MODEL_SECRET_ENCRYPTION_KEY 必须是 32 字节密钥的 Base64 编码");

const configSchema = z
  .object({
    NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
    HOST: z.string().default("127.0.0.1"),
    PORT: z.coerce.number().int().min(1).max(65_535).default(3100),
    LOG_LEVEL: z
      .enum(["fatal", "error", "warn", "info", "debug", "trace", "silent"])
      .default("info"),
    LOG_DIR: z.string().trim().min(1).optional(),
    WEB_ORIGIN: WebOriginSchema.default("http://127.0.0.1:3000"),
    AUTH_BASE_URL: WebOriginSchema.default("http://127.0.0.1:3100"),
    AUTH_SECRET: z.string().min(32).default("haloai-local-auth-secret-change-before-production"),
    AUTH_SESSION_EXPIRES_IN_SECONDS: z.coerce
      .number()
      .int()
      .min(3600)
      .max(31_536_000)
      .default(604_800),
    AUTH_SESSION_UPDATE_AGE_SECONDS: z.coerce
      .number()
      .int()
      .min(300)
      .max(2_592_000)
      .default(86_400),
    MODEL_SECRET_ENCRYPTION_KEY: ModelSecretKeySchema.default(developmentModelSecretKey),
    MODEL_SECRET_KEY_VERSION: z.string().trim().min(1).max(64).default("v1"),
    DATABASE_URL: z
      .string()
      .url()
      .default("postgresql://haloai_app:haloai_app_local@localhost:5432/haloai"),
    AUTH_DATABASE_URL: z
      .string()
      .url()
      .default("postgresql://haloai_auth:haloai_auth_local@localhost:5432/haloai"),
    EXPOSE_DEVELOPMENT_INVITE_TOKENS: z.boolean().default(false),
  })
  .superRefine((value, context) => {
    if (
      value.NODE_ENV === "production" &&
      value.AUTH_SECRET === "haloai-local-auth-secret-change-before-production"
    ) {
      context.addIssue({
        code: "custom",
        path: ["AUTH_SECRET"],
        message: "生产环境必须配置独立认证密钥",
      });
    }
    if (
      value.NODE_ENV === "production" &&
      value.MODEL_SECRET_ENCRYPTION_KEY === developmentModelSecretKey
    ) {
      context.addIssue({
        code: "custom",
        path: ["MODEL_SECRET_ENCRYPTION_KEY"],
        message: "生产环境必须配置独立模型密钥加密主密钥",
      });
    }
    if (value.AUTH_SESSION_UPDATE_AGE_SECONDS >= value.AUTH_SESSION_EXPIRES_IN_SECONDS) {
      context.addIssue({
        code: "custom",
        path: ["AUTH_SESSION_UPDATE_AGE_SECONDS"],
        message: "会话续期间隔必须短于会话有效期",
      });
    }
  });

export type ApiConfig = z.infer<typeof configSchema>;

/**
 * 本地不必再单独写 AUTH_BASE_URL。公开源站跟监听地址走；绑 0.0.0.0 时仍用回环地址，
 * 因为 0.0.0.0 不能当浏览器 Origin。生产若前面有反代，再显式覆盖 AUTH_BASE_URL。
 */
function deriveAuthBaseUrl(environment: NodeJS.ProcessEnv): string {
  if (environment.AUTH_BASE_URL) {
    return environment.AUTH_BASE_URL;
  }

  const bindHost = environment.API_HOST ?? "127.0.0.1";
  const publicHost = bindHost === "0.0.0.0" || bindHost === "::" ? "127.0.0.1" : bindHost;
  const port = environment.API_PORT ?? "3100";
  return `http://${publicHost}:${port}`;
}

/**
 * 环境变量只在进程边界解析一次。业务代码拿到的是已校验配置，不能在各模块中直接读取
 * `process.env`，否则测试无法可靠覆盖默认值，部署时也容易出现“字符串看似存在但格式错误”。
 */
export function readConfig(environment: NodeJS.ProcessEnv = process.env): ApiConfig {
  /**
   * 对外环境变量带 API_ 前缀，避免 `pnpm dev:all` 同时启动 API 与协作服务时争用同一个
   * PORT。进入应用后仍归一化为 HOST/PORT，让传输层不感知部署命名约定。
   */
  return configSchema.parse({
    NODE_ENV: environment.NODE_ENV,
    HOST: environment.API_HOST,
    PORT: environment.API_PORT,
    LOG_LEVEL: environment.LOG_LEVEL,
    LOG_DIR: environment.LOG_DIR,
    WEB_ORIGIN: environment.API_WEB_ORIGIN,
    AUTH_BASE_URL: deriveAuthBaseUrl(environment),
    AUTH_SECRET: environment.BETTER_AUTH_SECRET,
    AUTH_SESSION_EXPIRES_IN_SECONDS: environment.AUTH_SESSION_EXPIRES_IN_SECONDS,
    AUTH_SESSION_UPDATE_AGE_SECONDS: environment.AUTH_SESSION_UPDATE_AGE_SECONDS,
    MODEL_SECRET_ENCRYPTION_KEY: environment.MODEL_SECRET_ENCRYPTION_KEY,
    MODEL_SECRET_KEY_VERSION: environment.MODEL_SECRET_KEY_VERSION,
    DATABASE_URL: environment.DATABASE_URL,
    AUTH_DATABASE_URL: environment.AUTH_DATABASE_URL,
    EXPOSE_DEVELOPMENT_INVITE_TOKENS: environment.EXPOSE_DEVELOPMENT_INVITE_TOKENS === "true",
  });
}
