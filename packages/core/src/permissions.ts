import type { ActorKind, ActorStatus, BuiltInWorkspaceRole, Capability, Id } from "./models";

const roleCapabilities: Record<BuiltInWorkspaceRole, ReadonlySet<Capability>> = {
  owner: new Set<Capability>([
    "workspace.read",
    "workspace.manage",
    "workspace.security.manage",
    "member.invite",
    "member.manage",
    "agent.profile.read",
    "agent.profile.create",
    "agent.profile.publish",
    "agent.invoke",
    "room.read",
    "room.manage",
    "room.message.create",
    "document.read",
    "document.edit",
    "document.proposal.create",
    "document.proposal.review",
    "document.publish",
    "integration.tool.read.execute",
    "integration.tool.write.execute",
    "approval.request",
    "approval.review",
    "audit.read",
  ]),
  admin: new Set<Capability>([
    "workspace.read",
    "member.invite",
    "member.manage",
    "agent.profile.read",
    "agent.profile.create",
    "agent.profile.publish",
    "agent.invoke",
    "room.read",
    "room.manage",
    "room.message.create",
    "document.read",
    "document.edit",
    "document.proposal.create",
    "document.proposal.review",
    "document.publish",
    "integration.tool.read.execute",
    "integration.tool.write.execute",
    "approval.request",
    "approval.review",
    "audit.read",
  ]),
  member: new Set<Capability>([
    "workspace.read",
    "agent.profile.read",
    "agent.invoke",
    "room.read",
    "room.message.create",
    "document.read",
    "document.edit",
    "document.proposal.create",
    "document.proposal.review",
    "integration.tool.read.execute",
    "approval.request",
  ]),
  guest: new Set<Capability>(["workspace.read", "room.read", "document.read"]),
};

export interface Principal {
  actorId: Id;
  actorKind: ActorKind;
  actorStatus: ActorStatus;
  workspaceId?: Id;
  builtInRole?: BuiltInWorkspaceRole;
  projectIds: ReadonlySet<Id>;
  roomIds?: ReadonlySet<Id>;
  grantedCapabilities?: ReadonlySet<Capability>;
  deniedCapabilities?: ReadonlySet<Capability>;
}

export interface ResourceScope {
  workspaceId?: Id;
  projectId?: Id;
  roomId?: Id;
  requestedByActorId?: Id;
}

export type AuthorizationReason =
  | "allowed"
  | "tenant_context_missing"
  | "cross_workspace"
  | "principal_inactive"
  | "outside_project_scope"
  | "outside_room_scope"
  | "explicitly_denied"
  | "human_approval_required"
  | "capability_missing";

export interface AuthorizationDecision {
  allowed: boolean;
  reason: AuthorizationReason;
}

/**
 * 策略始终按“先拒绝、后允许”求值。尤其不能因为 ActorKind 是 agent 就给一套默认角色；
 * AI 只能获得已发布版本明确授予、且委托人同时拥有的能力交集。
 */
export function authorize(
  principal: Principal,
  capability: Capability,
  resource: ResourceScope,
): AuthorizationDecision {
  if (principal.workspaceId === undefined || resource.workspaceId === undefined) {
    return { allowed: false, reason: "tenant_context_missing" };
  }
  if (principal.workspaceId !== resource.workspaceId) {
    return { allowed: false, reason: "cross_workspace" };
  }
  if (principal.actorStatus !== "active") {
    return { allowed: false, reason: "principal_inactive" };
  }
  if (
    resource.projectId !== undefined &&
    principal.builtInRole !== "owner" &&
    principal.builtInRole !== "admin" &&
    !principal.projectIds.has(resource.projectId)
  ) {
    return { allowed: false, reason: "outside_project_scope" };
  }
  if (
    resource.roomId !== undefined &&
    principal.roomIds !== undefined &&
    !principal.roomIds.has(resource.roomId)
  ) {
    return { allowed: false, reason: "outside_room_scope" };
  }
  if (principal.deniedCapabilities?.has(capability) === true) {
    return { allowed: false, reason: "explicitly_denied" };
  }

  // 审批是人类治理边界；AI 可以申请审批，但不能成为最终审批主体，包括审批别的 AI。
  if (principal.actorKind !== "human" && capability === "approval.review") {
    return { allowed: false, reason: "human_approval_required" };
  }

  const roleAllows =
    principal.builtInRole === undefined
      ? false
      : roleCapabilities[principal.builtInRole].has(capability);
  const explicitGrant = principal.grantedCapabilities?.has(capability) ?? false;
  if (!roleAllows && !explicitGrant) {
    return { allowed: false, reason: "capability_missing" };
  }
  return { allowed: true, reason: "allowed" };
}

/**
 * 构建 AI Principal 时一次性求出静态授权交集；资源 ACL、预算、审批和实时撤权仍需在
 * 每次读取或工具执行点重新校验，不能把这个集合当作整次 Run 的永久通行证。
 */
export function intersectCapabilities(
  delegator: ReadonlySet<Capability>,
  agentVersion: ReadonlySet<Capability>,
  resourcePolicy: ReadonlySet<Capability>,
  toolPolicy: ReadonlySet<Capability>,
): ReadonlySet<Capability> {
  return new Set(
    [...delegator].filter(
      (capability) =>
        agentVersion.has(capability) &&
        resourcePolicy.has(capability) &&
        toolPolicy.has(capability),
    ),
  );
}

export class AuthorizationError extends Error {
  readonly decision: AuthorizationDecision;

  constructor(capability: Capability, decision: AuthorizationDecision) {
    super(`Capability ${capability} denied: ${decision.reason}`);
    this.name = "AuthorizationError";
    this.decision = decision;
  }
}

export function requirePermission(
  principal: Principal,
  capability: Capability,
  resource: ResourceScope,
): void {
  const decision = authorize(principal, capability, resource);
  if (!decision.allowed) throw new AuthorizationError(capability, decision);
}

export function capabilitiesForRole(role: BuiltInWorkspaceRole): ReadonlySet<Capability> {
  return new Set(roleCapabilities[role]);
}
