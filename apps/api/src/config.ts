import { z } from "zod";

const WebOriginSchema = z
  .string()
  .url()
  .refine((value) => {
    const url = new URL(value);
    return (url.protocol === "http:" || url.protocol === "https:") && url.origin === value;
  }, "API_WEB_ORIGIN 必须是不含路径、查询参数或凭据的规范 HTTP(S) Origin");

const configSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  HOST: z.string().default("127.0.0.1"),
  PORT: z.coerce.number().int().min(1).max(65_535).default(3100),
  LOG_LEVEL: z.enum(["fatal", "error", "warn", "info", "debug", "trace", "silent"]).default("info"),
  WEB_ORIGIN: WebOriginSchema.default("http://localhost:3000"),
});

export type ApiConfig = z.infer<typeof configSchema>;

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
    WEB_ORIGIN: environment.API_WEB_ORIGIN,
  });
}
