import { index, pgTable, text, timestamp, uniqueIndex, uuid } from "drizzle-orm/pg-core";
import { lifecycleColumns } from "./common";
import { users } from "./identity";

/**
 * 认证表由认证组件独占。密码只存在于 credential Account 的 password 哈希字段；
 * 应用代码禁止读取或记录该字段，数据库权限也只授予专用认证角色。
 */
export const authAccounts = pgTable(
  "auth_accounts",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    accountId: text("account_id").notNull(),
    providerId: text("provider_id").notNull(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    accessToken: text("access_token"),
    refreshToken: text("refresh_token"),
    idToken: text("id_token"),
    accessTokenExpiresAt: timestamp("access_token_expires_at", {
      withTimezone: true,
      mode: "date",
    }),
    refreshTokenExpiresAt: timestamp("refresh_token_expires_at", {
      withTimezone: true,
      mode: "date",
    }),
    scope: text("scope"),
    password: text("password"),
    ...lifecycleColumns(),
  },
  (table) => [
    uniqueIndex("auth_accounts_provider_account_unique").on(table.providerId, table.accountId),
    index("auth_accounts_user_idx").on(table.userId),
  ],
);

/** Session token 是高熵不透明凭据；数据库只向认证角色开放，业务查询只使用 session id。 */
export const authSessions = pgTable(
  "auth_sessions",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    token: text("token").notNull(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    expiresAt: timestamp("expires_at", { withTimezone: true, mode: "date" }).notNull(),
    ipAddress: text("ip_address"),
    userAgent: text("user_agent"),
    ...lifecycleColumns(),
  },
  (table) => [
    uniqueIndex("auth_sessions_token_unique").on(table.token),
    index("auth_sessions_user_expires_idx").on(table.userId, table.expiresAt),
  ],
);

/** 验证值承载短期邮箱验证或密码重置凭据，过期后必须能够安全清理。 */
export const authVerifications = pgTable(
  "auth_verifications",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    identifier: text("identifier").notNull(),
    value: text("value").notNull(),
    expiresAt: timestamp("expires_at", { withTimezone: true, mode: "date" }).notNull(),
    ...lifecycleColumns(),
  },
  (table) => [index("auth_verifications_identifier_idx").on(table.identifier, table.expiresAt)],
);
