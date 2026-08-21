import { authorize, type Capability } from "@haloai/core";
import type { MembershipContext } from "@haloai/db";
import { HttpError } from "./http-error";

/**
 * 工作空间 API 在解析 Membership 之后再次求 Capability。角色来自服务端成员关系，
 * 不能信任客户端传入的 role、capability 或 tenantId。
 */
export function requireWorkspaceCapability(
  principal: MembershipContext,
  capability: Capability,
): void {
  const decision = authorize(
    {
      actorId: principal.actorId,
      actorKind: "human",
      actorStatus: "active",
      workspaceId: principal.workspaceId,
      builtInRole: principal.role,
      projectIds: new Set(),
    },
    capability,
    { workspaceId: principal.workspaceId },
  );
  if (!decision.allowed) {
    throw new HttpError("permission_denied", "errors.permissionDenied");
  }
}
