import { sql } from "drizzle-orm";
import {
  bigint,
  check,
  foreignKey,
  index,
  inet,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";

import { capabilities } from "./authorization";
import { agentVersions, toolCapabilities } from "./agents";
import {
  lifecycleColumns,
  sanitizedJsonColumn,
  workspaceAppendOnlyPolicies,
  workspacePolicy,
} from "./common";
import { projects } from "./collaboration";
import { documentProposals } from "./document-proposals";
import {
  approvalStatus,
  auditOutcome,
  policyDecision,
  riskClass,
  usageDirection,
  usageLedgerEntryType,
  usageUnit,
} from "./enums";
import { actors, workspaceMemberships, workspaces } from "./identity";
import { agentRuns } from "./runtime";
import { toolCalls } from "./runtime-context";

/**
 * 审批是对“主体 + 操作 + 参数摘要 + 资源范围 + 策略版本”的一次性授权。
 * 执行前必须重新计算摘要；任何实质变更都会使原审批失效，禁止把 approved 当作长期权限。
 */
export const approvals = pgTable(
  "approvals",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    workspaceId: uuid("workspace_id")
      .notNull()
      .references(() => workspaces.id, { onDelete: "cascade" }),
    projectId: uuid("project_id"),
    requestedByActorId: uuid("requested_by_actor_id").notNull(),
    delegatedByActorId: uuid("delegated_by_actor_id"),
    reviewedByActorId: uuid("reviewed_by_actor_id"),
    agentVersionId: uuid("agent_version_id"),
    runId: uuid("run_id"),
    toolCapabilityId: uuid("tool_capability_id"),
    toolCallId: uuid("tool_call_id"),
    documentProposalId: uuid("document_proposal_id"),
    capabilityKey: varchar("capability_key", { length: 160 }),
    operationType: varchar("operation_type", { length: 120 }).notNull(),
    argumentDigest: text("argument_digest").notNull(),
    operationSummary: sanitizedJsonColumn("operation_summary"),
    affectedResources: sanitizedJsonColumn("affected_resources"),
    risk: riskClass("risk").notNull(),
    riskExplanation: text("risk_explanation").notNull().default(""),
    status: approvalStatus("status").notNull().default("pending"),
    policyVersion: text("policy_version").notNull(),
    idempotencyKey: varchar("idempotency_key", { length: 200 }).notNull(),
    expiresAt: timestamp("expires_at", { withTimezone: true, mode: "date" }).notNull(),
    decisionComment: text("decision_comment"),
    decidedAt: timestamp("decided_at", { withTimezone: true, mode: "date" }),
    consumedAt: timestamp("consumed_at", { withTimezone: true, mode: "date" }),
    cancelledAt: timestamp("cancelled_at", { withTimezone: true, mode: "date" }),
    ...lifecycleColumns(),
  },
  (table) => [
    foreignKey({
      name: "approvals_project_fk",
      columns: [table.workspaceId, table.projectId],
      foreignColumns: [projects.workspaceId, projects.id],
    }).onDelete("restrict"),
    foreignKey({
      name: "approvals_requester_fk",
      columns: [table.workspaceId, table.requestedByActorId],
      foreignColumns: [actors.workspaceId, actors.id],
    }).onDelete("restrict"),
    foreignKey({
      name: "approvals_delegator_fk",
      columns: [table.workspaceId, table.delegatedByActorId],
      foreignColumns: [actors.workspaceId, actors.id],
    }).onDelete("restrict"),
    foreignKey({
      name: "approvals_reviewer_fk",
      columns: [table.workspaceId, table.reviewedByActorId],
      foreignColumns: [actors.workspaceId, actors.id],
    }).onDelete("restrict"),
    foreignKey({
      name: "approvals_agent_version_fk",
      columns: [table.workspaceId, table.agentVersionId],
      foreignColumns: [agentVersions.workspaceId, agentVersions.id],
    }).onDelete("restrict"),
    foreignKey({
      name: "approvals_run_fk",
      columns: [table.workspaceId, table.runId],
      foreignColumns: [agentRuns.workspaceId, agentRuns.id],
    }).onDelete("restrict"),
    foreignKey({
      name: "approvals_tool_capability_fk",
      columns: [table.workspaceId, table.toolCapabilityId],
      foreignColumns: [toolCapabilities.workspaceId, toolCapabilities.id],
    }).onDelete("restrict"),
    foreignKey({
      name: "approvals_tool_call_fk",
      columns: [table.workspaceId, table.toolCallId],
      foreignColumns: [toolCalls.workspaceId, toolCalls.id],
    }).onDelete("restrict"),
    foreignKey({
      name: "approvals_document_proposal_fk",
      columns: [table.workspaceId, table.documentProposalId],
      foreignColumns: [documentProposals.workspaceId, documentProposals.id],
    }).onDelete("restrict"),
    foreignKey({
      name: "approvals_capability_fk",
      columns: [table.capabilityKey],
      foreignColumns: [capabilities.key],
    }).onDelete("restrict"),
    uniqueIndex("approvals_workspace_id_unique").on(table.workspaceId, table.id),
    uniqueIndex("approvals_idempotency_unique").on(table.workspaceId, table.idempotencyKey),
    uniqueIndex("approvals_tool_call_unique")
      .on(table.workspaceId, table.toolCallId)
      .where(sql`${table.toolCallId} is not null`),
    uniqueIndex("approvals_document_proposal_unique")
      .on(table.workspaceId, table.documentProposalId)
      .where(sql`${table.documentProposalId} is not null`),
    index("approvals_pending_idx").on(
      table.workspaceId,
      table.status,
      table.expiresAt,
      table.createdAt,
    ),
    check(
      "approvals_expiry_check",
      sql`${table.expiresAt} > ${table.createdAt}`,
    ),
    check(
      "approvals_separation_check",
      sql`${table.reviewedByActorId} is null or ${table.reviewedByActorId} <> ${table.requestedByActorId}`,
    ),
    check(
      "approvals_decision_fields_check",
      sql`((${table.status} = 'pending' and ${table.decidedAt} is null and ${table.reviewedByActorId} is null) or (${table.status} <> 'pending' and (${table.status} in ('expired', 'cancelled') or (${table.decidedAt} is not null and ${table.reviewedByActorId} is not null))))`,
    ),
    check(
      "approvals_consumed_fields_check",
      sql`((${table.status} = 'consumed') = (${table.consumedAt} is not null))`,
    ),
    workspacePolicy("approvals_tenant", table.workspaceId),
  ],
);

/**
 * 审计事件只保存经过脱敏的摘要、哈希、策略决定和因果标识；不得保存完整 prompt、密钥或工具明文参数。
 * 此表是仅追加事实，修正通过新事件表达，生产数据库角色不得拥有 UPDATE/DELETE 或 BYPASSRLS。
 */
export const auditEvents = pgTable(
  "audit_events",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    workspaceId: uuid("workspace_id")
      .notNull()
      .references(() => workspaces.id, { onDelete: "cascade" }),
    effectivePrincipalActorId: uuid("effective_principal_actor_id"),
    onBehalfOfActorId: uuid("on_behalf_of_actor_id"),
    workspaceMembershipId: uuid("workspace_membership_id"),
    approvalId: uuid("approval_id"),
    runId: uuid("run_id"),
    agentVersionId: uuid("agent_version_id"),
    toolCallId: uuid("tool_call_id"),
    sessionId: text("session_id"),
    traceId: uuid("trace_id").notNull(),
    action: varchar("action", { length: 160 }).notNull(),
    resourceType: varchar("resource_type", { length: 96 }).notNull(),
    resourceId: text("resource_id").notNull(),
    decision: policyDecision("decision").notNull(),
    policyVersion: text("policy_version").notNull(),
    obligations: sanitizedJsonColumn("obligations"),
    requestSummaryHash: text("request_summary_hash"),
    beforeHash: text("before_hash"),
    afterHash: text("after_hash"),
    outcome: auditOutcome("outcome").notNull(),
    reasonCode: varchar("reason_code", { length: 120 }),
    errorCode: varchar("error_code", { length: 120 }),
    sourceIp: inet("source_ip"),
    userAgent: text("user_agent"),
    sanitizedMetadata: sanitizedJsonColumn("sanitized_metadata"),
    occurredAt: timestamp("occurred_at", { withTimezone: true, mode: "date" })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    foreignKey({
      name: "audit_events_principal_fk",
      columns: [table.workspaceId, table.effectivePrincipalActorId],
      foreignColumns: [actors.workspaceId, actors.id],
    }).onDelete("restrict"),
    foreignKey({
      name: "audit_events_on_behalf_of_fk",
      columns: [table.workspaceId, table.onBehalfOfActorId],
      foreignColumns: [actors.workspaceId, actors.id],
    }).onDelete("restrict"),
    foreignKey({
      name: "audit_events_membership_fk",
      columns: [table.workspaceId, table.workspaceMembershipId],
      foreignColumns: [workspaceMemberships.workspaceId, workspaceMemberships.id],
    }).onDelete("restrict"),
    foreignKey({
      name: "audit_events_approval_fk",
      columns: [table.workspaceId, table.approvalId],
      foreignColumns: [approvals.workspaceId, approvals.id],
    }).onDelete("restrict"),
    foreignKey({
      name: "audit_events_run_fk",
      columns: [table.workspaceId, table.runId],
      foreignColumns: [agentRuns.workspaceId, agentRuns.id],
    }).onDelete("restrict"),
    foreignKey({
      name: "audit_events_agent_version_fk",
      columns: [table.workspaceId, table.agentVersionId],
      foreignColumns: [agentVersions.workspaceId, agentVersions.id],
    }).onDelete("restrict"),
    foreignKey({
      name: "audit_events_tool_call_fk",
      columns: [table.workspaceId, table.toolCallId],
      foreignColumns: [toolCalls.workspaceId, toolCalls.id],
    }).onDelete("restrict"),
    uniqueIndex("audit_events_workspace_id_unique").on(table.workspaceId, table.id),
    index("audit_events_resource_idx").on(
      table.workspaceId,
      table.resourceType,
      table.resourceId,
      table.occurredAt,
    ),
    index("audit_events_trace_idx").on(table.workspaceId, table.traceId, table.occurredAt),
    index("audit_events_actor_idx").on(
      table.workspaceId,
      table.effectivePrincipalActorId,
      table.occurredAt,
    ),
    ...workspaceAppendOnlyPolicies("audit_events", table.workspaceId),
  ],
);

/**
 * 用量账本采用 reservation/settlement/release/adjustment 的复式补偿语义，历史行永不原地改写。
 * 余额与统计是可重建投影；额度判断必须以账本和同一事务中的预留为准。
 */
export const usageLedgerEntries = pgTable(
  "usage_ledger_entries",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    workspaceId: uuid("workspace_id")
      .notNull()
      .references(() => workspaces.id, { onDelete: "cascade" }),
    projectId: uuid("project_id"),
    runId: uuid("run_id"),
    actorId: uuid("actor_id"),
    agentVersionId: uuid("agent_version_id"),
    toolCallId: uuid("tool_call_id"),
    reservationEntryId: uuid("reservation_entry_id"),
    entryType: usageLedgerEntryType("entry_type").notNull(),
    direction: usageDirection("direction").notNull(),
    unit: usageUnit("unit").notNull(),
    quantity: bigint("quantity", { mode: "number" }).notNull(),
    monetaryAmountMinor: bigint("monetary_amount_minor", { mode: "number" }),
    currency: varchar("currency", { length: 3 }),
    provider: varchar("provider", { length: 120 }),
    model: varchar("model", { length: 160 }),
    idempotencyKey: varchar("idempotency_key", { length: 200 }).notNull(),
    occurredAt: timestamp("occurred_at", { withTimezone: true, mode: "date" })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    foreignKey({
      name: "usage_ledger_project_fk",
      columns: [table.workspaceId, table.projectId],
      foreignColumns: [projects.workspaceId, projects.id],
    }).onDelete("restrict"),
    foreignKey({
      name: "usage_ledger_run_fk",
      columns: [table.workspaceId, table.runId],
      foreignColumns: [agentRuns.workspaceId, agentRuns.id],
    }).onDelete("restrict"),
    foreignKey({
      name: "usage_ledger_actor_fk",
      columns: [table.workspaceId, table.actorId],
      foreignColumns: [actors.workspaceId, actors.id],
    }).onDelete("restrict"),
    foreignKey({
      name: "usage_ledger_agent_version_fk",
      columns: [table.workspaceId, table.agentVersionId],
      foreignColumns: [agentVersions.workspaceId, agentVersions.id],
    }).onDelete("restrict"),
    foreignKey({
      name: "usage_ledger_tool_call_fk",
      columns: [table.workspaceId, table.toolCallId],
      foreignColumns: [toolCalls.workspaceId, toolCalls.id],
    }).onDelete("restrict"),
    foreignKey({
      name: "usage_ledger_reservation_fk",
      columns: [table.workspaceId, table.reservationEntryId],
      foreignColumns: [table.workspaceId, table.id],
    }).onDelete("restrict"),
    uniqueIndex("usage_ledger_workspace_id_unique").on(table.workspaceId, table.id),
    uniqueIndex("usage_ledger_idempotency_unique").on(table.workspaceId, table.idempotencyKey),
    index("usage_ledger_run_idx").on(table.workspaceId, table.runId, table.occurredAt),
    index("usage_ledger_workspace_time_idx").on(table.workspaceId, table.occurredAt),
    check("usage_ledger_quantity_check", sql`${table.quantity} >= 0`),
    check(
      "usage_ledger_currency_check",
      sql`((${table.monetaryAmountMinor} is null and ${table.currency} is null) or (${table.monetaryAmountMinor} is not null and ${table.monetaryAmountMinor} >= 0 and ${table.currency} is not null))`,
    ),
    check(
      "usage_ledger_reservation_link_check",
      sql`((${table.entryType} = 'reservation' and ${table.reservationEntryId} is null) or (${table.entryType} in ('settlement', 'release') and ${table.reservationEntryId} is not null) or ${table.entryType} = 'adjustment')`,
    ),
    ...workspaceAppendOnlyPolicies("usage_ledger", table.workspaceId),
  ],
);
