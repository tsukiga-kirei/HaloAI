import { fileURLToPath } from "node:url";
import { drizzle } from "drizzle-orm/postgres-js";
import { migrate } from "drizzle-orm/postgres-js/migrator";
import postgres from "postgres";

const databaseUrl = process.env.DATABASE_ADMIN_URL;
if (!databaseUrl) throw new Error("运行数据库迁移前必须设置 DATABASE_ADMIN_URL");

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
  console.log("HaloAI 数据库迁移完成。");
} finally {
  await connection.end({ timeout: 5 });
}
