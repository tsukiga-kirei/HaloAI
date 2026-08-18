"use client";

import { Bot, Boxes, LayoutDashboard, ScrollText, ShieldCheck, UsersRound } from "lucide-react";
import type { Route } from "next";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { ManagementShell } from "./management-shell";
import type { AdminDictionary } from "@/lib/admin-i18n";

const navigation: ReadonlyArray<{
  href: Route;
  icon: typeof LayoutDashboard;
  labelKey: keyof AdminDictionary;
}> = [
  { href: "/admin/overview" as Route, icon: LayoutDashboard, labelKey: "navOverview" },
  { href: "/admin/members" as Route, icon: UsersRound, labelKey: "navMembers" },
  { href: "/admin/agents" as Route, icon: Bot, labelKey: "navAgents" },
  { href: "/admin/integrations" as Route, icon: Boxes, labelKey: "navIntegrations" },
  { href: "/admin/security" as Route, icon: ShieldCheck, labelKey: "navSecurity" },
  { href: "/admin/audit" as Route, icon: ScrollText, labelKey: "navAudit" },
];

/**
 * 空间管理外壳挂在布局层。分区页只替换画布，已收起侧栏不会因换页重播宽度过渡。
 */
export function AdminConsole({ children }: { children: ReactNode }) {
  const pathname = usePathname();

  return (
    <ManagementShell
      titleKey="administration"
      navLabelKey="navLabel"
      portalKey="workspace_admin"
      activeHref={pathname}
      items={navigation}
    >
      {() => children}
    </ManagementShell>
  );
}
