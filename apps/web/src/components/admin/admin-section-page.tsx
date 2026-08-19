"use client";

import type { SessionContext } from "@haloai/contracts";
import {
  WorkspaceCollaborationSnapshotSchema,
  WorkspaceOrganizationOverviewSchema,
} from "@haloai/contracts";
import { useEffect, useMemo, useState } from "react";
import { notify } from "@/components/toast-host";
import { AdminSectionContent, type AdminLiveStats } from "./admin-section-content";
import { adminDictionaries } from "@/lib/admin-i18n";
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
        const remembered = window.localStorage.getItem("haloai.workspaceId");
        const workspace =
          nextSession.workspaces.find((item) => item.id === remembered) ??
          nextSession.workspaces[0];
        if (!workspace) {
          setLive({ memberCount: 0, departmentCount: 0, agents: [] });
          return;
        }

        const [membersResult, snapshotResult] = await Promise.allSettled([
          apiFetch<unknown>(`/v1/workspaces/${workspace.id}/organization`),
          apiFetch<unknown>(`/v1/workspaces/${workspace.id}/collaboration`),
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
        setLive({
          memberCount: organization?.members.length ?? 0,
          departmentCount: organization?.departments.length ?? 0,
          agents,
        });
      } catch {
        if (!cancelled) setLive({ memberCount: 0, departmentCount: 0, agents: [] });
      }
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <AdminSectionContent
      dictionary={dictionary}
      section={section}
      live={live}
      onNotify={() => notify(dictionary.localOnlyNotice)}
    />
  );
}
