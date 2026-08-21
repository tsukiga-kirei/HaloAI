"use client";

import {
  WorkspaceSecuritySnapshotSchema,
  type SessionContext,
  type WorkspaceSecuritySnapshot,
} from "@haloai/contracts";
import { Database, LockKeyhole, ShieldCheck } from "lucide-react";
import { useEffect, useState } from "react";
import { notifyError } from "@/components/toast-host";
import { resolveActiveWorkspace } from "@/lib/active-workspace";
import type { AdminDictionary } from "@/lib/admin-i18n";
import { apiFetch } from "@/lib/api-client";
import { formatSessionLifetime } from "@/lib/format-relative-time";

export function LiveSecurity({ dictionary }: { dictionary: AdminDictionary }) {
  const [snapshot, setSnapshot] = useState<WorkspaceSecuritySnapshot | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function load(): Promise<void> {
      try {
        const session = await apiFetch<SessionContext>("/v1/session");
        const workspace = resolveActiveWorkspace(session);
        if (!workspace) return;
        const payload = await apiFetch<unknown>(`/v1/workspaces/${workspace.id}/security`);
        if (!cancelled) setSnapshot(WorkspaceSecuritySnapshotSchema.parse(payload));
      } catch {
        if (!cancelled) notifyError(dictionary.securityReadOnly, "workspace-security-load-error");
      }
    }
    void load();
    return () => {
      cancelled = true;
    };
  }, [dictionary.securityReadOnly]);

  const lifetime = snapshot
    ? formatSessionLifetime(snapshot.session.expiresInSeconds, {
        day: dictionary.durationDay,
        days: dictionary.durationDays,
        hour: dictionary.durationHour,
        hours: dictionary.durationHours,
      })
    : "—";
  const renewal = snapshot
    ? formatSessionLifetime(snapshot.session.updateAgeSeconds || 3_600, {
        day: dictionary.durationDay,
        days: dictionary.durationDays,
        hour: dictionary.durationHour,
        hours: dictionary.durationHours,
      })
    : "—";

  const items = [
    {
      icon: <LockKeyhole size={22} />,
      title: dictionary.securitySession,
      description: dictionary.securitySessionDetail,
      details: snapshot
        ? [
            dictionary.securitySessionLifetime.replace("{value}", lifetime),
            dictionary.securityRenewalInterval.replace("{value}", renewal),
            snapshot.session.slidingRenewal
              ? dictionary.securitySlidingOn
              : dictionary.securitySlidingOff,
          ]
        : [],
    },
    {
      icon: <ShieldCheck size={22} />,
      title: dictionary.securityApproval,
      description: dictionary.securityApprovalDetail,
      details: [dictionary.securityReadOnly],
    },
    {
      icon: <Database size={22} />,
      title: dictionary.securityRls,
      description: dictionary.securityRlsDetail,
      details: [dictionary.securityReadOnly],
    },
  ] as const;

  return (
    <>
      <div className="admin-section-heading">
        <div>
          <h1>{dictionary.securityTitle}</h1>
          <p>{dictionary.securityReadOnly}</p>
        </div>
      </div>
      <section className="admin-security-grid">
        {items.map((item) => (
          <article className="admin-security-card" key={item.title}>
            <div className="admin-security-card-top">
              <span className="admin-security-icon">{item.icon}</span>
              <span className="admin-status-badge is-success">{dictionary.enforced}</span>
            </div>
            <h2>{item.title}</h2>
            <p>{item.description}</p>
            {item.details.map((detail) => (
              <small key={detail} className="admin-security-meta">
                {detail}
              </small>
            ))}
          </article>
        ))}
      </section>
    </>
  );
}
