import { sql } from "drizzle-orm";
import {
  check,
  index,
  integer,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";

import { lifecycleColumns, sanitizedJsonColumn, workspacePolicy } from "./common";
import { outboxStatus } from "./enums";
import { workspaces } from "./identity";

/**
 * 领域写入与 Outbox 行必须处于同一数据库事务；发布器以 eventId/idempotencyKey 至少一次投递。
 * payload 只允许稳定事件契约和脱敏引用，不得包含密钥、完整 prompt 或大块文档正文。
 */
export const outboxEvents = pgTable(
  "outbox_events",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    workspaceId: uuid("workspace_id")
      .notNull()
      .references(() => workspaces.id, { onDelete: "cascade" }),
    eventId: uuid("event_id").notNull().defaultRandom(),
    aggregateType: varchar("aggregate_type", { length: 96 }).notNull(),
    aggregateId: text("aggregate_id").notNull(),
    eventType: varchar("event_type", { length: 160 }).notNull(),
    schemaVersion: integer("schema_version").notNull().default(1),
    payload: sanitizedJsonColumn("payload"),
    status: outboxStatus("status").notNull().default("pending"),
    attempts: integer("attempts").notNull().default(0),
    idempotencyKey: varchar("idempotency_key", { length: 200 }).notNull(),
    availableAt: timestamp("available_at", { withTimezone: true, mode: "date" })
      .notNull()
      .defaultNow(),
    leaseOwner: text("lease_owner"),
    leaseExpiresAt: timestamp("lease_expires_at", { withTimezone: true, mode: "date" }),
    publishedAt: timestamp("published_at", { withTimezone: true, mode: "date" }),
    lastErrorCode: varchar("last_error_code", { length: 120 }),
    ...lifecycleColumns(),
  },
  (table) => [
    uniqueIndex("outbox_events_workspace_id_unique").on(table.workspaceId, table.id),
    uniqueIndex("outbox_events_event_id_unique").on(table.workspaceId, table.eventId),
    uniqueIndex("outbox_events_idempotency_unique").on(table.workspaceId, table.idempotencyKey),
    index("outbox_events_dispatch_idx").on(
      table.status,
      table.availableAt,
      table.leaseExpiresAt,
    ),
    index("outbox_events_aggregate_idx").on(
      table.workspaceId,
      table.aggregateType,
      table.aggregateId,
      table.createdAt,
    ),
    check(
      "outbox_events_values_check",
      sql`${table.schemaVersion} > 0 and ${table.attempts} >= 0`,
    ),
    check(
      "outbox_events_publish_check",
      sql`((${table.status} = 'published' and ${table.publishedAt} is not null) or (${table.status} <> 'published' and ${table.publishedAt} is null))`,
    ),
    workspacePolicy("outbox_events_tenant", table.workspaceId),
  ],
);
