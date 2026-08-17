import { sql } from "drizzle-orm";
import {
  boolean,
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

import { lifecycleColumns, workspacePolicy } from "./common";
import { actorKind, actorStatus, membershipStatus, userStatus, workspaceStatus } from "./enums";

/**
 * User 是跨工作空间登录身份，不属于任何租户，也不携带 workspace_id。
 * 此表故意不保存密码、会话、刷新令牌或认证密钥；认证材料由认证组件的专用表负责。
 * 默认启用 RLS 且不在这里授予公共策略，认证数据库角色必须由 migration 显式配置。
 * 列级中文注释由 drizzle/0003_column_comments.sql 写入 PostgreSQL。
 */
export const users = pgTable(
  "users",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    name: text("name").notNull(),
    email: text("primary_email").notNull(),
    emailVerified: boolean("email_verified").notNull().default(false),
    /** 兼容早期迁移的数据；完成验证状态回填后再通过独立迁移移除。 */
    emailVerifiedAt: timestamp("email_verified_at", { withTimezone: true, mode: "date" }),
    image: text("image"),
    preferredLocale: varchar("preferred_locale", { length: 32 }).notNull().default("zh-CN"),
    timeZone: varchar("time_zone", { length: 64 }).notNull().default("UTC"),
    status: userStatus("status").notNull().default("active"),
    deletedAt: timestamp("deleted_at", { withTimezone: true, mode: "date" }),
    ...lifecycleColumns(),
  },
  (table) => [uniqueIndex("users_primary_email_unique").on(table.email)],
).enableRLS();

/**
 * Workspace 是租户根，id 本身就是 workspaceId，所以不会再保存自引用 workspace_id。
 * 除 User 与全局协议目录外，所有租户资源都必须显式保存 workspace_id。
 */
export const workspaces = pgTable(
  "workspaces",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    slug: varchar("slug", { length: 128 }).notNull(),
    name: text("name").notNull(),
    status: workspaceStatus("status").notNull().default("active"),
    defaultLocale: varchar("default_locale", { length: 32 }).notNull().default("zh-CN"),
    timeZone: varchar("time_zone", { length: 64 }).notNull().default("UTC"),
    retentionPolicyVersion: text("retention_policy_version").notNull().default("v1"),
    createdByUserId: uuid("created_by_user_id")
      .notNull()
      .references(() => users.id, { onDelete: "restrict" }),
    archivedAt: timestamp("archived_at", { withTimezone: true, mode: "date" }),
    ...lifecycleColumns(),
  },
  (table) => [
    uniqueIndex("workspaces_slug_unique").on(table.slug),
    workspacePolicy("workspaces_tenant", table.id),
  ],
);

export const actors = pgTable(
  "actors",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    workspaceId: uuid("workspace_id")
      .notNull()
      .references(() => workspaces.id, { onDelete: "cascade" }),
    kind: actorKind("kind").notNull(),
    status: actorStatus("status").notNull().default("active"),
    displayName: text("display_name").notNull(),
    handle: varchar("handle", { length: 128 }).notNull(),
    avatarReference: text("avatar_reference"),
    archivedAt: timestamp("archived_at", { withTimezone: true, mode: "date" }),
    ...lifecycleColumns(),
  },
  (table) => [
    uniqueIndex("actors_workspace_id_unique").on(table.workspaceId, table.id),
    uniqueIndex("actors_workspace_handle_unique").on(table.workspaceId, table.handle),
    index("actors_workspace_kind_idx").on(table.workspaceId, table.kind, table.status),
    workspacePolicy("actors_tenant", table.workspaceId),
  ],
);

/**
 * HumanActor 只建立 User 与租户 Actor 的一对一关联。actor.kind=human 属于跨表不变量，
 * PostgreSQL CHECK 无法读取父表，必须由同事务服务和 deferred constraint trigger 双重验证。
 */
export const humanActors = pgTable(
  "human_actors",
  {
    actorId: uuid("actor_id").primaryKey(),
    workspaceId: uuid("workspace_id")
      .notNull()
      .references(() => workspaces.id, { onDelete: "cascade" }),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "restrict" }),
    createdAt: timestamp("created_at", { withTimezone: true, mode: "date" }).notNull().defaultNow(),
  },
  (table) => [
    foreignKey({
      name: "human_actors_workspace_actor_fk",
      columns: [table.workspaceId, table.actorId],
      foreignColumns: [actors.workspaceId, actors.id],
    }).onDelete("cascade"),
    uniqueIndex("human_actors_workspace_actor_unique").on(table.workspaceId, table.actorId),
    uniqueIndex("human_actors_workspace_user_unique").on(table.workspaceId, table.userId),
    workspacePolicy("human_actors_tenant", table.workspaceId),
  ],
);

/**
 * 工作空间必须始终存在至少一个 active Owner。该条件涉及多行并发，不能用普通 CHECK；
 * Owner 转移必须锁定工作空间，在同一事务内完成，并由 deferred trigger 阻止最后 Owner 离开。
 */
export const workspaceMemberships = pgTable(
  "workspace_memberships",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    workspaceId: uuid("workspace_id")
      .notNull()
      .references(() => workspaces.id, { onDelete: "cascade" }),
    humanActorId: uuid("human_actor_id").notNull(),
    status: membershipStatus("status").notNull().default("invited"),
    isOwner: boolean("is_owner").notNull().default(false),
    invitedByActorId: uuid("invited_by_actor_id"),
    joinedAt: timestamp("joined_at", { withTimezone: true, mode: "date" }),
    suspendedAt: timestamp("suspended_at", { withTimezone: true, mode: "date" }),
    leftAt: timestamp("left_at", { withTimezone: true, mode: "date" }),
    ...lifecycleColumns(),
  },
  (table) => [
    foreignKey({
      name: "workspace_memberships_human_actor_fk",
      columns: [table.workspaceId, table.humanActorId],
      foreignColumns: [humanActors.workspaceId, humanActors.actorId],
    }).onDelete("restrict"),
    foreignKey({
      name: "workspace_memberships_inviter_fk",
      columns: [table.workspaceId, table.invitedByActorId],
      foreignColumns: [actors.workspaceId, actors.id],
    }).onDelete("restrict"),
    uniqueIndex("workspace_memberships_workspace_id_unique").on(table.workspaceId, table.id),
    uniqueIndex("workspace_memberships_actor_unique").on(table.workspaceId, table.humanActorId),
    index("workspace_memberships_status_idx").on(table.workspaceId, table.status),
    check(
      "workspace_memberships_owner_active_check",
      sql`not ${table.isOwner} or ${table.status} = 'active'`,
    ),
    workspacePolicy("workspace_memberships_tenant", table.workspaceId),
  ],
);
