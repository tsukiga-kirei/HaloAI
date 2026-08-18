"use client";

import type { SessionContext, WorkspaceMember } from "@haloai/contracts";
import { WorkspaceCollaborationSnapshotSchema } from "@haloai/contracts";
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
          setLive({ memberCount: 0, agents: [] });
          return;
        }

        const [membersResult, snapshotResult] = await Promise.allSettled([
          apiFetch<{ members: WorkspaceMember[] }>(`/v1/workspaces/${workspace.id}/members`),
          apiFetch<unknown>(`/v1/workspaces/${workspace.id}/collaboration`),
        ]);
        if (cancelled) return;

        const members = membersResult.status === "fulfilled" ? membersResult.value.members : [];
        const agents =
          snapshotResult.status === "fulfilled"
            ? WorkspaceCollaborationSnapshotSchema.parse(snapshotResult.value).participants.filter(
                (actor) => actor.kind === "agent",
              )
            : [];
        setLive({ memberCount: members.length, agents });
      } catch {
        if (!cancelled) setLive({ memberCount: 0, agents: [] });
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
