import type { ReactNode } from "react";
import { RestrictedSurface } from "@/components/admin/restricted-surface";
import { SystemConsole } from "@/components/admin/system-console";
import { getSystemAdminAccess } from "@/server/system-admin-access";
import "../admin/admin-shell.css";
import "../admin/admin-content.css";
import "./system-admin.css";

export default async function SystemLayout({ children }: Readonly<{ children: ReactNode }>) {
  const access = await getSystemAdminAccess();
  if (!access.allowed) return <RestrictedSurface kind="system" />;
  return <SystemConsole>{children}</SystemConsole>;
}
