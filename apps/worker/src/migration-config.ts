import { z } from "zod";

const IdentifierSchema = z.string().regex(/^[a-zA-Z_][a-zA-Z0-9_]*$/u);

const migrationConfigSchema = z.object({
  DATABASE_ADMIN_URL: z.string().url(),
  HALOAI_APP_USER: IdentifierSchema,
  GRAPHILE_WORKER_SCHEMA: IdentifierSchema.default("graphile_worker"),
  LOG_LEVEL: z.enum(["fatal", "error", "warn", "info", "debug", "trace", "silent"]).default("info"),
});

export type WorkerMigrationConfig = z.infer<typeof migrationConfigSchema>;

/** 角色名和 schema 名最终进入管理员 SQL 标识符位置，必须在进程边界拒绝任何可注入字符。 */
export function readWorkerMigrationConfig(
  environment: NodeJS.ProcessEnv = process.env,
): WorkerMigrationConfig {
  return migrationConfigSchema.parse(environment);
}
