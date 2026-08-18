import { createServiceLogger, safeErrorFields } from "@haloai/logger";
import { runMigrations } from "graphile-worker";
import { Pool } from "pg";
import { createGraphileLogger } from "./logger";
import { readWorkerMigrationConfig } from "./migration-config";

function quoteIdentifier(identifier: string): string {
  return `"${identifier.replaceAll('"', '""')}"`;
}

async function main(): Promise<void> {
  const config = readWorkerMigrationConfig();
  const logger = createServiceLogger({
    service: "worker-migrate",
    environment: "production",
    level: config.LOG_LEVEL,
  });
  const graphileLogger = createGraphileLogger(logger);

  /**
   * Graphile Worker 的进程入口每次启动都会检查迁移。DDL 只允许在这个受控管理员生命周期执行；
   * 运行账号只获得队列表、序列与函数的使用权。未来依赖升级若带来新迁移，Worker 会先失败，直到
   * 本任务完成升级并重新授予权限，而不会静默把应用账号扩成 schema owner。
   */
  await runMigrations({
    connectionString: config.DATABASE_ADMIN_URL,
    schema: config.GRAPHILE_WORKER_SCHEMA,
    logger: graphileLogger,
  });

  const pool = new Pool({ connectionString: config.DATABASE_ADMIN_URL, max: 1 });
  const client = await pool.connect();
  const schema = quoteIdentifier(config.GRAPHILE_WORKER_SCHEMA);
  const applicationRole = quoteIdentifier(config.HALOAI_APP_USER);
  try {
    await client.query("begin");
    await client.query(`grant usage on schema ${schema} to ${applicationRole}`);
    await client.query(
      `grant select, insert, update, delete on all tables in schema ${schema} to ${applicationRole}`,
    );
    await client.query(
      `grant usage, select, update on all sequences in schema ${schema} to ${applicationRole}`,
    );
    await client.query(`grant execute on all functions in schema ${schema} to ${applicationRole}`);
    await client.query(
      `alter default privileges in schema ${schema} grant select, insert, update, delete on tables to ${applicationRole}`,
    );
    await client.query(
      `alter default privileges in schema ${schema} grant usage, select, update on sequences to ${applicationRole}`,
    );
    await client.query(
      `alter default privileges in schema ${schema} grant execute on functions to ${applicationRole}`,
    );
    await client.query("commit");
  } catch (error) {
    await client.query("rollback");
    throw error;
  } finally {
    client.release();
    await pool.end();
  }

  logger.info({ schema: config.GRAPHILE_WORKER_SCHEMA }, "Graphile Worker 迁移完成");
}

try {
  await main();
} catch (error) {
  const logger = createServiceLogger({
    service: "worker-migrate",
    environment: "production",
    level: "info",
  });
  logger.fatal(safeErrorFields(error), "Graphile Worker 迁移失败");
  process.exitCode = 1;
}
