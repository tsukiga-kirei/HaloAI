import {
  authorize,
  type AuthorizationReason,
  type BuiltInWorkspaceRole,
  type Principal,
} from "@haloai/core";
import { capabilityForAdminSection, type AdminSection } from "../lib/admin-sections";

const previewWorkspaceId = "preview-workspace";

export interface WorkspaceAdminAccess {
  readonly allowed: boolean;
  readonly reason: AuthorizationReason | "authentication_required";
  readonly role?: BuiltInWorkspaceRole;
  readonly workspaceName: string;
}

interface ResolveAccessInput {
  readonly section: AdminSection;
  readonly environment: "development" | "test" | "production";
  readonly previewRole?: BuiltInWorkspaceRole;
}

/**
 * Alpha 尚未接入真实会话，因此只在开发或测试环境创建服务端预览身份。
 * 生产环境必须默认拒绝，避免把客户端路由、查询参数或本地存储误当成授权事实。
 */
export function resolveWorkspaceAdminAccess(input: ResolveAccessInput): WorkspaceAdminAccess {
  if (input.environment === "production") {
    return {
      allowed: false,
      reason: "authentication_required",
      workspaceName: "HaloAI Pilot",
    };
  }

  const role = input.previewRole ?? "owner";
  const principal: Principal = {
    actorId: "preview-owner",
    actorKind: "human",
    actorStatus: "active",
    workspaceId: previewWorkspaceId,
    builtInRole: role,
    projectIds: new Set(),
  };
  const decision = authorize(principal, capabilityForAdminSection(input.section), {
    workspaceId: previewWorkspaceId,
  });

  return {
    allowed: decision.allowed,
    reason: decision.reason,
    role,
    workspaceName: "HaloAI Pilot",
  };
}

export function getWorkspaceAdminAccess(section: AdminSection): WorkspaceAdminAccess {
  const environment =
    process.env.NODE_ENV === "production"
      ? "production"
      : process.env.NODE_ENV === "test"
        ? "test"
        : "development";
  const configuredRole = process.env.HALOAI_ADMIN_PREVIEW_ROLE;
  const previewRole =
    configuredRole === "owner" ||
    configuredRole === "admin" ||
    configuredRole === "member" ||
    configuredRole === "guest"
      ? configuredRole
      : undefined;

  return resolveWorkspaceAdminAccess({
    section,
    environment,
    ...(previewRole === undefined ? {} : { previewRole }),
  });
}
