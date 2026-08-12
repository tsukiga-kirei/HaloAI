import { sql } from "drizzle-orm";
import {
  bigint,
  check,
  foreignKey,
  index,
  integer,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";

import {
  byteaColumn,
  lifecycleColumns,
  workspaceAppendOnlyPolicies,
  workspacePolicy,
} from "./common";
import { projects, rooms } from "./collaboration";
import {
  documentSnapshotKind,
  documentStatus,
  documentUpdateOrigin,
  documentVersionCause,
} from "./enums";
import { actors, workspaces } from "./identity";
import { agentRuns } from "./runtime";

export const documents = pgTable(
  "documents",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    workspaceId: uuid("workspace_id")
      .notNull()
      .references(() => workspaces.id, { onDelete: "cascade" }),
    projectId: uuid("project_id").notNull(),
    roomId: uuid("room_id"),
    ownerActorId: uuid("owner_actor_id").notNull(),
    title: text("title").notNull(),
    status: documentStatus("status").notNull().default("active"),
    documentSchemaVersion: integer("document_schema_version").notNull().default(1),
    archivedAt: timestamp("archived_at", { withTimezone: true, mode: "date" }),
    deletedAt: timestamp("deleted_at", { withTimezone: true, mode: "date" }),
    ...lifecycleColumns(),
  },
  (table) => [
    foreignKey({
      name: "documents_project_fk",
      columns: [table.workspaceId, table.projectId],
      foreignColumns: [projects.workspaceId, projects.id],
    }).onDelete("restrict"),
    foreignKey({
      name: "documents_room_fk",
      columns: [table.workspaceId, table.projectId, table.roomId],
      foreignColumns: [rooms.workspaceId, rooms.projectId, rooms.id],
    }).onDelete("restrict"),
    foreignKey({
      name: "documents_owner_fk",
      columns: [table.workspaceId, table.ownerActorId],
      foreignColumns: [actors.workspaceId, actors.id],
    }).onDelete("restrict"),
    uniqueIndex("documents_workspace_id_unique").on(table.workspaceId, table.id),
    uniqueIndex("documents_workspace_project_id_unique").on(
      table.workspaceId,
      table.projectId,
      table.id,
    ),
    index("documents_project_status_idx").on(table.workspaceId, table.projectId, table.status),
    check("documents_schema_version_check", sql`${table.documentSchemaVersion} > 0`),
    workspacePolicy("documents_tenant", table.workspaceId),
  ],
);

/**
 * Yjs update 是协作文档权威日志的一部分，只追加不可改写。
 * clientMutationId 用于重连幂等；二进制正文受大小限制，并与普通 JSON 投影分离。
 */
export const yjsUpdates = pgTable(
  "yjs_updates",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    workspaceId: uuid("workspace_id")
      .notNull()
      .references(() => workspaces.id, { onDelete: "cascade" }),
    documentId: uuid("document_id").notNull(),
    sequence: bigint("sequence", { mode: "number" }).notNull(),
    update: byteaColumn("update").notNull(),
    updateDigest: text("update_digest").notNull(),
    actorId: uuid("actor_id").notNull(),
    origin: documentUpdateOrigin("origin").notNull(),
    clientMutationId: uuid("client_mutation_id"),
    runId: uuid("run_id"),
    transactionOrigin: varchar("transaction_origin", { length: 160 }).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true, mode: "date" }).notNull().defaultNow(),
  },
  (table) => [
    foreignKey({
      name: "yjs_updates_document_fk",
      columns: [table.workspaceId, table.documentId],
      foreignColumns: [documents.workspaceId, documents.id],
    }).onDelete("cascade"),
    foreignKey({
      name: "yjs_updates_actor_fk",
      columns: [table.workspaceId, table.actorId],
      foreignColumns: [actors.workspaceId, actors.id],
    }).onDelete("restrict"),
    foreignKey({
      name: "yjs_updates_run_fk",
      columns: [table.workspaceId, table.runId],
      foreignColumns: [agentRuns.workspaceId, agentRuns.id],
    }).onDelete("restrict"),
    uniqueIndex("yjs_updates_workspace_id_unique").on(table.workspaceId, table.id),
    uniqueIndex("yjs_updates_document_sequence_unique").on(
      table.workspaceId,
      table.documentId,
      table.sequence,
    ),
    uniqueIndex("yjs_updates_client_mutation_unique")
      .on(table.workspaceId, table.documentId, table.actorId, table.clientMutationId)
      .where(sql`${table.clientMutationId} is not null`),
    index("yjs_updates_document_time_idx").on(table.workspaceId, table.documentId, table.createdAt),
    check(
      "yjs_updates_size_sequence_check",
      sql`${table.sequence} > 0 and octet_length(${table.update}) between 1 and 1048576`,
    ),
    ...workspaceAppendOnlyPolicies("yjs_updates", table.workspaceId),
  ],
);

/**
 * Snapshot 是 Yjs 二进制检查点，不从 JSON 投影反向重建。
 * working/checkpoint/version 都新增一行；投影失败时仍可从快照和后续 update 恢复。
 */
export const yjsSnapshots = pgTable(
  "yjs_snapshots",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    workspaceId: uuid("workspace_id")
      .notNull()
      .references(() => workspaces.id, { onDelete: "cascade" }),
    documentId: uuid("document_id").notNull(),
    snapshotSequence: bigint("snapshot_sequence", { mode: "number" }).notNull(),
    lastUpdateSequence: bigint("last_update_sequence", { mode: "number" }).notNull(),
    kind: documentSnapshotKind("kind").notNull(),
    state: byteaColumn("state").notNull(),
    stateVector: byteaColumn("state_vector").notNull(),
    stateDigest: text("state_digest").notNull(),
    documentSchemaVersion: integer("document_schema_version").notNull(),
    createdByActorId: uuid("created_by_actor_id").notNull(),
    runId: uuid("run_id"),
    createdAt: timestamp("created_at", { withTimezone: true, mode: "date" }).notNull().defaultNow(),
  },
  (table) => [
    foreignKey({
      name: "yjs_snapshots_document_fk",
      columns: [table.workspaceId, table.documentId],
      foreignColumns: [documents.workspaceId, documents.id],
    }).onDelete("cascade"),
    foreignKey({
      name: "yjs_snapshots_creator_fk",
      columns: [table.workspaceId, table.createdByActorId],
      foreignColumns: [actors.workspaceId, actors.id],
    }).onDelete("restrict"),
    foreignKey({
      name: "yjs_snapshots_run_fk",
      columns: [table.workspaceId, table.runId],
      foreignColumns: [agentRuns.workspaceId, agentRuns.id],
    }).onDelete("restrict"),
    uniqueIndex("yjs_snapshots_workspace_id_unique").on(table.workspaceId, table.id),
    uniqueIndex("yjs_snapshots_workspace_document_id_unique").on(
      table.workspaceId,
      table.documentId,
      table.id,
    ),
    uniqueIndex("yjs_snapshots_document_sequence_unique").on(
      table.workspaceId,
      table.documentId,
      table.snapshotSequence,
    ),
    index("yjs_snapshots_latest_idx").on(
      table.workspaceId,
      table.documentId,
      table.snapshotSequence,
    ),
    check(
      "yjs_snapshots_values_check",
      sql`${table.snapshotSequence} > 0 and ${table.lastUpdateSequence} >= 0 and ${table.documentSchemaVersion} > 0 and octet_length(${table.state}) between 1 and 20971520`,
    ),
    ...workspaceAppendOnlyPolicies("yjs_snapshots", table.workspaceId),
  ],
);

/**
 * DocumentVersion 是不可变命名检查点。它引用权威 Yjs Snapshot 和派生投影位置，
 * 不在版本行复制任意 HTML；恢复操作必须创建新版本，禁止覆盖历史版本。
 */
export const documentVersions = pgTable(
  "document_versions",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    workspaceId: uuid("workspace_id")
      .notNull()
      .references(() => workspaces.id, { onDelete: "cascade" }),
    documentId: uuid("document_id").notNull(),
    versionNumber: integer("version_number").notNull(),
    name: text("name").notNull().default(""),
    cause: documentVersionCause("cause").notNull(),
    snapshotId: uuid("snapshot_id").notNull(),
    contentDigest: text("content_digest").notNull(),
    richTextProjectionRef: text("rich_text_projection_ref"),
    plainTextDigest: text("plain_text_digest"),
    createdByActorId: uuid("created_by_actor_id").notNull(),
    runId: uuid("run_id"),
    createdAt: timestamp("created_at", { withTimezone: true, mode: "date" }).notNull().defaultNow(),
  },
  (table) => [
    foreignKey({
      name: "document_versions_document_fk",
      columns: [table.workspaceId, table.documentId],
      foreignColumns: [documents.workspaceId, documents.id],
    }).onDelete("cascade"),
    foreignKey({
      name: "document_versions_snapshot_fk",
      columns: [table.workspaceId, table.documentId, table.snapshotId],
      foreignColumns: [yjsSnapshots.workspaceId, yjsSnapshots.documentId, yjsSnapshots.id],
    }).onDelete("restrict"),
    foreignKey({
      name: "document_versions_creator_fk",
      columns: [table.workspaceId, table.createdByActorId],
      foreignColumns: [actors.workspaceId, actors.id],
    }).onDelete("restrict"),
    foreignKey({
      name: "document_versions_run_fk",
      columns: [table.workspaceId, table.runId],
      foreignColumns: [agentRuns.workspaceId, agentRuns.id],
    }).onDelete("restrict"),
    uniqueIndex("document_versions_workspace_id_unique").on(table.workspaceId, table.id),
    uniqueIndex("document_versions_workspace_document_id_unique").on(
      table.workspaceId,
      table.documentId,
      table.id,
    ),
    uniqueIndex("document_versions_number_unique").on(
      table.workspaceId,
      table.documentId,
      table.versionNumber,
    ),
    check("document_versions_number_positive_check", sql`${table.versionNumber} > 0`),
    ...workspaceAppendOnlyPolicies("document_versions", table.workspaceId),
  ],
);
