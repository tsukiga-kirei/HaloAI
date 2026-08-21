import { randomUUID } from "node:crypto";
import { auditEvents, type JsonObject } from "./schema/index";
import type { WorkspaceTransaction } from "./workspace-transaction";

export type AuditOutcome = "succeeded" | "failed" | "denied" | "cancelled";
export type PolicyDecision = "allow" | "deny" | "require_approval" | "not_applicable";

function isUuid(value: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/iu.test(value);
}

/**
 * 审计只写入脱敏后的标量摘要。调用方禁止传入令牌、密钥、完整请求体或模型原文；
 * 必须与业务变更放在同一工作空间事务中，保证失败时不会留下半截记录。
 */
export async function appendAuditEvent(
  transaction: WorkspaceTransaction,
  input: {
    workspaceId: string;
    principalActorId: string | null;
    membershipId?: string | null;
    action: string;
    resourceType: string;
    resourceId: string;
    decision?: PolicyDecision;
    outcome: AuditOutcome;
    reasonCode?: string | null;
    metadata?: JsonObject;
    requestId?: string;
  },
): Promise<void> {
  await transaction.insert(auditEvents).values({
    workspaceId: input.workspaceId,
    effectivePrincipalActorId: input.principalActorId,
    workspaceMembershipId: input.membershipId ?? null,
    traceId: input.requestId && isUuid(input.requestId) ? input.requestId : randomUUID(),
    action: input.action,
    resourceType: input.resourceType,
    resourceId: input.resourceId,
    decision: input.decision ?? "allow",
    policyVersion: "v1",
    outcome: input.outcome,
    reasonCode: input.reasonCode ?? null,
    sanitizedMetadata: input.metadata ?? {},
  });
}
