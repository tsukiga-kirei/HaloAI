"use client";

import { Bot, Boxes, LayoutDashboard, ScrollText, ShieldCheck, UsersRound } from "lucide-react";
import type { Route } from "next";
import { usePathname } from "next/navigation";
import { useLayoutEffect, useRef, type ReactNode } from "react";
import { animateManagementSection } from "@/lib/motion";
import { ManagementShell, type ManagementNavSection } from "./management-shell";

const navigation: ReadonlyArray<ManagementNavSection> = [
  {
    id: "space",
    titleKey: "navGroupSpace",
    items: [{ href: "/admin/overview" as Route, icon: LayoutDashboard, labelKey: "navOverview" }],
  },
  {
    id: "people",
    titleKey: "navGroupPeople",
    items: [
      { href: "/admin/members" as Route, icon: UsersRound, labelKey: "navMembers" },
      { href: "/admin/agents" as Route, icon: Bot, labelKey: "navAgents" },
    ],
  },
  {
    id: "governance",
    titleKey: "navGroupGovernance",
    items: [
      { href: "/admin/integrations" as Route, icon: Boxes, labelKey: "navIntegrations" },
      { href: "/admin/security" as Route, icon: ShieldCheck, labelKey: "navSecurity" },
      { href: "/admin/audit" as Route, icon: ScrollText, labelKey: "navAudit" },
    ],
  },
];

/**
 * 空间管理外壳挂在布局层。分区页只替换画布，已收起侧栏不会因换页重播宽度过渡。
 */
export function AdminConsole({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const contentRef = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    if (!contentRef.current) return;
    return animateManagementSection(contentRef.current);
  }, [pathname]);

  return (
    <ManagementShell
      navLabelKey="navLabel"
      portalKey="workspace_admin"
      activeHref={pathname}
      sections={navigation}
    >
      {() => (
        <div className="management-canvas" ref={contentRef}>
          {children}
        </div>
      )}
    </ManagementShell>
  );
}
