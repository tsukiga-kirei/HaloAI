import { sql } from "drizzle-orm";
import type { HaloDatabase } from "./client";
import { PersistenceError } from "./errors";

type TransactionCallback = Parameters<HaloDatabase["transaction"]>[0];
export type WorkspaceTransaction = Parameters<TransactionCallback>[0];

export interface WorkspaceTransactionContext {
  readonly workspaceId: string;
  readonly actorId: string;
  readonly requestId?: string;
}

const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/iu;

export function assertUuid(value: string, field: string): void {
  if (!uuidPattern.test(value)) {
    throw new PersistenceError("invalid_context", `${field} 必须是 UUID`);
  }
}

/**
 * 每个租户操作都在独立事务里使用 SET LOCAL 写入数据库会话上下文。SET LOCAL 会在提交或
 * 回滚时自动清除，连接回到池中后不会把上一个工作空间泄漏给下一次请求。
 */
export async function withWorkspaceTransaction<T>(
  db: HaloDatabase,
  context: WorkspaceTransactionContext,
  operation: (transaction: WorkspaceTransaction) => Promise<T>,
): Promise<T> {
  assertUuid(context.workspaceId, "workspaceId");
  assertUuid(context.actorId, "actorId");
  if (context.requestId !== undefined && context.requestId.length > 160) {
    throw new PersistenceError("invalid_context", "requestId 长度不能超过 160 个字符");
  }

  return db.transaction(
    async (transaction) => {
      await transaction.execute(sql`
        select
          set_config('haloai.workspace_id', ${context.workspaceId}, true),
          set_config('haloai.actor_id', ${context.actorId}, true),
          set_config('haloai.request_id', ${context.requestId ?? ""}, true)
      `);
      return operation(transaction);
    },
    { isolationLevel: "read committed", accessMode: "read write" },
  );
}
