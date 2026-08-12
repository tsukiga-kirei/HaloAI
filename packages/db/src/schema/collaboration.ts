import { sql } from "drizzle-orm";
import {
  bigint,
  boolean,
  check,
  foreignKey,
  index,
  integer,
  jsonb,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";

import {
  type MessagePart,
  lifecycleColumns,
  workspaceAppendOnlyPolicies,
  workspacePolicy,
} from "./common";
import {
  collaborationMode,
  membershipStatus,
  messageKind,
  messageStatus,
  projectStatus,
  roomStatus,
  roomVisibility,
} from "./enums";
import { actors, workspaces } from "./identity";

export const projects = pgTable(
  "projects",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    workspaceId: uuid("workspace_id")
      .notNull()
      .references(() => workspaces.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    description: text("description").notNull().default(""),
    goal: text("goal").notNull().default(""),
    expectedArtifact: text("expected_artifact").notNull().default(""),
    completionCriteria: text("completion_criteria").notNull().default(""),
    status: projectStatus("status").notNull().default("active"),
    createdByActorId: uuid("created_by_actor_id").notNull(),
    archivedAt: timestamp("archived_at", { withTimezone: true, mode: "date" }),
    ...lifecycleColumns(),
  },
  (table) => [
    foreignKey({
      name: "projects_creator_fk",
      columns: [table.workspaceId, table.createdByActorId],
      foreignColumns: [actors.workspaceId, actors.id],
    }).onDelete("restrict"),
    uniqueIndex("projects_workspace_id_unique").on(table.workspaceId, table.id),
    index("projects_workspace_status_idx").on(table.workspaceId, table.status),
    workspacePolicy("projects_tenant", table.workspaceId),
  ],
);

export const projectMemberships = pgTable(
  "project_memberships",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    workspaceId: uuid("workspace_id")
      .notNull()
      .references(() => workspaces.id, { onDelete: "cascade" }),
    projectId: uuid("project_id").notNull(),
    actorId: uuid("actor_id").notNull(),
    status: membershipStatus("status").notNull().default("active"),
    addedByActorId: uuid("added_by_actor_id").notNull(),
    joinedAt: timestamp("joined_at", { withTimezone: true, mode: "date" }).notNull().defaultNow(),
    leftAt: timestamp("left_at", { withTimezone: true, mode: "date" }),
    ...lifecycleColumns(),
  },
  (table) => [
    foreignKey({
      name: "project_memberships_project_fk",
      columns: [table.workspaceId, table.projectId],
      foreignColumns: [projects.workspaceId, projects.id],
    }).onDelete("cascade"),
    foreignKey({
      name: "project_memberships_actor_fk",
      columns: [table.workspaceId, table.actorId],
      foreignColumns: [actors.workspaceId, actors.id],
    }).onDelete("cascade"),
    foreignKey({
      name: "project_memberships_adder_fk",
      columns: [table.workspaceId, table.addedByActorId],
      foreignColumns: [actors.workspaceId, actors.id],
    }).onDelete("restrict"),
    uniqueIndex("project_memberships_workspace_id_unique").on(table.workspaceId, table.id),
    uniqueIndex("project_memberships_actor_unique").on(
      table.workspaceId,
      table.projectId,
      table.actorId,
    ),
    index("project_memberships_lookup_idx").on(table.workspaceId, table.projectId, table.status),
    workspacePolicy("project_memberships_tenant", table.workspaceId),
  ],
);

export const rooms = pgTable(
  "rooms",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    workspaceId: uuid("workspace_id")
      .notNull()
      .references(() => workspaces.id, { onDelete: "cascade" }),
    projectId: uuid("project_id").notNull(),
    name: text("name").notNull(),
    goal: text("goal").notNull().default(""),
    expectedArtifact: text("expected_artifact").notNull().default(""),
    completionCriteria: text("completion_criteria").notNull().default(""),
    visibility: roomVisibility("visibility").notNull().default("private"),
    status: roomStatus("status").notNull().default("active"),
    collaborationMode: collaborationMode("collaboration_mode").notNull().default("mention"),
    createdByActorId: uuid("created_by_actor_id").notNull(),
    lastSequence: bigint("last_sequence", { mode: "number" }).notNull().default(0),
    archivedAt: timestamp("archived_at", { withTimezone: true, mode: "date" }),
    ...lifecycleColumns(),
  },
  (table) => [
    foreignKey({
      name: "rooms_project_fk",
      columns: [table.workspaceId, table.projectId],
      foreignColumns: [projects.workspaceId, projects.id],
    }).onDelete("cascade"),
    foreignKey({
      name: "rooms_creator_fk",
      columns: [table.workspaceId, table.createdByActorId],
      foreignColumns: [actors.workspaceId, actors.id],
    }).onDelete("restrict"),
    uniqueIndex("rooms_workspace_id_unique").on(table.workspaceId, table.id),
    uniqueIndex("rooms_workspace_project_id_unique").on(
      table.workspaceId,
      table.projectId,
      table.id,
    ),
    index("rooms_project_status_idx").on(table.workspaceId, table.projectId, table.status),
    check("rooms_last_sequence_check", sql`${table.lastSequence} >= 0`),
    workspacePolicy("rooms_tenant", table.workspaceId),
  ],
);

export const roomMemberships = pgTable(
  "room_memberships",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    workspaceId: uuid("workspace_id")
      .notNull()
      .references(() => workspaces.id, { onDelete: "cascade" }),
    roomId: uuid("room_id").notNull(),
    actorId: uuid("actor_id").notNull(),
    status: membershipStatus("status").notNull().default("active"),
    addedByActorId: uuid("added_by_actor_id").notNull(),
    muted: boolean("muted").notNull().default(false),
    lastReadSequence: bigint("last_read_sequence", { mode: "number" }).notNull().default(0),
    joinedAt: timestamp("joined_at", { withTimezone: true, mode: "date" }).notNull().defaultNow(),
    leftAt: timestamp("left_at", { withTimezone: true, mode: "date" }),
    ...lifecycleColumns(),
  },
  (table) => [
    foreignKey({
      name: "room_memberships_room_fk",
      columns: [table.workspaceId, table.roomId],
      foreignColumns: [rooms.workspaceId, rooms.id],
    }).onDelete("cascade"),
    foreignKey({
      name: "room_memberships_actor_fk",
      columns: [table.workspaceId, table.actorId],
      foreignColumns: [actors.workspaceId, actors.id],
    }).onDelete("cascade"),
    foreignKey({
      name: "room_memberships_adder_fk",
      columns: [table.workspaceId, table.addedByActorId],
      foreignColumns: [actors.workspaceId, actors.id],
    }).onDelete("restrict"),
    uniqueIndex("room_memberships_workspace_id_unique").on(table.workspaceId, table.id),
    uniqueIndex("room_memberships_actor_unique").on(table.workspaceId, table.roomId, table.actorId),
    index("room_memberships_lookup_idx").on(table.workspaceId, table.roomId, table.status),
    check("room_memberships_last_read_check", sql`${table.lastReadSequence} >= 0`),
    workspacePolicy("room_memberships_tenant", table.workspaceId),
  ],
);

/**
 * Message 是不可变事实。status 只描述插入时内容是否 complete/partial；
 * 编辑写 MessageRevision，删除写 MessageTombstone，禁止原地覆盖正文或更新为墓碑。
 */
export const messages = pgTable(
  "messages",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    workspaceId: uuid("workspace_id")
      .notNull()
      .references(() => workspaces.id, { onDelete: "cascade" }),
    roomId: uuid("room_id").notNull(),
    authorActorId: uuid("author_actor_id").notNull(),
    sequence: bigint("sequence", { mode: "number" }).notNull(),
    clientMutationId: uuid("client_mutation_id").notNull(),
    replyToMessageId: uuid("reply_to_message_id"),
    threadRootId: uuid("thread_root_id"),
    kind: messageKind("kind").notNull().default("text"),
    status: messageStatus("status").notNull().default("complete"),
    parts: jsonb("parts").$type<MessagePart[]>().notNull().default([]),
    contentDigest: text("content_digest").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true, mode: "date" }).notNull().defaultNow(),
  },
  (table) => [
    foreignKey({
      name: "messages_room_fk",
      columns: [table.workspaceId, table.roomId],
      foreignColumns: [rooms.workspaceId, rooms.id],
    }).onDelete("cascade"),
    foreignKey({
      name: "messages_author_fk",
      columns: [table.workspaceId, table.authorActorId],
      foreignColumns: [actors.workspaceId, actors.id],
    }).onDelete("restrict"),
    foreignKey({
      name: "messages_reply_fk",
      columns: [table.workspaceId, table.roomId, table.replyToMessageId],
      foreignColumns: [table.workspaceId, table.roomId, table.id],
    }).onDelete("restrict"),
    foreignKey({
      name: "messages_thread_root_fk",
      columns: [table.workspaceId, table.roomId, table.threadRootId],
      foreignColumns: [table.workspaceId, table.roomId, table.id],
    }).onDelete("restrict"),
    uniqueIndex("messages_workspace_id_unique").on(table.workspaceId, table.id),
    uniqueIndex("messages_workspace_room_id_unique").on(table.workspaceId, table.roomId, table.id),
    uniqueIndex("messages_room_sequence_unique").on(
      table.workspaceId,
      table.roomId,
      table.sequence,
    ),
    uniqueIndex("messages_client_mutation_unique").on(
      table.workspaceId,
      table.roomId,
      table.authorActorId,
      table.clientMutationId,
    ),
    index("messages_room_time_idx").on(table.workspaceId, table.roomId, table.createdAt),
    check("messages_sequence_positive_check", sql`${table.sequence} > 0`),
    ...workspaceAppendOnlyPolicies("messages", table.workspaceId),
  ],
);

/** 消息修订仅追加；revisionNumber 在单条消息内严格递增，由事务锁保证分配。 */
export const messageRevisions = pgTable(
  "message_revisions",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    workspaceId: uuid("workspace_id")
      .notNull()
      .references(() => workspaces.id, { onDelete: "cascade" }),
    messageId: uuid("message_id").notNull(),
    revisionNumber: integer("revision_number").notNull(),
    editedByActorId: uuid("edited_by_actor_id").notNull(),
    parts: jsonb("parts").$type<MessagePart[]>().notNull(),
    contentDigest: text("content_digest").notNull(),
    reason: text("reason").notNull().default(""),
    createdAt: timestamp("created_at", { withTimezone: true, mode: "date" }).notNull().defaultNow(),
  },
  (table) => [
    foreignKey({
      name: "message_revisions_message_fk",
      columns: [table.workspaceId, table.messageId],
      foreignColumns: [messages.workspaceId, messages.id],
    }).onDelete("cascade"),
    foreignKey({
      name: "message_revisions_editor_fk",
      columns: [table.workspaceId, table.editedByActorId],
      foreignColumns: [actors.workspaceId, actors.id],
    }).onDelete("restrict"),
    uniqueIndex("message_revisions_workspace_id_unique").on(table.workspaceId, table.id),
    uniqueIndex("message_revisions_number_unique").on(
      table.workspaceId,
      table.messageId,
      table.revisionNumber,
    ),
    check("message_revisions_number_positive_check", sql`${table.revisionNumber} > 0`),
    ...workspaceAppendOnlyPolicies("message_revisions", table.workspaceId),
  ],
);

/** Tombstone 只保存最小删除事实，绝不复制被隐藏的消息正文。 */
export const messageTombstones = pgTable(
  "message_tombstones",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    workspaceId: uuid("workspace_id")
      .notNull()
      .references(() => workspaces.id, { onDelete: "cascade" }),
    messageId: uuid("message_id").notNull(),
    tombstonedByActorId: uuid("tombstoned_by_actor_id").notNull(),
    reasonCode: varchar("reason_code", { length: 96 }).notNull(),
    erasureJobReference: text("erasure_job_reference"),
    createdAt: timestamp("created_at", { withTimezone: true, mode: "date" }).notNull().defaultNow(),
  },
  (table) => [
    foreignKey({
      name: "message_tombstones_message_fk",
      columns: [table.workspaceId, table.messageId],
      foreignColumns: [messages.workspaceId, messages.id],
    }).onDelete("cascade"),
    foreignKey({
      name: "message_tombstones_actor_fk",
      columns: [table.workspaceId, table.tombstonedByActorId],
      foreignColumns: [actors.workspaceId, actors.id],
    }).onDelete("restrict"),
    uniqueIndex("message_tombstones_workspace_id_unique").on(table.workspaceId, table.id),
    uniqueIndex("message_tombstones_message_unique").on(table.workspaceId, table.messageId),
    ...workspaceAppendOnlyPolicies("message_tombstones", table.workspaceId),
  ],
);

/**
 * Mention 在消息事务中按结构化节点保存。运行时只消费该关系，
 * 禁止事后从显示文本猜测 Agent 名称。
 */
export const mentions = pgTable(
  "mentions",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    workspaceId: uuid("workspace_id")
      .notNull()
      .references(() => workspaces.id, { onDelete: "cascade" }),
    messageId: uuid("message_id").notNull(),
    targetActorId: uuid("target_actor_id").notNull(),
    semanticNodeId: varchar("semantic_node_id", { length: 160 }).notNull(),
    rangeStart: integer("range_start"),
    rangeEnd: integer("range_end"),
    createdAt: timestamp("created_at", { withTimezone: true, mode: "date" }).notNull().defaultNow(),
  },
  (table) => [
    foreignKey({
      name: "mentions_message_fk",
      columns: [table.workspaceId, table.messageId],
      foreignColumns: [messages.workspaceId, messages.id],
    }).onDelete("cascade"),
    foreignKey({
      name: "mentions_target_actor_fk",
      columns: [table.workspaceId, table.targetActorId],
      foreignColumns: [actors.workspaceId, actors.id],
    }).onDelete("restrict"),
    uniqueIndex("mentions_workspace_id_unique").on(table.workspaceId, table.id),
    uniqueIndex("mentions_semantic_node_unique").on(
      table.workspaceId,
      table.messageId,
      table.targetActorId,
      table.semanticNodeId,
    ),
    index("mentions_target_idx").on(table.workspaceId, table.targetActorId, table.createdAt),
    check(
      "mentions_range_check",
      sql`((${table.rangeStart} is null and ${table.rangeEnd} is null) or (${table.rangeStart} >= 0 and ${table.rangeEnd} > ${table.rangeStart}))`,
    ),
    ...workspaceAppendOnlyPolicies("mentions", table.workspaceId),
  ],
);
