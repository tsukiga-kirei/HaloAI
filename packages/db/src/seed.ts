import { readdir, readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import postgres from "postgres";
import { shouldApplyDevdata } from "./devdata-policy";

const databaseUrl = process.env.DATABASE_ADMIN_URL;
if (!databaseUrl) throw new Error("写入虚拟数据前必须设置 DATABASE_ADMIN_URL");
if (!shouldApplyDevdata()) {
  console.log("DEMO_MODE 未开启，跳过虚拟数据。");
  process.exit(0);
}

const connection = postgres(databaseUrl, {
  max: 1,
  prepare: false,
  connect_timeout: 5,
  connection: { application_name: "haloai-devdata" },
});
const devdataFolder = fileURLToPath(new URL("../devdata", import.meta.url));

try {
  await connection.unsafe(`
    CREATE TABLE IF NOT EXISTS haloai_devdata_revisions (
      id text PRIMARY KEY,
      applied_at timestamptz NOT NULL DEFAULT now()
    )
  `);

  const files = (await readdir(devdataFolder))
    .filter((name) => /^V\d+__.+\.sql$/u.test(name))
    .sort((left, right) => left.localeCompare(right));

  for (const file of files) {
    const applied = await connection<{ id: string }[]>`
      SELECT id FROM haloai_devdata_revisions WHERE id = ${file}
    `;
    if (applied.length > 0) {
      console.log(`虚拟数据已存在，跳过 ${file}`);
      continue;
    }

    const sql = await readFile(new URL(`../devdata/${file}`, import.meta.url), "utf8");
    await connection.begin(async (transaction) => {
      await transaction.unsafe(sql);
      await transaction`INSERT INTO haloai_devdata_revisions (id) VALUES (${file})`;
    });
    console.log(`已写入虚拟数据 ${file}`);
  }

  console.log("HaloAI 本地虚拟数据准备完成。");
} finally {
  await connection.end({ timeout: 5 });
}
