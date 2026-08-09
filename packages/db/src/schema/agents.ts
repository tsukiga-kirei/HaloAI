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

import { capabilities } from "./authorization";
import {
  type BudgetPolicySnapshot,
  type JsonObject,
  lifecycleColumns,
  sanitizedJsonColumn,
  workspaceDraftVersionPolicies,
  workspacePolicy,
} from "./common";
import {
  agentProfileStatus,
  agentVersionStatus,
  grantEffect,
  riskClass,
  toolCapabilityStatus,
  toolEffectClass,
  toolTransport,
} from "./enums";
import { actors, workspaces } from "./identity";

export const agentProfiles = pgTable(
  "agent_profiles",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    workspaceId: uuid("workspace_id")
      .notNull()
      .references(() => workspaces.id, { onDelete: "cascade" }),
    handle: varchar("handle", { length: 128 }).notNull(),
    name: text("name").notNull(),
    summary: text("summary").notNull().default(""),
    visualIdentity: sanitizedJsonColumn("visual_identity"),
    ownerActorId: uuid("owner_actor_id").notNull(),
    status: agentProfileStatus("status").notNull().default("draft"),
    archivedAt: timestamp("archived_at", { withTimezone: true, mode: "date" }),
    ...lifecycleColumns(),
  },
  (table) => [
    foreignKey({
      name: "agent_profiles_owner_fk",
      columns: [table.workspaceId, table.ownerActorId],
      foreignColumns: [actors.workspaceId, actors.id],
    }).onDelete("restrict"),
    uniqueIndex("agent_profiles_workspace_id_unique").on(table.workspaceId, table.id),
    uniqueIndex("agent_profiles_workspace_handle_unique").on(table.workspaceId, table.handle),
    index("agent_profiles_workspace_status_idx").on(table.workspaceId, table.status),
    workspacePolicy("agent_profiles_tenant", table.workspaceId),
  ],
);

/**
 * AgentVersion 发布后是不可变快照。完整系统提示词不进入普通 schema；
 * 这里只保存受治理指令文档引用与摘要，密钥只能使用不透明 binding/reference。
 * 发布事务还必须封存对应 capability/tool grant 子表，禁止发布后增删改。
 */
export const agentVersions = pgTable(
  "agent_versions",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    workspaceId: uuid("workspace_id")
      .notNull()
      .references(() => workspaces.id, { onDelete: "cascade" }),
    agentProfileId: uuid("agent_profile_id").notNull(),
    versionNumber: integer("version_number").notNull(),
    status: agentVersionStatus("status").notNull().default("draft"),
    responsibility: text("responsibility").notNull().default(""),
    nonResponsibilities: jsonb("non_responsibilities").$type<string[]>().notNull().default([]),
    instructionDocumentRef: text("instruction_document_ref").notNull(),
    instructionDigest: text("instruction_digest").notNull(),
    modelPolicy: jsonb("model_policy").$type<JsonObject>().notNull(),
    fallbackPolicy: sanitizedJsonColumn("fallback_policy"),
    outputContract: sanitizedJsonColumn("output_contract"),
    knowledgeSelectors: jsonb("knowledge_selectors").$type<JsonObject[]>().notNull().default([]),
    collaborationPolicy: sanitizedJsonColumn("collaboration_policy"),
    budgetPolicy: jsonb("budget_policy").$type<BudgetPolicySnapshot>().notNull(),
    policyVersion: text("policy_version").notNull(),
    schemaVersion: integer("schema_version").notNull().default(1),
    contentDigest: text("content_digest").notNull(),
    createdByActorId: uuid("created_by_actor_id").notNull(),
    publishedByActorId: uuid("published_by_actor_id"),
    publishedAt: timestamp("published_at", { withTimezone: true, mode: "date" }),
    retiredAt: timestamp("retired_at", { withTimezone: true, mode: "date" }),
    createdAt: timestamp("created_at", { withTimezone: true, mode: "date" })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    foreignKey({
      name: "agent_versions_profile_fk",
      columns: [table.workspaceId, table.agentProfileId],
      foreignColumns: [agentProfiles.workspaceId, agentProfiles.id],
    }).onDelete("cascade"),
    foreignKey({
      name: "agent_versions_creator_fk",
      columns: [table.workspaceId, table.createdByActorId],
      foreignColumns: [actors.workspaceId, actors.id],
    }).onDelete("restrict"),
    foreignKey({
      name: "agent_versions_publisher_fk",
      columns: [table.workspaceId, table.publishedByActorId],
      foreignColumns: [actors.workspaceId, actors.id],
    }).onDelete("restrict"),
    uniqueIndex("agent_versions_workspace_id_unique").on(table.workspaceId, table.id),
    uniqueIndex("agent_versions_profile_number_unique").on(
      table.workspaceId,
      table.agentProfileId,
      table.versionNumber,
    ),
    index("agent_versions_profile_status_idx").on(
      table.workspaceId,
      table.agentProfileId,
      table.status,
    ),
    check("agent_versions_number_positive_check", sql`${table.versionNumber} > 0`),
    check(
      "agent_versions_publish_fields_check",
      sql`((${table.status} = 'draft' and ${table.publishedAt} is null and ${table.publishedByActorId} is null) or (${table.status} in ('published', 'retired') and ${table.publishedAt} is not null and ${table.publishedByActorId} is not null))`,
    ),
    ...workspaceDraftVersionPolicies(
      "agent_versions",
      table.workspaceId,
      table.status,
    ),
  ],
);

/**
 * AgentActor 把可归责 Actor 与目录 Profile 一对一连接。actor.kind=agent 与同租户
 * Profile 关系必须由发布/创建事务和 deferred trigger 验证，AI Actor 不关联 User 或会话。
 */
export const agentActors = pgTable(
  "agent_actors",
  {
    actorId: uuid("actor_id").primaryKey(),
    workspaceId: uuid("workspace_id")
      .notNull()
      .references(() => workspaces.id, { onDelete: "cascade" }),
    agentProfileId: uuid("agent_profile_id").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true, mode: "date" })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    foreignKey({
      name: "agent_actors_actor_fk",
      columns: [table.workspaceId, table.actorId],
      foreignColumns: [actors.workspaceId, actors.id],
    }).onDelete("cascade"),
    foreignKey({
      name: "agent_actors_profile_fk",
      columns: [table.workspaceId, table.agentProfileId],
      foreignColumns: [agentProfiles.workspaceId, agentProfiles.id],
    }).onDelete("cascade"),
    uniqueIndex("agent_actors_workspace_actor_unique").on(table.workspaceId, table.actorId),
    uniqueIndex("agent_actors_workspace_profile_unique").on(
      table.workspaceId,
      table.agentProfileId,
    ),
    workspacePolicy("agent_actors_tenant", table.workspaceId),
  ],
);

/**
 * ToolCapability 只保存可公开给模型的 schema、策略引用与摘要。
 * endpoint 凭据、OAuth token、API key 和完整远端响应禁止进入此表。
 */
export const toolCapabilities = pgTable(
  "tool_capabilities",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    workspaceId: uuid("workspace_id")
      .notNull()
      .references(() => workspaces.id, { onDelete: "cascade" }),
    key: varchar("key", { length: 160 }).notNull(),
    versionNumber: integer("version_number").notNull(),
    name: text("name").notNull(),
    description: text("description").notNull().default(""),
    status: toolCapabilityStatus("status").notNull().default("draft"),
    transport: toolTransport("transport").notNull(),
    adapterKey: varchar("adapter_key", { length: 160 }).notNull(),
    inputSchema: jsonb("input_schema").$type<JsonObject>().notNull(),
    outputSchema: jsonb("output_schema").$type<JsonObject>().notNull(),
    schemaDigest: text("schema_digest").notNull(),
    effectClass: toolEffectClass("effect_class").notNull(),
    risk: riskClass("risk").notNull(),
    credentialPolicyRef: text("credential_policy_ref"),
    networkPolicy: sanitizedJsonColumn("network_policy"),
    approvalPolicy: sanitizedJsonColumn("approval_policy"),
    maxDurationMs: integer("max_duration_ms").notNull(),
    maxResponseBytes: integer("max_response_bytes").notNull(),
    createdByActorId: uuid("created_by_actor_id").notNull(),
    activatedAt: timestamp("activated_at", { withTimezone: true, mode: "date" }),
    ...lifecycleColumns(),
  },
  (table) => [
    foreignKey({
      name: "tool_capabilities_creator_fk",
      columns: [table.workspaceId, table.createdByActorId],
      foreignColumns: [actors.workspaceId, actors.id],
    }).onDelete("restrict"),
    uniqueIndex("tool_capabilities_workspace_id_unique").on(table.workspaceId, table.id),
    uniqueIndex("tool_capabilities_key_version_unique").on(
      table.workspaceId,
      table.key,
      table.versionNumber,
    ),
    index("tool_capabilities_status_idx").on(table.workspaceId, table.status, table.transport),
    check(
      "tool_capabilities_limits_check",
      sql`${table.versionNumber} > 0 and ${table.maxDurationMs} > 0 and ${table.maxResponseBytes} > 0`,
    ),
    workspacePolicy("tool_capabilities_tenant", table.workspaceId),
  ],
);

/**
 * AgentVersion 的能力授权是权限交集的一层，不替代委托人或资源 ACL。
 * 发布服务必须在锁定 Version 后封存这些行，防止发布配置被旁路修改。
 */
export const agentVersionCapabilityGrants = pgTable(
  "agent_version_capability_grants",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    workspaceId: uuid("workspace_id")
      .notNull()
      .references(() => workspaces.id, { onDelete: "cascade" }),
    agentVersionId: uuid("agent_version_id").notNull(),
    capabilityKey: varchar("capability_key", { length: 160 })
      .notNull()
      .references(() => capabilities.key, { onDelete: "restrict" }),
    effect: grantEffect("effect").notNull(),
    constraints: sanitizedJsonColumn("constraints"),
    createdByActorId: uuid("created_by_actor_id").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true, mode: "date" })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    foreignKey({
      name: "agent_version_cap_grants_version_fk",
      columns: [table.workspaceId, table.agentVersionId],
      foreignColumns: [agentVersions.workspaceId, agentVersions.id],
    }).onDelete("cascade"),
    foreignKey({
      name: "agent_version_cap_grants_creator_fk",
      columns: [table.workspaceId, table.createdByActorId],
      foreignColumns: [actors.workspaceId, actors.id],
    }).onDelete("restrict"),
    uniqueIndex("agent_version_cap_grants_workspace_id_unique").on(
      table.workspaceId,
      table.id,
    ),
    uniqueIndex("agent_version_cap_grants_cap_unique").on(
      table.workspaceId,
      table.agentVersionId,
      table.capabilityKey,
    ),
    workspacePolicy("agent_ver_cap_grants_tenant", table.workspaceId),
  ],
);

export const agentVersionToolGrants = pgTable(
  "agent_version_tool_grants",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    workspaceId: uuid("workspace_id")
      .notNull()
      .references(() => workspaces.id, { onDelete: "cascade" }),
    agentVersionId: uuid("agent_version_id").notNull(),
    toolCapabilityId: uuid("tool_capability_id").notNull(),
    constraints: sanitizedJsonColumn("constraints"),
    maxCallsPerRun: integer("max_calls_per_run"),
    createdByActorId: uuid("created_by_actor_id").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true, mode: "date" })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    foreignKey({
      name: "agent_version_tool_grants_version_fk",
      columns: [table.workspaceId, table.agentVersionId],
      foreignColumns: [agentVersions.workspaceId, agentVersions.id],
    }).onDelete("cascade"),
    foreignKey({
      name: "agent_version_tool_grants_tool_fk",
      columns: [table.workspaceId, table.toolCapabilityId],
      foreignColumns: [toolCapabilities.workspaceId, toolCapabilities.id],
    }).onDelete("restrict"),
    foreignKey({
      name: "agent_version_tool_grants_creator_fk",
      columns: [table.workspaceId, table.createdByActorId],
      foreignColumns: [actors.workspaceId, actors.id],
    }).onDelete("restrict"),
    uniqueIndex("agent_version_tool_grants_workspace_id_unique").on(
      table.workspaceId,
      table.id,
    ),
    uniqueIndex("agent_version_tool_grants_tool_unique").on(
      table.workspaceId,
      table.agentVersionId,
      table.toolCapabilityId,
    ),
    check(
      "agent_version_tool_grants_max_calls_check",
      sql`${table.maxCallsPerRun} is null or ${table.maxCallsPerRun} > 0`,
    ),
    workspacePolicy("agent_ver_tool_grants_tenant", table.workspaceId),
  ],
);
