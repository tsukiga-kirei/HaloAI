import { ActorIdSchema, DocumentIdSchema, WorkspaceIdSchema } from "@haloai/contracts";
import { z } from "zod";

const BooleanEnvironmentSchema = z
  .enum(["true", "false"])
  .default("false")
  .transform((value) => value === "true");

const LogLevelSchema = z.enum(["fatal", "error", "warn", "info", "debug", "trace", "silent"]);

const WebOriginSchema = z
  .string()
  .url()
  .refine((value) => {
    const url = new URL(value);
    return (url.protocol === "http:" || url.protocol === "https:") && url.origin === value;
  }, "WEB_ORIGIN must be a canonical HTTP(S) origin without path or credentials");

const collaborationConfigSchema = z
  .object({
    NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
    HOST: z.string().min(1).default("127.0.0.1"),
    PORT: z.coerce.number().int().min(1).max(65_535).default(3200),
    WEB_ORIGIN: WebOriginSchema.default("http://127.0.0.1:3000"),
    LOG_LEVEL: LogLevelSchema.default("info"),
    LOG_DIR: z.string().trim().min(1).optional(),
    STORE_DEBOUNCE_MS: z.coerce.number().int().min(100).max(60_000).default(1_000),
    STORE_MAX_DEBOUNCE_MS: z.coerce.number().int().min(100).max(300_000).default(5_000),
    STORE_RETRY_ATTEMPTS: z.coerce.number().int().min(1).max(5).default(3),
    STORE_ATTEMPT_TIMEOUT_MS: z.coerce.number().int().min(100).max(30_000).default(5_000),
    STORE_RETRY_BASE_DELAY_MS: z.coerce.number().int().min(10).max(5_000).default(100),
    SHUTDOWN_TIMEOUT_MS: z.coerce.number().int().min(1_000).max(180_000).default(20_000),
    MAX_UPDATE_BYTES: z.coerce.number().int().min(16_384).max(10_485_760).default(1_048_576),
    MAX_DOCUMENT_BYTES: z.coerce.number().int().min(65_536).max(104_857_600).default(20_971_520),
    MAX_AWARENESS_BYTES: z.coerce.number().int().min(256).max(2_048).default(2_048),
    MAX_AWARENESS_UPDATES_PER_SECOND: z.coerce.number().int().min(1).max(20).default(20),
    AUTH_TIMEOUT_MS: z.coerce.number().int().min(1_000).max(120_000).default(10_000),
    CONNECTION_TIMEOUT_MS: z.coerce.number().int().min(10_000).max(300_000).default(60_000),
    DEMO_MODE: BooleanEnvironmentSchema,
    DEMO_TOKEN: z.string().min(32).max(4_096).optional(),
    DEMO_ACTOR_ID: ActorIdSchema.optional(),
    DEMO_WORKSPACE_ID: WorkspaceIdSchema.optional(),
    DEMO_DOCUMENT_ID: DocumentIdSchema.optional(),
    DEMO_ACCESS: z.enum(["read", "write"]).optional(),
  })
  .superRefine((config, context) => {
    if (config.STORE_MAX_DEBOUNCE_MS < config.STORE_DEBOUNCE_MS) {
      context.addIssue({
        code: "custom",
        path: ["STORE_MAX_DEBOUNCE_MS"],
        message: "STORE_MAX_DEBOUNCE_MS must be at least STORE_DEBOUNCE_MS",
      });
    }

    /**
     * 关闭期限必须容纳一次完整的持久化重试窗口。否则配置看似提供了三次尝试，进程却可能
     * 在后一次尝试开始前就进入强制退出，造成稳定且难以观察的数据丢失。
     */
    const retryDelayTotal = Array.from(
      { length: Math.max(0, config.STORE_RETRY_ATTEMPTS - 1) },
      (_unused, index) => config.STORE_RETRY_BASE_DELAY_MS * 2 ** index,
    ).reduce((total, delay) => total + delay, 0);
    const minimumShutdownWindow =
      config.STORE_RETRY_ATTEMPTS * config.STORE_ATTEMPT_TIMEOUT_MS + retryDelayTotal;
    if (config.SHUTDOWN_TIMEOUT_MS < minimumShutdownWindow) {
      context.addIssue({
        code: "custom",
        path: ["SHUTDOWN_TIMEOUT_MS"],
        message: "SHUTDOWN_TIMEOUT_MS must cover the complete document store retry window",
      });
    }

    /**
     * DEMO_MODE 只属于本地种子数据，不能拿来打开协作演示 ticket。
     * 生产环境即使误拷了本地 .env，也必须拒绝该开关与任何 DEMO_*。
     */
    if (config.NODE_ENV === "production" && config.DEMO_MODE) {
      context.addIssue({
        code: "custom",
        path: ["DEMO_MODE"],
        message: "DEMO_MODE is forbidden in production",
      });
    }

    const demoValues = [
      config.DEMO_TOKEN,
      config.DEMO_ACTOR_ID,
      config.DEMO_WORKSPACE_ID,
      config.DEMO_DOCUMENT_ID,
      config.DEMO_ACCESS,
    ];
    const definedDemoValues = demoValues.filter((value) => value !== undefined);
    if (definedDemoValues.length > 0 && definedDemoValues.length < demoValues.length) {
      context.addIssue({
        code: "custom",
        path: ["DEMO_TOKEN"],
        message: "collaboration demo identity must be complete or entirely absent",
      });
    }
    if (config.NODE_ENV === "production" && definedDemoValues.length > 0) {
      context.addIssue({
        code: "custom",
        path: ["DEMO_TOKEN"],
        message: "collaboration demo identity is forbidden in production",
      });
    }
  });

export type CollaborationConfig = z.infer<typeof collaborationConfigSchema>;

export type CollaborationDemoIdentity = {
  DEMO_TOKEN: string;
  DEMO_ACTOR_ID: NonNullable<CollaborationConfig["DEMO_ACTOR_ID"]>;
  DEMO_WORKSPACE_ID: NonNullable<CollaborationConfig["DEMO_WORKSPACE_ID"]>;
  DEMO_DOCUMENT_ID: NonNullable<CollaborationConfig["DEMO_DOCUMENT_ID"]>;
  DEMO_ACCESS: NonNullable<CollaborationConfig["DEMO_ACCESS"]>;
};

/**
 * 协作演示 ticket 与 DEMO_MODE 无关：种子可以单独打开，固定 ticket 必须整组出现。
 */
export function hasCollaborationDemoIdentity(
  config: CollaborationConfig,
): config is CollaborationConfig & CollaborationDemoIdentity {
  return (
    config.DEMO_TOKEN !== undefined &&
    config.DEMO_ACTOR_ID !== undefined &&
    config.DEMO_WORKSPACE_ID !== undefined &&
    config.DEMO_DOCUMENT_ID !== undefined &&
    config.DEMO_ACCESS !== undefined
  );
}

/**
 * 环境变量只在进程边界解析一次。特别是 token 与存储模式不得在业务钩子里临时读取，
 * 否则测试与启动检查可能使用不同配置，并在生产中意外回落到内存实现。
 */
export function readCollaborationConfig(
  environment: NodeJS.ProcessEnv = process.env,
): CollaborationConfig {
  /**
   * 网络入口使用 COLLAB_ 前缀，避免与 API 进程共享根 `.env.local` 时发生端口覆盖。
   * 其余限制参数只属于协作进程，因此可以直接沿用稳定名称。
   */
  return collaborationConfigSchema.parse({
    ...environment,
    HOST: environment.COLLAB_HOST,
    PORT: environment.COLLAB_PORT,
    WEB_ORIGIN: environment.COLLAB_WEB_ORIGIN,
  });
}
