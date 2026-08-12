import { drizzle, type PostgresJsDatabase } from "drizzle-orm/postgres-js";
import postgres, { type Sql } from "postgres";
import * as schema from "./schema/index";

export type HaloDatabase = PostgresJsDatabase<typeof schema>;

export interface DatabaseClient {
  readonly db: HaloDatabase;
  readonly connection: Sql;
  close(): Promise<void>;
}

export interface DatabaseClientOptions {
  readonly url: string;
  readonly applicationName?: string;
  readonly maxConnections?: number;
  readonly connectTimeoutSeconds?: number;
  readonly idleTimeoutSeconds?: number;
}

function assertPostgresUrl(value: string): void {
  let url: URL;
  try {
    url = new URL(value);
  } catch (error) {
    throw new TypeError("数据库连接地址不是合法 URL", { cause: error });
  }
  if (url.protocol !== "postgres:" && url.protocol !== "postgresql:") {
    throw new TypeError("数据库连接地址必须使用 postgres 或 postgresql 协议");
  }
  if (!url.hostname || !url.pathname.slice(1)) {
    throw new TypeError("数据库连接地址必须包含主机与数据库名称");
  }
}

/**
 * 连接池只在进程组合根创建一次。Repository 接收带租户上下文的事务，不能直接持有连接池，
 * 从结构上阻止忘记 SET LOCAL 后执行租户查询。
 */
export function createDatabaseClient(options: DatabaseClientOptions): DatabaseClient {
  assertPostgresUrl(options.url);
  const connection = postgres(options.url, {
    max: options.maxConnections ?? 10,
    connect_timeout: options.connectTimeoutSeconds ?? 5,
    idle_timeout: options.idleTimeoutSeconds ?? 20,
    prepare: false,
    connection: {
      application_name: options.applicationName ?? "haloai",
    },
  });
  const db = drizzle(connection, { schema });

  return {
    db,
    connection,
    async close() {
      await connection.end({ timeout: 5 });
    },
  };
}
