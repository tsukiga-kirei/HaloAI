import { headers } from "next/headers";
import type { BuiltInWorkspaceRole } from "@haloai/core";
import { WorkspaceAdminAccessResponseSchema, type WorkspaceAdminSection } from "@haloai/contracts";
import { resolveApiOrigin } from "../lib/api-origin";
import { WORKSPACE_STORAGE_KEY } from "../lib/portals";

export interface WorkspaceAdminAccess {
  readonly allowed: boolean;
  readonly reason:
    "authentication_required" | "permission_denied" | "service_unavailable" | "authorized";
  readonly role?: BuiltInWorkspaceRole | undefined;
  readonly workspaceName: string;
}

interface ResolveAccessInput {
  readonly responseStatus: number;
  readonly role?: BuiltInWorkspaceRole | undefined;
  readonly workspaceName?: string | undefined;
}

/**
 * 页面守卫只解释 API 的稳定状态。真正授权由会话 Membership 与 Capability 决定，
 * 开发环境也不再提供预览 Owner 绕过。
 */
export function resolveWorkspaceAdminAccess(input: ResolveAccessInput): WorkspaceAdminAccess {
  if (input.responseStatus === 200) {
    return {
      allowed: true,
      reason: "authorized",
      role: input.role,
      workspaceName: input.workspaceName ?? "HaloAI",
    };
  }
  if (input.responseStatus === 401) {
    return { allowed: false, reason: "authentication_required", workspaceName: "HaloAI" };
  }
  if (input.responseStatus === 403) {
    return { allowed: false, reason: "permission_denied", workspaceName: "HaloAI" };
  }
  return { allowed: false, reason: "service_unavailable", workspaceName: "HaloAI" };
}

function readCookie(header: string, name: string): string | null {
  for (const part of header.split(";")) {
    const [key, ...rest] = part.trim().split("=");
    if (key === name) return decodeURIComponent(rest.join("="));
  }
  return null;
}

export async function getWorkspaceAdminAccess(
  section: WorkspaceAdminSection,
): Promise<WorkspaceAdminAccess> {
  const incomingHeaders = await headers();
  const cookie = incomingHeaders.get("cookie");
  if (!cookie) return resolveWorkspaceAdminAccess({ responseStatus: 401 });
  const remembered = readCookie(cookie, WORKSPACE_STORAGE_KEY);
  try {
    const sessionResponse = await fetch(`${resolveApiOrigin()}/v1/session`, {
      headers: { cookie },
      cache: "no-store",
      signal: AbortSignal.timeout(3_000),
    });
    if (sessionResponse.status !== 200) {
      return resolveWorkspaceAdminAccess({ responseStatus: sessionResponse.status });
    }
    const session = (await sessionResponse.json()) as {
      workspaces?: ReadonlyArray<{ id: string }>;
    };
    const workspaceId =
      session.workspaces?.find((item) => item.id === remembered)?.id ?? session.workspaces?.[0]?.id;
    if (!workspaceId) return resolveWorkspaceAdminAccess({ responseStatus: 403 });
    const accessResponse = await fetch(
      `${resolveApiOrigin()}/v1/workspaces/${workspaceId}/access?section=${section}`,
      {
        headers: { cookie },
        cache: "no-store",
        signal: AbortSignal.timeout(3_000),
      },
    );
    if (accessResponse.status !== 200) {
      return resolveWorkspaceAdminAccess({ responseStatus: accessResponse.status });
    }
    const payload = WorkspaceAdminAccessResponseSchema.parse(await accessResponse.json());
    return resolveWorkspaceAdminAccess({
      responseStatus: 200,
      role: payload.role,
      workspaceName: payload.workspaceName,
    });
  } catch {
    return resolveWorkspaceAdminAccess({ responseStatus: 503 });
  }
}
