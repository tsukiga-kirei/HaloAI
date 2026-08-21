import { and, count, desc, eq, ilike, inArray, or, sql } from "drizzle-orm";
import type { DatabaseClient } from "../client";
import { PersistenceError } from "../errors";
import {
  accessRoles,
  actorRoleAssignments,
  actors,
  auditEvents,
  platformModels,
  roleCapabilityGrants,
  workspaceModelAllocations,
} from "../schema/index";
import { assertUuid, withWorkspaceTransaction } from "../workspace-transaction";
import type { MembershipContext } from "./workspace-onboarding-repository";

export type ListedAuditOutcome = "succeeded" | "failed" | "denied" | "cancelled";

export interface ListedAuditEvent {
  readonly id: string;
  readonly action: string;
  readonly resourceType: string;
  readonly resourceId: string;
  readonly decision: "allow" | "deny" | "require_approval" | "not_applicable";
  readonly outcome: ListedAuditOutcome;
  readonly reasonCode: string | null;
  readonly actorId: string | null;
  readonly actorName: string | null;
  readonly actorHandle: string | null;
  readonly occurredAt: Date;
  readonly metadata: Record<string, string | number | boolean | null>;
}

export interface ListedAllocatedModel {
  readonly id: string;
  readonly name: string;
  readonly provider: string;
  readonly apiFormat:
    | "openai_chat_completions"
    | "openai_responses"
    | "anthropic_messages"
    | "google_generate_content";
  readonly remoteModelId: string;
  readonly contextWindow: number | null;
  readonly status: "active" | "disabled";
  readonly secretConfigured: boolean;
  readonly allocatedAt: Date;
}

function escapeIlike(value: string): string {
  return value.replaceAll("\\", "\\\\").replaceAll("%", "\\%").replaceAll("_", "\\_");
}

function scalarMetadata(value: unknown): Record<string, string | number | boolean | null> {
  if (typeof value !== "object" || value === null || Array.isArray(value)) return {};
  const result: Record<string, string | number | boolean | null> = {};
  for (const [key, entry] of Object.entries(value)) {
    if (typeof entry === "string" || typeof entry === "number" || typeof entry === "boolean") {
      result[key] = entry;
    } else if (entry === null) {
      result[key] = null;
    }
  }
  return result;
}

/**
 * 工作空间治理读取走当前成员事务与 RLS。模型分配表没有租户策略，因此查询必须再次
 * 用已解析的 workspaceId 过滤，且不得选择密钥密文列。
 */
export class WorkspaceGovernanceRepository {
  constructor(private readonly client: DatabaseClient) {}

  async listAuditEvents(input: {
    principal: MembershipContext;
    requestId: string;
    page: number;
    pageSize: number;
    query?: string;
    outcome?: ListedAuditOutcome;
  }): Promise<{ items: ListedAuditEvent[]; total: number }> {
    if (input.principal.role === "guest") {
      throw new PersistenceError("access_denied", "当前成员无权读取审计记录");
    }
    return withWorkspaceTransaction(
      this.client.db,
      {
        workspaceId: input.principal.workspaceId,
        actorId: input.principal.actorId,
        requestId: input.requestId,
      },
      async (transaction) => {
        const filters = [eq(auditEvents.workspaceId, input.principal.workspaceId)];
        if (input.outcome) filters.push(eq(auditEvents.outcome, input.outcome));
        const keyword = input.query?.trim();
        if (keyword) {
          const pattern = `%${escapeIlike(keyword)}%`;
          filters.push(
            or(
              ilike(auditEvents.action, pattern),
              ilike(auditEvents.resourceType, pattern),
              ilike(auditEvents.resourceId, pattern),
              ilike(actors.displayName, pattern),
            )!,
          );
        }
        const where = and(...filters);
        const [totals, rows] = await Promise.all([
          transaction
            .select({ value: count() })
            .from(auditEvents)
            .leftJoin(
              actors,
              and(
                eq(actors.workspaceId, auditEvents.workspaceId),
                eq(actors.id, auditEvents.effectivePrincipalActorId),
              ),
            )
            .where(where),
          transaction
            .select({
              id: auditEvents.id,
              action: auditEvents.action,
              resourceType: auditEvents.resourceType,
              resourceId: auditEvents.resourceId,
              decision: auditEvents.decision,
              outcome: auditEvents.outcome,
              reasonCode: auditEvents.reasonCode,
              actorId: auditEvents.effectivePrincipalActorId,
              actorName: actors.displayName,
              actorHandle: actors.handle,
              occurredAt: auditEvents.occurredAt,
              metadata: auditEvents.sanitizedMetadata,
            })
            .from(auditEvents)
            .leftJoin(
              actors,
              and(
                eq(actors.workspaceId, auditEvents.workspaceId),
                eq(actors.id, auditEvents.effectivePrincipalActorId),
              ),
            )
            .where(where)
            .orderBy(desc(auditEvents.occurredAt), desc(auditEvents.id))
            .limit(input.pageSize)
            .offset((input.page - 1) * input.pageSize),
        ]);
        return {
          total: totals[0]?.value ?? 0,
          items: rows.map((row) => ({
            id: row.id,
            action: row.action,
            resourceType: row.resourceType,
            resourceId: row.resourceId,
            decision: row.decision,
            outcome: row.outcome,
            reasonCode: row.reasonCode,
            actorId: row.actorId,
            actorName: row.actorName,
            actorHandle: row.actorHandle,
            occurredAt: row.occurredAt,
            metadata: scalarMetadata(row.metadata),
          })),
        };
      },
    );
  }

  async listAllocatedModels(input: {
    principal: MembershipContext;
    requestId: string;
  }): Promise<ListedAllocatedModel[]> {
    assertUuid(input.principal.workspaceId, "workspaceId");
    return withWorkspaceTransaction(
      this.client.db,
      {
        workspaceId: input.principal.workspaceId,
        actorId: input.principal.actorId,
        requestId: input.requestId,
      },
      async (transaction) => {
        const rows = await transaction
          .select({
            id: platformModels.id,
            name: platformModels.name,
            provider: platformModels.provider,
            apiFormat: platformModels.apiFormat,
            remoteModelId: platformModels.remoteModelId,
            contextWindow: platformModels.contextWindow,
            status: platformModels.status,
            secretConfigured: sql<boolean>`(${platformModels.secretCiphertext} is not null)`,
            allocatedAt: workspaceModelAllocations.createdAt,
          })
          .from(workspaceModelAllocations)
          .innerJoin(platformModels, eq(platformModels.id, workspaceModelAllocations.modelId))
          .where(
            and(
              eq(workspaceModelAllocations.workspaceId, input.principal.workspaceId),
              eq(workspaceModelAllocations.status, "active"),
            ),
          )
          .orderBy(desc(workspaceModelAllocations.updatedAt), platformModels.name);
        return rows.map((row) => ({
          ...row,
          secretConfigured: Boolean(row.secretConfigured),
        }));
      },
    );
  }

  // === 自定义角色与细粒度权限治理 ===
  async listRoles(input: { principal: MembershipContext; requestId: string }): Promise<
    Array<{
      id: string;
      workspaceId: string;
      key: string;
      name: string;
      description: string;
      status: "active" | "archived";
      isBuiltIn: boolean;
      capabilities: string[];
      createdAt: Date;
      updatedAt: Date;
    }>
  > {
    assertUuid(input.principal.workspaceId, "workspaceId");
    return withWorkspaceTransaction(
      this.client.db,
      {
        workspaceId: input.principal.workspaceId,
        actorId: input.principal.actorId,
        requestId: input.requestId,
      },
      async (transaction) => {
        const roles = await transaction
          .select()
          .from(accessRoles)
          .where(eq(accessRoles.workspaceId, input.principal.workspaceId))
          .orderBy(desc(accessRoles.createdAt));

        const roleIds = roles.map((r) => r.id);
        const grants =
          roleIds.length > 0
            ? await transaction
                .select({
                  roleId: roleCapabilityGrants.roleId,
                  capabilityKey: roleCapabilityGrants.capabilityKey,
                })
                .from(roleCapabilityGrants)
                .where(
                  and(
                    eq(roleCapabilityGrants.workspaceId, input.principal.workspaceId),
                    inArray(roleCapabilityGrants.roleId, roleIds),
                  ),
                )
            : [];

        const capMap = new Map<string, string[]>();
        for (const grant of grants) {
          const list = capMap.get(grant.roleId) ?? [];
          list.push(grant.capabilityKey);
          capMap.set(grant.roleId, list);
        }

        return roles.map((role) => ({
          id: role.id,
          workspaceId: role.workspaceId,
          key: role.key,
          name: role.name,
          description: role.description,
          status: role.status,
          isBuiltIn: Boolean(role.builtIn),
          capabilities: capMap.get(role.id) ?? [],
          createdAt: role.createdAt,
          updatedAt: role.updatedAt,
        }));
      },
    );
  }

  async createRole(input: {
    principal: MembershipContext;
    requestId: string;
    key: string;
    name: string;
    description: string;
    capabilities: string[];
  }): Promise<{
    id: string;
    workspaceId: string;
    key: string;
    name: string;
    description: string;
    status: "active" | "archived";
    isBuiltIn: boolean;
    capabilities: string[];
    createdAt: Date;
    updatedAt: Date;
  }> {
    assertUuid(input.principal.workspaceId, "workspaceId");
    if (input.principal.role !== "owner" && input.principal.role !== "admin") {
      throw new PersistenceError("access_denied", "只有空间管理员或所有者可以创建自定义角色");
    }

    return withWorkspaceTransaction(
      this.client.db,
      {
        workspaceId: input.principal.workspaceId,
        actorId: input.principal.actorId,
        requestId: input.requestId,
      },
      async (transaction) => {
        const [existing] = await transaction
          .select({ id: accessRoles.id })
          .from(accessRoles)
          .where(
            and(
              eq(accessRoles.workspaceId, input.principal.workspaceId),
              eq(accessRoles.key, input.key.trim().toLowerCase()),
            ),
          );

        if (existing) {
          throw new PersistenceError("conflict", `角色标识「${input.key}」已存在`);
        }

        const now = new Date();
        const [createdRole] = await transaction
          .insert(accessRoles)
          .values({
            workspaceId: input.principal.workspaceId,
            key: input.key.trim().toLowerCase(),
            name: input.name.trim(),
            description: input.description.trim(),
            status: "active",
            builtIn: null,
          })
          .returning();

        if (!createdRole) {
          throw new PersistenceError("invalid_input", "创建自定义角色失败");
        }

        if (input.capabilities.length > 0) {
          await transaction.insert(roleCapabilityGrants).values(
            input.capabilities.map((cap) => ({
              workspaceId: input.principal.workspaceId,
              roleId: createdRole.id,
              capabilityKey: cap,
              effect: "allow" as const,
              grantedByActorId: input.principal.actorId,
            })),
          );
        }

        return {
          id: createdRole.id,
          workspaceId: createdRole.workspaceId,
          key: createdRole.key,
          name: createdRole.name,
          description: createdRole.description,
          status: createdRole.status,
          isBuiltIn: false,
          capabilities: input.capabilities,
          createdAt: createdRole.createdAt,
          updatedAt: createdRole.updatedAt,
        };
      },
    );
  }

  async updateRole(input: {
    principal: MembershipContext;
    requestId: string;
    roleId: string;
    name?: string | undefined;
    description?: string | undefined;
    capabilities?: string[] | undefined;
    status?: "active" | "archived" | undefined;
  }): Promise<void> {
    assertUuid(input.principal.workspaceId, "workspaceId");
    assertUuid(input.roleId, "roleId");
    if (input.principal.role !== "owner" && input.principal.role !== "admin") {
      throw new PersistenceError("access_denied", "只有空间管理员或所有者可以修改自定义角色");
    }

    return withWorkspaceTransaction(
      this.client.db,
      {
        workspaceId: input.principal.workspaceId,
        actorId: input.principal.actorId,
        requestId: input.requestId,
      },
      async (transaction) => {
        const [role] = await transaction
          .select()
          .from(accessRoles)
          .where(
            and(
              eq(accessRoles.workspaceId, input.principal.workspaceId),
              eq(accessRoles.id, input.roleId),
            ),
          );

        if (!role) {
          throw new PersistenceError("not_found", "角色不存在");
        }

        const updateSet: Partial<typeof accessRoles.$inferInsert> = {
          updatedAt: new Date(),
        };
        if (input.name !== undefined) updateSet.name = input.name.trim();
        if (input.description !== undefined) updateSet.description = input.description.trim();
        if (input.status !== undefined) updateSet.status = input.status;

        await transaction
          .update(accessRoles)
          .set(updateSet)
          .where(
            and(
              eq(accessRoles.workspaceId, input.principal.workspaceId),
              eq(accessRoles.id, input.roleId),
            ),
          );

        if (input.capabilities !== undefined) {
          await transaction
            .delete(roleCapabilityGrants)
            .where(
              and(
                eq(roleCapabilityGrants.workspaceId, input.principal.workspaceId),
                eq(roleCapabilityGrants.roleId, input.roleId),
              ),
            );

          if (input.capabilities.length > 0) {
            await transaction.insert(roleCapabilityGrants).values(
              input.capabilities.map((cap) => ({
                workspaceId: input.principal.workspaceId,
                roleId: input.roleId,
                capabilityKey: cap,
                effect: "allow" as const,
                grantedByActorId: input.principal.actorId,
              })),
            );
          }
        }
      },
    );
  }

  async deleteRole(input: {
    principal: MembershipContext;
    requestId: string;
    roleId: string;
  }): Promise<void> {
    assertUuid(input.principal.workspaceId, "workspaceId");
    assertUuid(input.roleId, "roleId");
    if (input.principal.role !== "owner" && input.principal.role !== "admin") {
      throw new PersistenceError("access_denied", "只有空间管理员或所有者可以删除自定义角色");
    }

    return withWorkspaceTransaction(
      this.client.db,
      {
        workspaceId: input.principal.workspaceId,
        actorId: input.principal.actorId,
        requestId: input.requestId,
      },
      async (transaction) => {
        const [role] = await transaction
          .select()
          .from(accessRoles)
          .where(
            and(
              eq(accessRoles.workspaceId, input.principal.workspaceId),
              eq(accessRoles.id, input.roleId),
            ),
          );

        if (!role) {
          throw new PersistenceError("not_found", "角色不存在");
        }
        if (role.builtIn) {
          throw new PersistenceError("access_denied", "内置系统角色不允许删除");
        }

        await transaction
          .delete(accessRoles)
          .where(
            and(
              eq(accessRoles.workspaceId, input.principal.workspaceId),
              eq(accessRoles.id, input.roleId),
            ),
          );
      },
    );
  }

  // === 成员自定义角色绑定 ===
  async listMemberRoles(input: {
    principal: MembershipContext;
    requestId: string;
    memberActorId: string;
  }): Promise<string[]> {
    assertUuid(input.principal.workspaceId, "workspaceId");
    assertUuid(input.memberActorId, "memberActorId");
    return withWorkspaceTransaction(
      this.client.db,
      {
        workspaceId: input.principal.workspaceId,
        actorId: input.principal.actorId,
        requestId: input.requestId,
      },
      async (transaction) => {
        const rows = await transaction
          .select({ roleId: actorRoleAssignments.roleId })
          .from(actorRoleAssignments)
          .where(
            and(
              eq(actorRoleAssignments.workspaceId, input.principal.workspaceId),
              eq(actorRoleAssignments.actorId, input.memberActorId),
              eq(actorRoleAssignments.status, "active"),
            ),
          );
        return rows.map((r) => r.roleId);
      },
    );
  }

  async assignMemberRoles(input: {
    principal: MembershipContext;
    requestId: string;
    memberActorId: string;
    roleIds: string[];
  }): Promise<void> {
    assertUuid(input.principal.workspaceId, "workspaceId");
    assertUuid(input.memberActorId, "memberActorId");
    if (input.principal.role !== "owner" && input.principal.role !== "admin") {
      throw new PersistenceError("access_denied", "只有空间管理员或所有者可以为成员分配角色");
    }

    for (const rid of input.roleIds) {
      assertUuid(rid, "roleId");
    }

    return withWorkspaceTransaction(
      this.client.db,
      {
        workspaceId: input.principal.workspaceId,
        actorId: input.principal.actorId,
        requestId: input.requestId,
      },
      async (transaction) => {
        await transaction
          .delete(actorRoleAssignments)
          .where(
            and(
              eq(actorRoleAssignments.workspaceId, input.principal.workspaceId),
              eq(actorRoleAssignments.actorId, input.memberActorId),
            ),
          );

        if (input.roleIds.length > 0) {
          await transaction.insert(actorRoleAssignments).values(
            input.roleIds.map((roleId) => ({
              workspaceId: input.principal.workspaceId,
              actorId: input.memberActorId,
              roleId,
              scope: "workspace" as const,
              scopeId: input.principal.workspaceId,
              status: "active" as const,
              grantedByActorId: input.principal.actorId,
            })),
          );
        }
      },
    );
  }
}
