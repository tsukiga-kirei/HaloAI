import type { Route } from "next";

/**
 * 登录入口与账户菜单共用同一组门户。协作、空间管理、系统管理必须显式切换，
 * 不能把 Workspace Owner 自动提升为平台管理员。
 */
export const portalKeys = ["member", "workspace_admin", "system_admin"] as const;
export type PortalKey = (typeof portalKeys)[number];

export const PORTAL_STORAGE_KEY = "haloai.portal";

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
