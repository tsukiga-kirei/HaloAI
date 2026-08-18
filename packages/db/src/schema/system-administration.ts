import { sql } from "drizzle-orm";
import {
  check,
  index,
  integer,
  pgTable,
  text,
  uniqueIndex,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";
import { lifecycleColumns } from "./common";
import {
  modelAllocationStatus,
  platformModelApiFormat,
  platformModelStatus,
  systemAdministratorStatus,
} from "./enums";
import { users, workspaces } from "./identity";

/**
 * 平台管理员是独立于工作空间角色的授权记录。Workspace Owner 不得通过成员资格隐式进入系统后台，
 * 所有跨租户目录函数都必须先检查此表中的 active 状态。
 */
export const systemAdministrators = pgTable(
  "system_administrators",
  {
    userId: uuid("user_id")
      .primaryKey()
      .references(() => users.id, { onDelete: "cascade" }),
    status: systemAdministratorStatus("status").notNull().default("active"),
    ...lifecycleColumns(),
  },
  (table) => [index("system_administrators_status_idx").on(table.status)],
);

/**
 * 平台模型目录显式保存远端协议格式，避免把请求结构不同的供应商都伪装成同一种兼容接口。
 * API Key 使用 AES-256-GCM 加密后拆分存储；四个密文字段必须同时为空或同时存在。
 */
export const platformModels = pgTable(
  "platform_models",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    name: text("name").notNull(),
    provider: varchar("provider", { length: 120 }).notNull(),
    apiFormat: platformModelApiFormat("api_format").notNull(),
    remoteModelId: varchar("remote_model_id", { length: 200 }).notNull(),
    baseUrl: text("base_url"),
    contextWindow: integer("context_window"),
    status: platformModelStatus("status").notNull().default("active"),
    secretCiphertext: text("secret_ciphertext"),
    secretIv: varchar("secret_iv", { length: 64 }),
    secretTag: varchar("secret_tag", { length: 64 }),
    secretKeyVersion: varchar("secret_key_version", { length: 64 }),
    ...lifecycleColumns(),
  },
  (table) => [
    uniqueIndex("platform_models_provider_remote_unique").on(
      table.provider,
      table.apiFormat,
      table.remoteModelId,
    ),
    index("platform_models_status_updated_idx").on(table.status, table.updatedAt),
    check(
      "platform_models_context_window_check",
      sql`${table.contextWindow} is null or ${table.contextWindow} > 0`,
    ),
    check(
      "platform_models_secret_tuple_check",
      sql`num_nonnulls(${table.secretCiphertext}, ${table.secretIv}, ${table.secretTag}, ${table.secretKeyVersion}) in (0, 4)`,
    ),
  ],
);

/**
 * 模型分配只建立“平台模型可被某租户选择”的授权边界，不会授予系统人员读取租户内容的权限。
 * 收回使用状态而非删除事实，便于后续审计与运行快照解释。
 */
export const workspaceModelAllocations = pgTable(
  "workspace_model_allocations",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    workspaceId: uuid("workspace_id")
      .notNull()
      .references(() => workspaces.id, { onDelete: "cascade" }),
    modelId: uuid("model_id")
      .notNull()
      .references(() => platformModels.id, { onDelete: "restrict" }),
    status: modelAllocationStatus("status").notNull().default("active"),
    ...lifecycleColumns(),
  },
  (table) => [
    uniqueIndex("workspace_model_allocations_unique").on(table.workspaceId, table.modelId),
    index("workspace_model_allocations_workspace_status_idx").on(table.workspaceId, table.status),
  ],
);

/**
 * 系统设置保存平台默认语言与认证会话策略。键值由系统管理员写入，签发新会话时读取；
 * 环境变量只在对应键缺失时提供启动缺省，页面不得展示一份不会生效的只读副本。
 */
export const systemSettings = pgTable(
  "system_settings",
  {
    key: varchar("key", { length: 80 }).primaryKey(),
    value: text("value").notNull(),
    ...lifecycleColumns(),
  },
  (table) => [check("system_settings_key_check", sql`${table.key} <> ''`)],
);
