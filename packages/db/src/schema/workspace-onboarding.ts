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
import { lifecycleColumns, workspacePolicy } from "./common";
import { actors, users, workspaceDepartments, workspaces } from "./identity";

/**
 * 邀请只保存随机令牌的 SHA-256 摘要。原始令牌只出现在一次性投递链接中，
 * 因而数据库泄露不会直接产生可接受的邀请凭据。
 */
export const workspaceInvitations = pgTable(
  "workspace_invitations",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    workspaceId: uuid("workspace_id")
      .notNull()
      .references(() => workspaces.id, { onDelete: "cascade" }),
    email: text("email").notNull(),
    requestedRole: varchar("requested_role", { length: 32 }).notNull(),
    departmentId: uuid("department_id"),
    jobTitle: varchar("job_title", { length: 120 }).notNull().default(""),
    tokenDigest: text("token_digest").notNull(),
    invitedByActorId: uuid("invited_by_actor_id").notNull(),
    expiresAt: timestamp("expires_at", { withTimezone: true, mode: "date" }).notNull(),
    acceptedByUserId: uuid("accepted_by_user_id").references(() => users.id, {
      onDelete: "restrict",
    }),
    acceptedAt: timestamp("accepted_at", { withTimezone: true, mode: "date" }),
    revokedAt: timestamp("revoked_at", { withTimezone: true, mode: "date" }),
    ...lifecycleColumns(),
  },
  (table) => [
    foreignKey({
      name: "workspace_invitations_inviter_fk",
      columns: [table.workspaceId, table.invitedByActorId],
      foreignColumns: [actors.workspaceId, actors.id],
    }).onDelete("restrict"),
    foreignKey({
      name: "workspace_invitations_department_fk",
      columns: [table.workspaceId, table.departmentId],
      foreignColumns: [workspaceDepartments.workspaceId, workspaceDepartments.id],
    }).onDelete("restrict"),
    uniqueIndex("workspace_invitations_token_digest_unique").on(table.tokenDigest),
    index("workspace_invitations_email_idx").on(table.email, table.expiresAt),
    index("workspace_invitations_workspace_idx").on(table.workspaceId, table.createdAt),
    check(
      "workspace_invitations_role_check",
      sql`${table.requestedRole} in ('admin', 'member', 'guest')`,
    ),
    check(
      "workspace_invitations_acceptance_check",
      sql`(${table.acceptedAt} is null and ${table.acceptedByUserId} is null) or (${table.acceptedAt} is not null and ${table.acceptedByUserId} is not null)`,
    ),
    workspacePolicy("workspace_invitations_tenant", table.workspaceId),
  ],
);
