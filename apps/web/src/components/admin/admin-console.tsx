"use client";

import { Bot, Boxes, LayoutDashboard, ScrollText, ShieldCheck, UsersRound } from "lucide-react";
import type { SessionContext } from "@haloai/contracts";
import type { Route } from "next";
import { useEffect, useState } from "react";
import { ManagementShell } from "./management-shell";
import { AdminSectionContent } from "./admin-section-content";
import { type AdminSection } from "@/lib/admin-sections";
import { apiFetch } from "@/lib/api-client";
import { notify } from "@/components/toast-host";
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

export function AdminConsole({ section }: { section: AdminSection }) {
  const [session, setSession] = useState<SessionContext | null>(null);
  const realMode = process.env.NEXT_PUBLIC_AUTH_MODE !== "demo";
  const activeWorkspace =
    session?.workspaces.find(
      (workspace) => workspace.id === window.localStorage.getItem("haloai.workspaceId"),
    ) ?? session?.workspaces[0];

  useEffect(() => {
    if (!realMode) return;
    apiFetch<SessionContext>("/v1/session")
      .then(setSession)
      .catch(() => setSession(null));
  }, [realMode]);

  return (
    <ManagementShell
      titleKey="administration"
      navLabelKey="navLabel"
      activeHref={`/admin/${section}`}
      workspaceName={activeWorkspace?.name ?? "HaloAI Pilot"}
      items={navigation}
    >
      {(dictionary) => (
        <AdminSectionContent
          dictionary={dictionary}
          section={section}
          onNotify={() => notify(dictionary.localOnlyNotice)}
        />
      )}
    </ManagementShell>
  );
}
