import { z } from "zod";

const workerConfigSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  DATABASE_URL: z.string().url(),
  LOG_LEVEL: z.enum(["fatal", "error", "warn", "info", "debug", "trace", "silent"]).default("info"),
  LOG_DIR: z.string().trim().min(1).optional(),
  WORKER_CONCURRENCY: z.coerce.number().int().min(1).max(32).default(4),
});

export type WorkerConfig = z.infer<typeof workerConfigSchema>;

export function readWorkerConfig(environment: NodeJS.ProcessEnv = process.env): WorkerConfig {
  return workerConfigSchema.parse(environment);
}
