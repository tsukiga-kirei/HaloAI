import { sql } from "drizzle-orm";
import {
  type AnyPgColumn,
  customType,
  integer,
  jsonb,
  pgPolicy,
  text,
  timestamp,
} from "drizzle-orm/pg-core";

export type JsonPrimitive = boolean | number | string | null;
export type JsonValue = JsonPrimitive | JsonValue[] | { [key: string]: JsonValue };
export type JsonObject = { [key: string]: JsonValue };

export interface MessagePart {
  type:
    | "text"
    | "rich_text"
    | "document_reference"
    | "attachment_reference"
    | "citation"
    | "tool_summary"
    | "approval_reference"
    | "system_event";
  data: JsonObject;
}

export interface BudgetPolicySnapshot extends JsonObject {
  maxInputTokens: number;
  maxOutputTokens: number;
  maxTotalTokens: number;
  maxCostMinorUnits: number;
  maxDurationMs: number;
  maxTurns: number;
  maxToolCalls: number;
  maxParticipants: number;
  maxParallelModelCalls: number;
  maxParallelToolCalls: number;
}

export const createdAtColumn = () =>
  timestamp("created_at", { withTimezone: true, mode: "date" }).notNull().defaultNow();

export const lifecycleColumns = () => ({
  createdAt: createdAtColumn(),
  updatedAt: timestamp("updated_at", { withTimezone: true, mode: "date" }).notNull().defaultNow(),
});

export const schemaVersionColumn = () => integer("schema_version").notNull().default(1);
export const digestColumn = (name: string) => text(name).notNull();
export const sanitizedJsonColumn = (name: string) =>
  jsonb(name).$type<JsonObject>().notNull().default({});

/** PostgreSQL bytea 的跨运行时表示；避免把协作文档二进制误转为文本。 */
export const byteaColumn = customType<{ data: Uint8Array; driverData: Uint8Array }>({
  dataType() {
    return "bytea";
  },
});

/**
 * 应用事务必须用 SET LOCAL 写入 haloai.workspace_id。使用 missing_ok=true 时，
 * 未设置上下文会得到 NULL，并由比较表达式自然拒绝；禁止把客户端 tenantId 直接写入该设置。
 */
const workspaceMatches = (workspaceId: AnyPgColumn) =>
  sql`${workspaceId} = nullif(current_setting('haloai.workspace_id', true), '')::uuid`;

/** 普通租户表允许当前工作空间内的操作，资源级授权仍由应用策略再次判定。 */
export const workspacePolicy = (name: string, workspaceId: AnyPgColumn) => {
  const matches = workspaceMatches(workspaceId);
  return pgPolicy(name, {
    as: "permissive",
    for: "all",
    to: "public",
    using: matches,
    withCheck: matches,
  });
};

/**
 * 仅追加表只允许 SELECT/INSERT。普通应用角色没有 UPDATE/DELETE policy，
 * 因而消息事实、事件、审计、用量和 CRDT 日志不能被原地改写。
 */
export const workspaceAppendOnlyPolicies = (prefix: string, workspaceId: AnyPgColumn) => {
  const matches = workspaceMatches(workspaceId);
  return [
    pgPolicy(`${prefix}_select`, {
      as: "permissive",
      for: "select",
      to: "public",
      using: matches,
    }),
    pgPolicy(`${prefix}_insert`, {
      as: "permissive",
      for: "insert",
      to: "public",
      withCheck: matches,
    }),
  ];
};

/**
 * 版本草稿可更新；状态从 draft 变为 published 后，旧行不再满足 UPDATE/DELETE
 * 的 USING 条件。生产迁移还必须确保应用角色不拥有 BYPASSRLS 或表所有者权限。
 */
export const workspaceDraftVersionPolicies = (
  prefix: string,
  workspaceId: AnyPgColumn,
  status: AnyPgColumn,
) => {
  const matches = workspaceMatches(workspaceId);
  const draft = sql`${matches} and ${status} = 'draft'`;
  return [
    pgPolicy(`${prefix}_select`, {
      as: "permissive",
      for: "select",
      to: "public",
      using: matches,
    }),
    pgPolicy(`${prefix}_insert`, {
      as: "permissive",
      for: "insert",
      to: "public",
      withCheck: matches,
    }),
    pgPolicy(`${prefix}_update_draft`, {
      as: "permissive",
      for: "update",
      to: "public",
      using: draft,
      withCheck: matches,
    }),
    pgPolicy(`${prefix}_delete_draft`, {
      as: "permissive",
      for: "delete",
      to: "public",
      using: draft,
    }),
  ];
};
