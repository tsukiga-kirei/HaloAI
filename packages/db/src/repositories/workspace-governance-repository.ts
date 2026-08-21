import { and, count, desc, eq, ilike, or, sql } from "drizzle-orm";
import type { DatabaseClient } from "../client";
import { PersistenceError } from "../errors";
import { actors, auditEvents, platformModels, workspaceModelAllocations } from "../schema/index";
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
}
