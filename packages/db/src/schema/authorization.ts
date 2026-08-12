import { sql } from "drizzle-orm";
import {
  check,
  foreignKey,
  index,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";

import { lifecycleColumns, sanitizedJsonColumn, workspacePolicy } from "./common";
import { actors, workspaces } from "./identity";
import { grantEffect, grantScope, grantStatus, riskClass, roleStatus } from "./enums";

/**
 * Capability 是协议级动作目录，不属于单个租户，因此没有 workspace_id。
 * 租户只能通过 RoleGrant 或 ResourceGrant 使用目录项，不能把页面路径当作 Capability。
 */
export const capabilities = pgTable(
  "capabilities",
  {
    key: varchar("key", { length: 160 }).primaryKey(),
    descriptionKey: text("description_key").notNull(),
    risk: riskClass("risk").notNull().default("low"),
    createdAt: timestamp("created_at", { withTimezone: true, mode: "date" }).notNull().defaultNow(),
  },
  (table) => [index("capabilities_risk_idx").on(table.risk)],
);

export const accessRoles = pgTable(
  "access_roles",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    workspaceId: uuid("workspace_id")
      .notNull()
      .references(() => workspaces.id, { onDelete: "cascade" }),
    key: varchar("key", { length: 128 }).notNull(),
    name: text("name").notNull(),
    description: text("description").notNull().default(""),
    status: roleStatus("status").notNull().default("active"),
    builtIn: text("built_in"),
    ...lifecycleColumns(),
  },
  (table) => [
    uniqueIndex("access_roles_workspace_id_unique").on(table.workspaceId, table.id),
    uniqueIndex("access_roles_workspace_key_unique").on(table.workspaceId, table.key),
    index("access_roles_workspace_status_idx").on(table.workspaceId, table.status),
    workspacePolicy("access_roles_tenant", table.workspaceId),
  ],
);

/**
 * RoleCapabilityGrant 是角色能力事实。显式 deny 必须在 allow 之前求值，
 * constraints 只能保存可验证的结构化限制，禁止放凭据、提示词或可执行表达式。
 */
export const roleCapabilityGrants = pgTable(
  "role_capability_grants",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    workspaceId: uuid("workspace_id")
      .notNull()
      .references(() => workspaces.id, { onDelete: "cascade" }),
    roleId: uuid("role_id").notNull(),
    capabilityKey: varchar("capability_key", { length: 160 })
      .notNull()
      .references(() => capabilities.key, { onDelete: "restrict" }),
    effect: grantEffect("effect").notNull(),
    constraints: sanitizedJsonColumn("constraints"),
    grantedByActorId: uuid("granted_by_actor_id").notNull(),
    ...lifecycleColumns(),
  },
  (table) => [
    foreignKey({
      name: "role_capability_grants_role_fk",
      columns: [table.workspaceId, table.roleId],
      foreignColumns: [accessRoles.workspaceId, accessRoles.id],
    }).onDelete("cascade"),
    foreignKey({
      name: "role_capability_grants_granter_fk",
      columns: [table.workspaceId, table.grantedByActorId],
      foreignColumns: [actors.workspaceId, actors.id],
    }).onDelete("restrict"),
    uniqueIndex("role_capability_grants_workspace_id_unique").on(table.workspaceId, table.id),
    uniqueIndex("role_capability_grants_role_cap_unique").on(
      table.workspaceId,
      table.roleId,
      table.capabilityKey,
    ),
    workspacePolicy("role_cap_grants_tenant", table.workspaceId),
  ],
);

/**
 * 角色分配的 scopeId 是多态资源选择器。workspace scope 可由 CHECK 直接验证；
 * project、room 与 resource 的同租户归属必须在授权应用服务中锁定并校验。
 */
export const actorRoleAssignments = pgTable(
  "actor_role_assignments",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    workspaceId: uuid("workspace_id")
      .notNull()
      .references(() => workspaces.id, { onDelete: "cascade" }),
    actorId: uuid("actor_id").notNull(),
    roleId: uuid("role_id").notNull(),
    scope: grantScope("scope").notNull(),
    scopeId: uuid("scope_id").notNull(),
    status: grantStatus("status").notNull().default("active"),
    grantedByActorId: uuid("granted_by_actor_id").notNull(),
    validFrom: timestamp("valid_from", { withTimezone: true, mode: "date" }).notNull().defaultNow(),
    expiresAt: timestamp("expires_at", { withTimezone: true, mode: "date" }),
    revokedAt: timestamp("revoked_at", { withTimezone: true, mode: "date" }),
    ...lifecycleColumns(),
  },
  (table) => [
    foreignKey({
      name: "actor_role_assignments_actor_fk",
      columns: [table.workspaceId, table.actorId],
      foreignColumns: [actors.workspaceId, actors.id],
    }).onDelete("cascade"),
    foreignKey({
      name: "actor_role_assignments_role_fk",
      columns: [table.workspaceId, table.roleId],
      foreignColumns: [accessRoles.workspaceId, accessRoles.id],
    }).onDelete("cascade"),
    foreignKey({
      name: "actor_role_assignments_granter_fk",
      columns: [table.workspaceId, table.grantedByActorId],
      foreignColumns: [actors.workspaceId, actors.id],
    }).onDelete("restrict"),
    uniqueIndex("actor_role_assignments_workspace_id_unique").on(table.workspaceId, table.id),
    uniqueIndex("actor_role_assignments_scope_unique").on(
      table.workspaceId,
      table.actorId,
      table.roleId,
      table.scope,
      table.scopeId,
    ),
    index("actor_role_assignments_lookup_idx").on(
      table.workspaceId,
      table.actorId,
      table.status,
      table.scope,
    ),
    check(
      "actor_role_assignments_workspace_scope_check",
      sql`${table.scope} <> 'workspace' or ${table.scopeId} = ${table.workspaceId}`,
    ),
    check(
      "actor_role_assignments_expiry_check",
      sql`${table.expiresAt} is null or ${table.expiresAt} > ${table.validFrom}`,
    ),
    workspacePolicy("actor_role_assign_tenant", table.workspaceId),
  ],
);

/**
 * ResourceGrant 必须且只能选择 actorId 或 roleId 之一。多态 resourceId 在创建时
 * 由应用服务验证同一 workspace；数据库中的 workspace_id 使 RLS 与审计始终有明确边界。
 */
export const resourceGrants = pgTable(
  "resource_grants",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    workspaceId: uuid("workspace_id")
      .notNull()
      .references(() => workspaces.id, { onDelete: "cascade" }),
    actorId: uuid("actor_id"),
    roleId: uuid("role_id"),
    resourceType: varchar("resource_type", { length: 96 }).notNull(),
    resourceId: uuid("resource_id").notNull(),
    capabilityKey: varchar("capability_key", { length: 160 })
      .notNull()
      .references(() => capabilities.key, { onDelete: "restrict" }),
    effect: grantEffect("effect").notNull(),
    status: grantStatus("status").notNull().default("active"),
    conditions: sanitizedJsonColumn("conditions"),
    grantedByActorId: uuid("granted_by_actor_id").notNull(),
    expiresAt: timestamp("expires_at", { withTimezone: true, mode: "date" }),
    ...lifecycleColumns(),
  },
  (table) => [
    foreignKey({
      name: "resource_grants_actor_fk",
      columns: [table.workspaceId, table.actorId],
      foreignColumns: [actors.workspaceId, actors.id],
    }).onDelete("cascade"),
    foreignKey({
      name: "resource_grants_role_fk",
      columns: [table.workspaceId, table.roleId],
      foreignColumns: [accessRoles.workspaceId, accessRoles.id],
    }).onDelete("cascade"),
    foreignKey({
      name: "resource_grants_granter_fk",
      columns: [table.workspaceId, table.grantedByActorId],
      foreignColumns: [actors.workspaceId, actors.id],
    }).onDelete("restrict"),
    uniqueIndex("resource_grants_workspace_id_unique").on(table.workspaceId, table.id),
    uniqueIndex("resource_grants_actor_unique")
      .on(
        table.workspaceId,
        table.actorId,
        table.resourceType,
        table.resourceId,
        table.capabilityKey,
      )
      .where(sql`${table.actorId} is not null`),
    uniqueIndex("resource_grants_role_unique")
      .on(
        table.workspaceId,
        table.roleId,
        table.resourceType,
        table.resourceId,
        table.capabilityKey,
      )
      .where(sql`${table.roleId} is not null`),
    index("resource_grants_resource_idx").on(
      table.workspaceId,
      table.resourceType,
      table.resourceId,
      table.status,
    ),
    check(
      "resource_grants_one_subject_check",
      sql`num_nonnulls(${table.actorId}, ${table.roleId}) = 1`,
    ),
    workspacePolicy("resource_grants_tenant", table.workspaceId),
  ],
);
