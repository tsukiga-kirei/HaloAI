"use client";

import type { SessionContext, WorkspaceAuditEvent } from "@haloai/contracts";
import {
  WorkspaceAuditPageSchema,
  WorkspaceCollaborationSnapshotSchema,
  WorkspaceOrganizationOverviewSchema,
} from "@haloai/contracts";
import { useEffect, useMemo, useState } from "react";
import { AdminSectionContent, type AdminLiveStats } from "./admin-section-content";
import { adminDictionaries } from "@/lib/admin-i18n";
import { resolveActiveWorkspace } from "@/lib/active-workspace";
import { apiFetch } from "@/lib/api-client";
import type { AdminSection } from "@/lib/admin-sections";
import { useShellPreferences } from "@/lib/shell-preferences";

export function AdminSectionPage({ section }: { section: AdminSection }) {
  const { locale } = useShellPreferences();
  const dictionary = useMemo(() => adminDictionaries[locale], [locale]);
  const [live, setLive] = useState<AdminLiveStats | undefined>(undefined);

  useEffect(() => {
    let cancelled = false;

    async function load(): Promise<void> {
      try {
        const nextSession = await apiFetch<SessionContext>("/v1/session");
        if (cancelled) return;
        const workspace = resolveActiveWorkspace(nextSession);
        if (!workspace) {
          setLive({ memberCount: 0, departmentCount: 0, agents: [], recentAudit: [] });
          return;
        }

        const [membersResult, snapshotResult, auditResult] = await Promise.allSettled([
          apiFetch<unknown>(`/v1/workspaces/${workspace.id}/organization`),
          apiFetch<unknown>(`/v1/workspaces/${workspace.id}/collaboration`),
          apiFetch<unknown>(`/v1/workspaces/${workspace.id}/audit?page=1&pageSize=5`),
        ]);
        if (cancelled) return;

        const organization =
          membersResult.status === "fulfilled"
            ? WorkspaceOrganizationOverviewSchema.parse(membersResult.value)
            : null;
        const agents =
          snapshotResult.status === "fulfilled"
            ? WorkspaceCollaborationSnapshotSchema.parse(snapshotResult.value).participants.filter(
                (actor) => actor.kind === "agent",
              )
            : [];
        const recentAudit: WorkspaceAuditEvent[] =
          auditResult.status === "fulfilled"
            ? WorkspaceAuditPageSchema.parse(auditResult.value).items
            : [];
        setLive({
          memberCount:
            organization?.members.filter((member) => member.status === "active").length ?? 0,
          departmentCount: organization?.departments.length ?? 0,
          agents,
          recentAudit,
        });
      } catch {
        if (!cancelled) {
          setLive({ memberCount: 0, departmentCount: 0, agents: [], recentAudit: [] });
        }
      }
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <AdminSectionContent dictionary={dictionary} section={section} locale={locale} live={live} />
  );
}
