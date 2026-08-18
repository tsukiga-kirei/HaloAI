import { headers } from "next/headers";
import { resolveApiOrigin } from "../lib/api-origin";

export interface SystemAdminAccess {
  readonly allowed: boolean;
  readonly reason:
    "authentication_required" | "permission_denied" | "service_unavailable" | "authorized";
}

interface ResolveAccessInput {
  readonly responseStatus: number;
}

/**
 * 页面守卫只解释 API 的稳定状态；真正授权由 API 会话与数据库中的独立平台身份共同决定。
 * 开发环境也不再提供绕过入口，避免预览行为掩盖认证缺口。
 */
export function resolveSystemAdminAccess(input: ResolveAccessInput): SystemAdminAccess {
  if (input.responseStatus === 200) return { allowed: true, reason: "authorized" };
  if (input.responseStatus === 401) return { allowed: false, reason: "authentication_required" };
  if (input.responseStatus === 403) return { allowed: false, reason: "permission_denied" };
  return { allowed: false, reason: "service_unavailable" };
}

export async function getSystemAdminAccess(): Promise<SystemAdminAccess> {
  const incomingHeaders = await headers();
  const cookie = incomingHeaders.get("cookie");
  if (!cookie) return resolveSystemAdminAccess({ responseStatus: 401 });
  try {
    const response = await fetch(`${resolveApiOrigin()}/v1/system/access`, {
      headers: { cookie },
      cache: "no-store",
      signal: AbortSignal.timeout(3_000),
    });
    return resolveSystemAdminAccess({ responseStatus: response.status });
  } catch {
    return resolveSystemAdminAccess({ responseStatus: 503 });
  }
}
