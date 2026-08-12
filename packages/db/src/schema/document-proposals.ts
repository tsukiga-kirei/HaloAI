import { sql } from "drizzle-orm";
import {
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
  byteaColumn,
  type JsonObject,
  lifecycleColumns,
  sanitizedJsonColumn,
  workspacePolicy,
} from "./common";
import { documentVersions, documents, yjsSnapshots } from "./documents";
import {
  policyDecision,
  proposalOperationStatus,
  proposalOperationType,
  proposalStatus,
} from "./enums";
import { actors, workspaces } from "./identity";
import { agentRuns } from "./runtime";

/**
 * AI 只能创建 DocumentProposal，不能直接修改权威 Yjs 状态。
 * 提案固定基础版本、AgentVersion、委托人和策略决定；应用前必须重新校验权限与基线。
 */
export const documentProposals = pgTable(
  "document_proposals",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    workspaceId: uuid("workspace_id")
      .notNull()
      .references(() => workspaces.id, { onDelete: "cascade" }),
    documentId: uuid("document_id").notNull(),
    proposalVersion: integer("proposal_version").notNull().default(1),
    baseVersionId: uuid("base_version_id").notNull(),
    baseContentDigest: text("base_content_digest").notNull(),
    baseStateVector: byteaColumn("base_state_vector"),
    agentActorId: uuid("agent_actor_id").notNull(),
    agentVersionId: uuid("agent_version_id").notNull(),
    delegatedByActorId: uuid("delegated_by_actor_id").notNull(),
    runId: uuid("run_id").notNull(),
    status: proposalStatus("status").notNull().default("draft"),
    rationaleSummary: text("rationale_summary").notNull().default(""),
    citations: jsonb("citations").$type<JsonObject[]>().notNull().default([]),
    policyDecision: policyDecision("policy_decision").notNull(),
    policyVersion: text("policy_version").notNull(),
    idempotencyKey: varchar("idempotency_key", { length: 200 }).notNull(),
    expiresAt: timestamp("expires_at", { withTimezone: true, mode: "date" }),
    reviewedByActorId: uuid("reviewed_by_actor_id"),
    reviewedAt: timestamp("reviewed_at", { withTimezone: true, mode: "date" }),
    appliedSnapshotId: uuid("applied_snapshot_id"),
    appliedVersionId: uuid("applied_version_id"),
    ...lifecycleColumns(),
  },
  (table) => [
    foreignKey({
      name: "document_proposals_document_fk",
      columns: [table.workspaceId, table.documentId],
      foreignColumns: [documents.workspaceId, documents.id],
    }).onDelete("cascade"),
    foreignKey({
      name: "document_proposals_base_version_fk",
      columns: [table.workspaceId, table.documentId, table.baseVersionId],
      foreignColumns: [
        documentVersions.workspaceId,
        documentVersions.documentId,
        documentVersions.id,
      ],
    }).onDelete("restrict"),
    foreignKey({
      name: "document_proposals_agent_actor_fk",
      columns: [table.workspaceId, table.agentActorId],
      foreignColumns: [agentActors.workspaceId, agentActors.actorId],
    }).onDelete("restrict"),
    foreignKey({
      name: "document_proposals_agent_version_fk",
      columns: [table.workspaceId, table.agentVersionId],
      foreignColumns: [agentVersions.workspaceId, agentVersions.id],
    }).onDelete("restrict"),
    foreignKey({
      name: "document_proposals_delegator_fk",
      columns: [table.workspaceId, table.delegatedByActorId],
      foreignColumns: [actors.workspaceId, actors.id],
    }).onDelete("restrict"),
    foreignKey({
      name: "document_proposals_run_fk",
      columns: [table.workspaceId, table.runId],
      foreignColumns: [agentRuns.workspaceId, agentRuns.id],
    }).onDelete("restrict"),
    foreignKey({
      name: "document_proposals_reviewer_fk",
      columns: [table.workspaceId, table.reviewedByActorId],
      foreignColumns: [actors.workspaceId, actors.id],
    }).onDelete("restrict"),
    foreignKey({
      name: "document_proposals_applied_snapshot_fk",
      columns: [table.workspaceId, table.documentId, table.appliedSnapshotId],
      foreignColumns: [yjsSnapshots.workspaceId, yjsSnapshots.documentId, yjsSnapshots.id],
    }).onDelete("restrict"),
    foreignKey({
      name: "document_proposals_applied_version_fk",
      columns: [table.workspaceId, table.documentId, table.appliedVersionId],
      foreignColumns: [
        documentVersions.workspaceId,
        documentVersions.documentId,
        documentVersions.id,
      ],
    }).onDelete("restrict"),
    uniqueIndex("document_proposals_workspace_id_unique").on(table.workspaceId, table.id),
    uniqueIndex("document_proposals_workspace_document_id_unique").on(
      table.workspaceId,
      table.documentId,
      table.id,
    ),
    uniqueIndex("document_proposals_idempotency_unique").on(
      table.workspaceId,
      table.idempotencyKey,
    ),
    index("document_proposals_review_idx").on(
      table.workspaceId,
      table.documentId,
      table.status,
      table.createdAt,
    ),
    check(
      "document_proposals_values_check",
      sql`${table.proposalVersion} > 0 and (${table.expiresAt} is null or ${table.expiresAt} > ${table.createdAt}) and (${table.reviewedByActorId} is null or ${table.reviewedByActorId} <> ${table.agentActorId})`,
    ),
    workspacePolicy("document_proposals_tenant", table.workspaceId),
  ],
);

/**
 * Operation 只允许受控语义动作，禁止任意字符偏移、整文替换、可执行内容和权限修改。
 * operation payload 必须经过对应 type 的运行时 schema 验证，且 hash 绑定审批选择。
 */
export const proposalOperations = pgTable(
  "proposal_operations",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    workspaceId: uuid("workspace_id")
      .notNull()
      .references(() => workspaces.id, { onDelete: "cascade" }),
    proposalId: uuid("proposal_id").notNull(),
    ordinal: integer("ordinal").notNull(),
    type: proposalOperationType("type").notNull(),
    targetNodeId: varchar("target_node_id", { length: 200 }),
    operation: jsonb("operation").$type<JsonObject>().notNull(),
    operationDigest: text("operation_digest").notNull(),
    rationaleSummary: text("rationale_summary").notNull().default(""),
    citations: jsonb("citations").$type<JsonObject[]>().notNull().default([]),
    status: proposalOperationStatus("status").notNull().default("pending"),
    decidedByActorId: uuid("decided_by_actor_id"),
    decidedAt: timestamp("decided_at", { withTimezone: true, mode: "date" }),
    appliedAt: timestamp("applied_at", { withTimezone: true, mode: "date" }),
    ...lifecycleColumns(),
  },
  (table) => [
    foreignKey({
      name: "proposal_operations_proposal_fk",
      columns: [table.workspaceId, table.proposalId],
      foreignColumns: [documentProposals.workspaceId, documentProposals.id],
    }).onDelete("cascade"),
    foreignKey({
      name: "proposal_operations_decider_fk",
      columns: [table.workspaceId, table.decidedByActorId],
      foreignColumns: [actors.workspaceId, actors.id],
    }).onDelete("restrict"),
    uniqueIndex("proposal_operations_workspace_id_unique").on(table.workspaceId, table.id),
    uniqueIndex("proposal_operations_ordinal_unique").on(
      table.workspaceId,
      table.proposalId,
      table.ordinal,
    ),
    index("proposal_operations_status_idx").on(table.workspaceId, table.proposalId, table.status),
    check("proposal_operations_ordinal_check", sql`${table.ordinal} >= 0`),
    workspacePolicy("proposal_operations_tenant", table.workspaceId),
  ],
);
