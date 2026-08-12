import { sql } from "drizzle-orm";
import {
  boolean,
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

import { toolCapabilities } from "./agents";
import {
  lifecycleColumns,
  sanitizedJsonColumn,
  workspaceAppendOnlyPolicies,
  workspacePolicy,
} from "./common";
import {
  contextTrustClass,
  externalEffectStatus,
  policyDecision,
  riskClass,
  toolCallStatus,
} from "./enums";
import { actors, workspaces } from "./identity";
import { agentRuns, runSteps } from "./runtime";

/**
 * ContextManifest 只记录进入运行的授权条目、版本、摘要与裁剪事实，
 * 不保存完整 prompt、附件正文、密钥或未脱敏工具响应。
 */
export const contextManifests = pgTable(
  "context_manifests",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    workspaceId: uuid("workspace_id")
      .notNull()
      .references(() => workspaces.id, { onDelete: "cascade" }),
    runId: uuid("run_id").notNull(),
    stepId: uuid("step_id"),
    policyVersion: text("policy_version").notNull(),
    manifestDigest: text("manifest_digest").notNull(),
    totalItemCount: integer("total_item_count").notNull(),
    includedItemCount: integer("included_item_count").notNull(),
    truncatedItemCount: integer("truncated_item_count").notNull().default(0),
    tokenEstimate: integer("token_estimate").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true, mode: "date" }).notNull().defaultNow(),
  },
  (table) => [
    foreignKey({
      name: "context_manifests_run_fk",
      columns: [table.workspaceId, table.runId],
      foreignColumns: [agentRuns.workspaceId, agentRuns.id],
    }).onDelete("cascade"),
    foreignKey({
      name: "context_manifests_step_fk",
      columns: [table.workspaceId, table.stepId],
      foreignColumns: [runSteps.workspaceId, runSteps.id],
    }).onDelete("restrict"),
    uniqueIndex("context_manifests_workspace_id_unique").on(table.workspaceId, table.id),
    index("context_manifests_run_idx").on(table.workspaceId, table.runId, table.createdAt),
    check(
      "context_manifests_counts_check",
      sql`${table.totalItemCount} >= 0 and ${table.includedItemCount} >= 0 and ${table.truncatedItemCount} >= 0 and ${table.tokenEstimate} >= 0 and ${table.includedItemCount} <= ${table.totalItemCount}`,
    ),
    ...workspaceAppendOnlyPolicies("context_manifests", table.workspaceId),
  ],
);

export const contextManifestItems = pgTable(
  "context_manifest_items",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    workspaceId: uuid("workspace_id")
      .notNull()
      .references(() => workspaces.id, { onDelete: "cascade" }),
    manifestId: uuid("manifest_id").notNull(),
    ordinal: integer("ordinal").notNull(),
    kind: varchar("kind", { length: 96 }).notNull(),
    resourceType: varchar("resource_type", { length: 96 }).notNull(),
    resourceId: text("resource_id").notNull(),
    resourceVersion: text("resource_version"),
    contentDigest: text("content_digest").notNull(),
    tokenEstimate: integer("token_estimate").notNull(),
    trustClass: contextTrustClass("trust_class").notNull(),
    decision: policyDecision("decision").notNull(),
    decisionReasonCode: varchar("decision_reason_code", { length: 120 }).notNull(),
    included: boolean("included").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true, mode: "date" }).notNull().defaultNow(),
  },
  (table) => [
    foreignKey({
      name: "context_manifest_items_manifest_fk",
      columns: [table.workspaceId, table.manifestId],
      foreignColumns: [contextManifests.workspaceId, contextManifests.id],
    }).onDelete("cascade"),
    uniqueIndex("context_manifest_items_workspace_id_unique").on(table.workspaceId, table.id),
    uniqueIndex("context_manifest_items_ordinal_unique").on(
      table.workspaceId,
      table.manifestId,
      table.ordinal,
    ),
    check(
      "context_manifest_items_values_check",
      sql`${table.ordinal} >= 0 and ${table.tokenEstimate} >= 0`,
    ),
    ...workspaceAppendOnlyPolicies("context_manifest_items", table.workspaceId),
  ],
);

/**
 * ToolCall 保存可验证摘要和执行边界，不保存明文参数、密钥或完整响应。
 * 审批记录在治理模块中反向关联 ToolCall，避免两个可变外键出现不一致。
 */
export const toolCalls = pgTable(
  "tool_calls",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    workspaceId: uuid("workspace_id")
      .notNull()
      .references(() => workspaces.id, { onDelete: "cascade" }),
    runId: uuid("run_id").notNull(),
    stepId: uuid("step_id").notNull(),
    toolCapabilityId: uuid("tool_capability_id").notNull(),
    toolVersionNumber: integer("tool_version_number").notNull(),
    schemaDigest: text("schema_digest").notNull(),
    executionPrincipalActorId: uuid("execution_principal_actor_id").notNull(),
    status: toolCallStatus("status").notNull().default("requested"),
    risk: riskClass("risk").notNull(),
    argumentDigest: text("argument_digest").notNull(),
    argumentSummary: sanitizedJsonColumn("argument_summary"),
    credentialBindingRef: text("credential_binding_ref"),
    networkPolicyVersion: text("network_policy_version"),
    idempotencyKey: varchar("idempotency_key", { length: 200 }).notNull(),
    externalIdempotencyKey: varchar("external_idempotency_key", { length: 200 }),
    resultDigest: text("result_digest"),
    resultClassification: varchar("result_classification", { length: 96 }),
    durationMs: integer("duration_ms"),
    usageSummary: sanitizedJsonColumn("usage_summary"),
    errorCode: varchar("error_code", { length: 120 }),
    requestedAt: timestamp("requested_at", { withTimezone: true, mode: "date" })
      .notNull()
      .defaultNow(),
    startedAt: timestamp("started_at", { withTimezone: true, mode: "date" }),
    endedAt: timestamp("ended_at", { withTimezone: true, mode: "date" }),
    ...lifecycleColumns(),
  },
  (table) => [
    foreignKey({
      name: "tool_calls_run_fk",
      columns: [table.workspaceId, table.runId],
      foreignColumns: [agentRuns.workspaceId, agentRuns.id],
    }).onDelete("cascade"),
    foreignKey({
      name: "tool_calls_step_fk",
      columns: [table.workspaceId, table.stepId],
      foreignColumns: [runSteps.workspaceId, runSteps.id],
    }).onDelete("restrict"),
    foreignKey({
      name: "tool_calls_capability_fk",
      columns: [table.workspaceId, table.toolCapabilityId],
      foreignColumns: [toolCapabilities.workspaceId, toolCapabilities.id],
    }).onDelete("restrict"),
    foreignKey({
      name: "tool_calls_principal_fk",
      columns: [table.workspaceId, table.executionPrincipalActorId],
      foreignColumns: [actors.workspaceId, actors.id],
    }).onDelete("restrict"),
    uniqueIndex("tool_calls_workspace_id_unique").on(table.workspaceId, table.id),
    uniqueIndex("tool_calls_idempotency_unique").on(table.workspaceId, table.idempotencyKey),
    index("tool_calls_run_status_idx").on(table.workspaceId, table.runId, table.status),
    check(
      "tool_calls_values_check",
      sql`${table.toolVersionNumber} > 0 and (${table.durationMs} is null or ${table.durationMs} >= 0)`,
    ),
    workspacePolicy("tool_calls_tenant", table.workspaceId),
  ],
);

/**
 * 非幂等外部副作用必须先写 effect 行再分发。uncertain 状态禁止自动重试，
 * 只有核对或人工决定后才能进入 confirmed/compensated。
 */
export const toolEffects = pgTable(
  "tool_effects",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    workspaceId: uuid("workspace_id")
      .notNull()
      .references(() => workspaces.id, { onDelete: "cascade" }),
    toolCallId: uuid("tool_call_id").notNull(),
    status: externalEffectStatus("status").notNull().default("prepared"),
    externalIdempotencyKey: varchar("external_idempotency_key", { length: 200 }).notNull(),
    requestDigest: text("request_digest").notNull(),
    resultDigest: text("result_digest"),
    dispatchedAt: timestamp("dispatched_at", { withTimezone: true, mode: "date" }),
    confirmedAt: timestamp("confirmed_at", { withTimezone: true, mode: "date" }),
    ...lifecycleColumns(),
  },
  (table) => [
    foreignKey({
      name: "tool_effects_tool_call_fk",
      columns: [table.workspaceId, table.toolCallId],
      foreignColumns: [toolCalls.workspaceId, toolCalls.id],
    }).onDelete("cascade"),
    uniqueIndex("tool_effects_workspace_id_unique").on(table.workspaceId, table.id),
    uniqueIndex("tool_effects_external_key_unique").on(
      table.workspaceId,
      table.externalIdempotencyKey,
    ),
    index("tool_effects_status_idx").on(table.workspaceId, table.status, table.updatedAt),
    workspacePolicy("tool_effects_tenant", table.workspaceId),
  ],
);
