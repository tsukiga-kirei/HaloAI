import { count, desc, eq, ilike, or } from "drizzle-orm";
import type { DatabaseClient } from "../client";
import { PersistenceError } from "../errors";
import { platformModels, systemSettings } from "../schema/system-administration";
import { assertUuid } from "../workspace-transaction";

export type PlatformModelApiFormat =
  "openai_chat_completions" | "openai_responses" | "anthropic_messages" | "google_generate_content";
export type PlatformModelStatus = "active" | "disabled";
export type WorkspaceStatus = "active" | "suspended" | "archived";

export interface PageRequest {
  readonly page: number;
  readonly pageSize: number;
  readonly query?: string | undefined;
}

export interface PlatformTenantRow {
  readonly id: string;
  readonly slug: string;
  readonly name: string;
  readonly status: WorkspaceStatus;
  readonly defaultLocale: string;
  readonly timeZone: string;
  readonly memberCount: number;
  readonly departmentCount: number;
  readonly defaultAdministratorName: string;
  readonly defaultAdministratorEmail: string;
  readonly createdAt: Date;
}

export interface PlatformModelRow {
  readonly id: string;
  readonly name: string;
  readonly provider: string;
  readonly apiFormat: PlatformModelApiFormat;
  readonly remoteModelId: string;
  readonly baseUrl: string | null;
  readonly contextWindow: number | null;
  readonly status: PlatformModelStatus;
  readonly secretConfigured: boolean;
  readonly createdAt: Date;
  readonly updatedAt: Date;
  readonly allocations: ReadonlyArray<{
    readonly id: string;
    readonly workspaceId: string;
    readonly workspaceName: string;
    readonly status: "active" | "revoked";
  }>;
}

interface OverviewFunctionRow {
  tenant_total: string | number;
  active_tenant_total: string | number;
  model_total: string | number;
  active_model_total: string | number;
}

interface TenantFunctionRow {
  workspace_id: string;
  workspace_slug: string;
  workspace_name: string;
  workspace_status: WorkspaceStatus;
  default_locale: string;
  time_zone: string;
  member_count: string | number;
  department_count: string | number;
  default_administrator_name: string;
  default_administrator_email: string;
  created_at: Date | string;
  total_count: string | number;
}

interface AllocationFunctionRow {
  allocation_id: string;
  model_id: string;
  workspace_id: string;
  workspace_name: string;
  allocation_status: "active" | "revoked";
}

function asNumber(value: string | number): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function normalizePage(request: PageRequest): { page: number; pageSize: number; offset: number } {
  const page = Math.max(1, Math.floor(request.page));
  const pageSize = Math.max(1, Math.min(100, Math.floor(request.pageSize)));
  return { page, pageSize, offset: (page - 1) * pageSize };
}

/**
 * 系统管理仓储只接受已验证会话的 userId。跨租户数据必须通过 migration 中的窄函数读取，
 * 这些函数会再次验证独立平台身份；模型目录是全局资源，不带工作空间上下文。
 */
export class SystemAdministrationRepository {
  constructor(private readonly client: DatabaseClient) {}

  async isSystemAdministrator(userId: string): Promise<boolean> {
    assertUuid(userId, "userId");
    const rows = await this.client.connection<{ allowed: boolean }[]>`
      select haloai_is_system_administrator(${userId}::uuid) as allowed
    `;
    return rows[0]?.allowed === true;
  }

  async overview(userId: string) {
    assertUuid(userId, "userId");
    const rows = await this.client.connection<OverviewFunctionRow[]>`
      select * from haloai_system_overview(${userId}::uuid)
    `;
    const row = rows[0];
    if (!row) throw new PersistenceError("access_denied", "当前账户不是系统管理员");
    return {
      tenantTotal: asNumber(row.tenant_total),
      activeTenantTotal: asNumber(row.active_tenant_total),
      modelTotal: asNumber(row.model_total),
      activeModelTotal: asNumber(row.active_model_total),
    };
  }

  async listTenants(userId: string, request: PageRequest) {
    assertUuid(userId, "userId");
    const { page, pageSize, offset } = normalizePage(request);
    const query = request.query?.trim() ?? "";
    const rows = await this.client.connection<TenantFunctionRow[]>`
      select * from haloai_system_list_tenants(
        ${userId}::uuid,
        ${query},
        ${pageSize},
        ${offset}
      )
    `;
    return {
      items: rows.map((row) => ({
        id: row.workspace_id,
        slug: row.workspace_slug,
        name: row.workspace_name,
        status: row.workspace_status,
        defaultLocale: row.default_locale,
        timeZone: row.time_zone,
        memberCount: asNumber(row.member_count),
        departmentCount: asNumber(row.department_count),
        defaultAdministratorName: row.default_administrator_name,
        defaultAdministratorEmail: row.default_administrator_email,
        createdAt: row.created_at instanceof Date ? row.created_at : new Date(row.created_at),
      })),
      page,
      pageSize,
      total: rows[0] ? asNumber(rows[0].total_count) : 0,
    };
  }

  async createTenant(
    userId: string,
    input: {
      name: string;
      slug: string;
      defaultLocale: "zh-CN" | "en-US";
      timeZone: string;
      defaultAdministratorEmail: string;
    },
  ): Promise<string> {
    assertUuid(userId, "userId");
    const rows = await this.client.connection<{ workspace_id: string | null }[]>`
      select haloai_system_create_tenant(
        ${userId}::uuid,
        ${input.name},
        ${input.slug},
        ${input.defaultLocale},
        ${input.timeZone},
        ${input.defaultAdministratorEmail}
      ) as workspace_id
    `;
    const id = rows[0]?.workspace_id;
    if (!id) {
      throw new PersistenceError("not_found", "默认管理员账户不存在或无权创建租户");
    }
    return id;
  }

  async updateTenant(
    userId: string,
    input: {
      id: string;
      status: WorkspaceStatus;
      defaultLocale: "zh-CN" | "en-US";
      timeZone: string;
    },
  ): Promise<void> {
    assertUuid(userId, "userId");
    assertUuid(input.id, "workspaceId");
    const rows = await this.client.connection<{ updated: boolean }[]>`
      select haloai_system_update_tenant(
        ${userId}::uuid,
        ${input.id}::uuid,
        ${input.status}::workspace_status,
        ${input.defaultLocale}::varchar,
        ${input.timeZone}::varchar
      ) as updated
    `;
    if (!rows[0]?.updated) throw new PersistenceError("not_found", "租户不存在或无权修改");
  }

  async listModels(userId: string, request: PageRequest) {
    assertUuid(userId, "userId");
    const { page, pageSize, offset } = normalizePage(request);
    const query = request.query?.trim();
    const filter = query
      ? or(
          ilike(platformModels.name, `%${query}%`),
          ilike(platformModels.provider, `%${query}%`),
          ilike(platformModels.remoteModelId, `%${query}%`),
        )
      : undefined;
    const [items, totals, allocationRows] = await Promise.all([
      this.client.db
        .select()
        .from(platformModels)
        .where(filter)
        .orderBy(desc(platformModels.updatedAt), desc(platformModels.id))
        .limit(pageSize)
        .offset(offset),
      this.client.db.select({ value: count() }).from(platformModels).where(filter),
      this.client.connection<AllocationFunctionRow[]>`
        select * from haloai_system_list_model_allocations(${userId}::uuid)
      `,
    ]);
    const allocationsByModel = new Map<string, PlatformModelRow["allocations"]>();
    for (const allocation of allocationRows) {
      const current = allocationsByModel.get(allocation.model_id) ?? [];
      allocationsByModel.set(allocation.model_id, [
        ...current,
        {
          id: allocation.allocation_id,
          workspaceId: allocation.workspace_id,
          workspaceName: allocation.workspace_name,
          status: allocation.allocation_status,
        },
      ]);
    }
    return {
      items: items.map((item) => ({
        id: item.id,
        name: item.name,
        provider: item.provider,
        apiFormat: item.apiFormat,
        remoteModelId: item.remoteModelId,
        baseUrl: item.baseUrl,
        contextWindow: item.contextWindow,
        status: item.status,
        secretConfigured: item.secretCiphertext !== null,
        createdAt: item.createdAt,
        updatedAt: item.updatedAt,
        allocations: allocationsByModel.get(item.id) ?? [],
      })),
      page,
      pageSize,
      total: totals[0]?.value ?? 0,
    };
  }

  async createModel(input: typeof platformModels.$inferInsert): Promise<string> {
    const [created] = await this.client.db.insert(platformModels).values(input).returning({
      id: platformModels.id,
    });
    if (!created) throw new PersistenceError("invalid_context", "模型登记失败");
    return created.id;
  }

  async updateModel(id: string, input: Partial<typeof platformModels.$inferInsert>): Promise<void> {
    assertUuid(id, "modelId");
    const [updated] = await this.client.db
      .update(platformModels)
      .set({ ...input, updatedAt: new Date() })
      .where(eq(platformModels.id, id))
      .returning({ id: platformModels.id });
    if (!updated) throw new PersistenceError("not_found", "模型不存在");
  }

  async setModelAllocation(
    userId: string,
    input: { modelId: string; workspaceId: string; enabled: boolean },
  ): Promise<void> {
    assertUuid(userId, "userId");
    assertUuid(input.modelId, "modelId");
    assertUuid(input.workspaceId, "workspaceId");
    const rows = await this.client.connection<{ updated: boolean }[]>`
      select haloai_system_set_model_allocation(
        ${userId}::uuid,
        ${input.modelId}::uuid,
        ${input.workspaceId}::uuid,
        ${input.enabled}
      ) as updated
    `;
    if (!rows[0]?.updated) throw new PersistenceError("access_denied", "无权分配模型");
  }

  async getSettings(defaults?: {
    sessionExpiresInSeconds: number;
    sessionUpdateAgeSeconds: number;
  }): Promise<{
    defaultLocale: "zh-CN" | "en-US";
    authentication: {
      mode: "database_session";
      sessionExpiresInSeconds: number;
      sessionUpdateAgeSeconds: number;
      slidingRenewal: boolean;
    };
  }> {
    const rows = await this.client.db
      .select({ key: systemSettings.key, value: systemSettings.value })
      .from(systemSettings);
    const values = new Map(rows.map((row) => [row.key, row.value]));
    const sessionExpiresInSeconds = parsePositiveInt(
      values.get("session_expires_in_seconds"),
      defaults?.sessionExpiresInSeconds ?? 604_800,
    );
    const sessionUpdateAgeSeconds = parseNonNegativeInt(
      values.get("session_update_age_seconds"),
      defaults?.sessionUpdateAgeSeconds ?? 86_400,
    );
    return {
      defaultLocale: values.get("default_locale") === "en-US" ? "en-US" : "zh-CN",
      authentication: {
        mode: "database_session",
        sessionExpiresInSeconds,
        sessionUpdateAgeSeconds,
        slidingRenewal: parseBoolean(values.get("sliding_renewal"), true),
      },
    };
  }

  async updateSettings(input: {
    defaultLocale: "zh-CN" | "en-US";
    sessionExpiresInSeconds: number;
    sessionUpdateAgeSeconds: number;
    slidingRenewal: boolean;
  }): Promise<void> {
    const entries = [
      { key: "default_locale", value: input.defaultLocale },
      { key: "session_expires_in_seconds", value: String(input.sessionExpiresInSeconds) },
      { key: "session_update_age_seconds", value: String(input.sessionUpdateAgeSeconds) },
      { key: "sliding_renewal", value: input.slidingRenewal ? "true" : "false" },
    ] as const;
    const now = new Date();
    for (const entry of entries) {
      await this.client.db
        .insert(systemSettings)
        .values({ key: entry.key, value: entry.value })
        .onConflictDoUpdate({
          target: systemSettings.key,
          set: { value: entry.value, updatedAt: now },
        });
    }
  }
}

function parsePositiveInt(value: string | undefined, fallback: number): number {
  if (!value) return fallback;
  const parsed = Number.parseInt(value, 10);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : fallback;
}

function parseNonNegativeInt(value: string | undefined, fallback: number): number {
  if (!value) return fallback;
  const parsed = Number.parseInt(value, 10);
  return Number.isInteger(parsed) && parsed >= 0 ? parsed : fallback;
}

function parseBoolean(value: string | undefined, fallback: boolean): boolean {
  if (value === "true") return true;
  if (value === "false") return false;
  return fallback;
}
