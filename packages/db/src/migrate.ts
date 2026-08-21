import { fileURLToPath } from "node:url";
import { createServiceLogger, safeErrorFields, type HaloLogLevel } from "@haloai/logger";
import { drizzle } from "drizzle-orm/postgres-js";
import { migrate } from "drizzle-orm/postgres-js/migrator";
import postgres from "postgres";

/**
 * 结构迁移使用管理员连接，且只在显式 CLI 中运行。日志不得打印连接串或 SQL 原文。
 */
const databaseUrl = process.env.DATABASE_ADMIN_URL;
if (!databaseUrl) throw new Error("运行数据库迁移前必须设置 DATABASE_ADMIN_URL");

const logger = createServiceLogger({
  service: "db-migrate",
  environment: process.env.NODE_ENV === "production" ? "production" : "development",
  level: (process.env.LOG_LEVEL as HaloLogLevel | undefined) ?? "info",
  logDirectory: process.env.LOG_DIR,
});

const connection = postgres(databaseUrl, {
  max: 1,
  prepare: false,
  connect_timeout: 5,
  connection: { application_name: "haloai-migrator" },
});

try {
  await migrate(drizzle(connection), {
    migrationsFolder: fileURLToPath(new URL("../drizzle", import.meta.url)),
  });
  logger.info("HaloAI 数据库迁移完成");
} catch (error) {
  logger.fatal(safeErrorFields(error), "HaloAI 数据库迁移失败");
  process.exitCode = 1;
} finally {
  await connection.end({ timeout: 5 });
}
