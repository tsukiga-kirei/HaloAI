import type { Route } from "next";

/**
 * 登录入口与账户菜单共用同一组门户。协作、空间管理、系统管理必须显式切换，
 * 不能把 Workspace Owner 自动提升为平台管理员。
 */
export const portalKeys = ["member", "workspace_admin", "system_admin"] as const;
export type PortalKey = (typeof portalKeys)[number];

export const PORTAL_STORAGE_KEY = "haloai.portal";
export const LOGIN_ROLE_STORAGE_KEY = "haloai.loginRole";
export const WORKSPACE_STORAGE_KEY = "haloai.workspaceId";

export function persistWorkspaceId(workspaceId: string): void {
  window.localStorage.setItem(WORKSPACE_STORAGE_KEY, workspaceId);
  document.cookie = `${WORKSPACE_STORAGE_KEY}=${encodeURIComponent(workspaceId)}; Path=/; Max-Age=31536000; SameSite=Lax`;
}

export function readStoredWorkspaceId(): string | null {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem(WORKSPACE_STORAGE_KEY);
}

export function isPortalKey(value: string | null): value is PortalKey {
  return portalKeys.some((key) => key === value);
}

export function portalPath(key: PortalKey): Route {
  if (key === "workspace_admin") return "/admin/overview" as Route;
  if (key === "system_admin") return "/system";
  return "/app";
}

export function readStoredPortal(): PortalKey {
  if (typeof window === "undefined") return "member";
  const saved = window.localStorage.getItem(PORTAL_STORAGE_KEY);
  return isPortalKey(saved) ? saved : "member";
}

export function persistPortal(key: PortalKey): void {
  window.localStorage.setItem(PORTAL_STORAGE_KEY, key);
}

/** 演示与真实登出都要清掉门户偏好，避免下次自动进管理页。 */
export function clearClientPortalSession(): void {
  persistPortal("member");
  window.localStorage.removeItem(LOGIN_ROLE_STORAGE_KEY);
  window.localStorage.removeItem(WORKSPACE_STORAGE_KEY);
  document.cookie = `${WORKSPACE_STORAGE_KEY}=; Path=/; Max-Age=0; SameSite=Lax`;
}
