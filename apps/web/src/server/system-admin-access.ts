export interface SystemAdminAccess {
  readonly allowed: boolean;
  readonly reason: "authentication_required" | "preview_allowed";
}

interface ResolveAccessInput {
  readonly environment: "development" | "test" | "production";
}

/**
 * 系统后台使用独立平台身份。生产环境在真实认证接入前默认拒绝；
 * 开发与测试仅提供不含租户内容的预览壳，不得把 Workspace 角色当成系统管理员。
 */
export function resolveSystemAdminAccess(input: ResolveAccessInput): SystemAdminAccess {
  if (input.environment === "production") {
    return { allowed: false, reason: "authentication_required" };
  }
  return { allowed: true, reason: "preview_allowed" };
}

export function getSystemAdminAccess(): SystemAdminAccess {
  const environment =
    process.env.NODE_ENV === "production"
      ? "production"
      : process.env.NODE_ENV === "test"
        ? "test"
        : "development";
  return resolveSystemAdminAccess({ environment });
}
