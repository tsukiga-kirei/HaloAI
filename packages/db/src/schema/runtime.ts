import { sql } from "drizzle-orm";
import {
  bigint,
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

import { agentActors, agentVersions } from "./agents";
import {
  type BudgetPolicySnapshot,
  lifecycleColumns,
  sanitizedJsonColumn,
  workspaceAppendOnlyPolicies,
  workspacePolicy,
} from "./common";
import { messages, projects, rooms } from "./collaboration";
import { eventDurability, runMessageRole, runStatus, runStepKind, runStepStatus } from "./enums";
import { actors, workspaces } from "./identity";

/**
 * AgentRun 是一次可恢复尝试。状态迁移必须持有 expected stateVersion；
 * 终态禁止回到运行态，重试创建 parentRunId 指向的新行。
 * authorizationSnapshot 只记录启动边界，恢复、检索、工具和发布仍需重新授权。
 */
export const agentRuns = pgTable(
  "agent_runs",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    workspaceId: uuid("workspace_id")
      .notNull()
      .references(() => workspaces.id, { onDelete: "cascade" }),
    projectId: uuid("project_id").notNull(),
    roomId: uuid("room_id").notNull(),
    agentActorId: uuid("agent_actor_id").notNull(),
    agentVersionId: uuid("agent_version_id").notNull(),
    delegatedByActorId: uuid("delegated_by_actor_id").notNull(),
    parentRunId: uuid("parent_run_id"),
    triggerMessageId: uuid("trigger_message_id"),
    idempotencyKey: varchar("idempotency_key", { length: 200 }).notNull(),
    purpose: text("purpose").notNull().default(""),
    status: runStatus("status").notNull().default("created"),
    stateVersion: integer("state_version").notNull().default(0),
    attempt: integer("attempt").notNull().default(0),
    authorizationSnapshotRef: text("authorization_snapshot_ref").notNull(),
    authorizationSnapshotDigest: text("authorization_snapshot_digest").notNull(),
    policyVersion: text("policy_version").notNull(),
    budgetPolicyVersion: text("budget_policy_version").notNull(),
    budgetPolicy: jsonb("budget_policy").$type<BudgetPolicySnapshot>().notNull(),
    budgetReservationKey: varchar("budget_reservation_key", { length: 200 }).notNull(),
    consumedInputTokens: bigint("consumed_input_tokens", { mode: "number" }).notNull().default(0),
    consumedOutputTokens: bigint("consumed_output_tokens", { mode: "number" }).notNull().default(0),
    consumedCostMinor: bigint("consumed_cost_minor", { mode: "number" }).notNull().default(0),
    completedTurns: integer("completed_turns").notNull().default(0),
    completedToolCalls: integer("completed_tool_calls").notNull().default(0),
    participantCount: integer("participant_count").notNull().default(1),
    deadlineAt: timestamp("deadline_at", { withTimezone: true, mode: "date" }).notNull(),
    leaseOwner: text("lease_owner"),
    leaseExpiresAt: timestamp("lease_expires_at", { withTimezone: true, mode: "date" }),
    heartbeatAt: timestamp("heartbeat_at", { withTimezone: true, mode: "date" }),
    cancelRequestedAt: timestamp("cancel_requested_at", { withTimezone: true, mode: "date" }),
    startedAt: timestamp("started_at", { withTimezone: true, mode: "date" }),
    endedAt: timestamp("ended_at", { withTimezone: true, mode: "date" }),
    resultSummary: text("result_summary"),
    terminalReasonCode: varchar("terminal_reason_code", { length: 120 }),
    ...lifecycleColumns(),
  },
  (table) => [
    foreignKey({
      name: "agent_runs_project_fk",
      columns: [table.workspaceId, table.projectId],
      foreignColumns: [projects.workspaceId, projects.id],
    }).onDelete("restrict"),
    foreignKey({
      name: "agent_runs_room_fk",
      columns: [table.workspaceId, table.projectId, table.roomId],
      foreignColumns: [rooms.workspaceId, rooms.projectId, rooms.id],
    }).onDelete("restrict"),
    foreignKey({
      name: "agent_runs_agent_actor_fk",
      columns: [table.workspaceId, table.agentActorId],
      foreignColumns: [agentActors.workspaceId, agentActors.actorId],
    }).onDelete("restrict"),
    foreignKey({
      name: "agent_runs_agent_version_fk",
      columns: [table.workspaceId, table.agentVersionId],
      foreignColumns: [agentVersions.workspaceId, agentVersions.id],
    }).onDelete("restrict"),
    foreignKey({
      name: "agent_runs_delegator_fk",
      columns: [table.workspaceId, table.delegatedByActorId],
      foreignColumns: [actors.workspaceId, actors.id],
    }).onDelete("restrict"),
    foreignKey({
      name: "agent_runs_parent_fk",
      columns: [table.workspaceId, table.parentRunId],
      foreignColumns: [table.workspaceId, table.id],
    }).onDelete("restrict"),
    foreignKey({
      name: "agent_runs_trigger_message_fk",
      columns: [table.workspaceId, table.roomId, table.triggerMessageId],
      foreignColumns: [messages.workspaceId, messages.roomId, messages.id],
    }).onDelete("restrict"),
    uniqueIndex("agent_runs_workspace_id_unique").on(table.workspaceId, table.id),
    uniqueIndex("agent_runs_idempotency_unique").on(table.workspaceId, table.idempotencyKey),
    index("agent_runs_room_status_idx").on(
      table.workspaceId,
      table.roomId,
      table.status,
      table.createdAt,
    ),
    index("agent_runs_lease_idx").on(table.status, table.leaseExpiresAt),
    check(
      "agent_runs_counters_nonnegative_check",
      sql`${table.stateVersion} >= 0 and ${table.attempt} >= 0 and ${table.consumedInputTokens} >= 0 and ${table.consumedOutputTokens} >= 0 and ${table.consumedCostMinor} >= 0 and ${table.completedTurns} >= 0 and ${table.completedToolCalls} >= 0 and ${table.participantCount} > 0`,
    ),
    workspacePolicy("agent_runs_tenant", table.workspaceId),
  ],
);

/**
 * RunEvent 是 SSE 与重放的仅追加事实。payload 只能保存版本化、已授权的展示数据
 * 或资源引用；禁止保存隐藏思维链、完整提示词、凭据或不受限工具响应。
 */
export const runEvents = pgTable(
  "run_events",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    workspaceId: uuid("workspace_id")
      .notNull()
      .references(() => workspaces.id, { onDelete: "cascade" }),
    runId: uuid("run_id").notNull(),
    streamId: uuid("stream_id").notNull(),
    sequence: bigint("sequence", { mode: "number" }).notNull(),
    type: varchar("type", { length: 160 }).notNull(),
    payloadVersion: integer("payload_version").notNull().default(1),
    payload: sanitizedJsonColumn("payload"),
    durability: eventDurability("durability").notNull().default("durable"),
    actorId: uuid("actor_id").notNull(),
    correlationId: uuid("correlation_id").notNull(),
    causationId: uuid("causation_id"),
    attempt: integer("attempt").notNull().default(0),
    occurredAt: timestamp("occurred_at", { withTimezone: true, mode: "date" })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    foreignKey({
      name: "run_events_run_fk",
      columns: [table.workspaceId, table.runId],
      foreignColumns: [agentRuns.workspaceId, agentRuns.id],
    }).onDelete("cascade"),
    foreignKey({
      name: "run_events_actor_fk",
      columns: [table.workspaceId, table.actorId],
      foreignColumns: [actors.workspaceId, actors.id],
    }).onDelete("restrict"),
    uniqueIndex("run_events_workspace_id_unique").on(table.workspaceId, table.id),
    uniqueIndex("run_events_run_sequence_unique").on(
      table.workspaceId,
      table.runId,
      table.sequence,
    ),
    uniqueIndex("run_events_stream_sequence_unique").on(
      table.workspaceId,
      table.streamId,
      table.sequence,
    ),
    index("run_events_replay_idx").on(table.workspaceId, table.streamId, table.sequence),
    check(
      "run_events_sequence_version_check",
      sql`${table.sequence} > 0 and ${table.payloadVersion} > 0 and ${table.attempt} >= 0`,
    ),
    ...workspaceAppendOnlyPolicies("run_events", table.workspaceId),
  ],
);

/** RunStep 保存恢复所需操作事实，不保存完整模型输入、输出或隐藏推理。 */
export const runSteps = pgTable(
  "run_steps",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    workspaceId: uuid("workspace_id")
      .notNull()
      .references(() => workspaces.id, { onDelete: "cascade" }),
    runId: uuid("run_id").notNull(),
    sequence: integer("sequence").notNull(),
    kind: runStepKind("kind").notNull(),
    status: runStepStatus("status").notNull().default("queued"),
    attempt: integer("attempt").notNull().default(0),
    idempotencyKey: varchar("idempotency_key", { length: 200 }).notNull(),
    inputDigest: text("input_digest"),
    outputDigest: text("output_digest"),
    observableSummary: text("observable_summary").notNull().default(""),
    errorCode: varchar("error_code", { length: 120 }),
    startedAt: timestamp("started_at", { withTimezone: true, mode: "date" }),
    endedAt: timestamp("ended_at", { withTimezone: true, mode: "date" }),
    ...lifecycleColumns(),
  },
  (table) => [
    foreignKey({
      name: "run_steps_run_fk",
      columns: [table.workspaceId, table.runId],
      foreignColumns: [agentRuns.workspaceId, agentRuns.id],
    }).onDelete("cascade"),
    uniqueIndex("run_steps_workspace_id_unique").on(table.workspaceId, table.id),
    uniqueIndex("run_steps_run_sequence_unique").on(table.workspaceId, table.runId, table.sequence),
    uniqueIndex("run_steps_idempotency_unique").on(
      table.workspaceId,
      table.runId,
      table.idempotencyKey,
    ),
    index("run_steps_status_idx").on(table.workspaceId, table.runId, table.status),
    check("run_steps_sequence_attempt_check", sql`${table.sequence} > 0 and ${table.attempt} >= 0`),
    workspacePolicy("run_steps_tenant", table.workspaceId),
  ],
);

/** RunMessage 让触发、输入、输出与部分消息可追溯，同时保持 Message 模块无反向依赖。 */
export const runMessages = pgTable(
  "run_messages",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    workspaceId: uuid("workspace_id")
      .notNull()
      .references(() => workspaces.id, { onDelete: "cascade" }),
    runId: uuid("run_id").notNull(),
    messageId: uuid("message_id").notNull(),
    role: runMessageRole("role").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true, mode: "date" }).notNull().defaultNow(),
  },
  (table) => [
    foreignKey({
      name: "run_messages_run_fk",
      columns: [table.workspaceId, table.runId],
      foreignColumns: [agentRuns.workspaceId, agentRuns.id],
    }).onDelete("cascade"),
    foreignKey({
      name: "run_messages_message_fk",
      columns: [table.workspaceId, table.messageId],
      foreignColumns: [messages.workspaceId, messages.id],
    }).onDelete("restrict"),
    uniqueIndex("run_messages_workspace_id_unique").on(table.workspaceId, table.id),
    uniqueIndex("run_messages_relation_unique").on(
      table.workspaceId,
      table.runId,
      table.messageId,
      table.role,
    ),
    ...workspaceAppendOnlyPolicies("run_messages", table.workspaceId),
  ],
);
