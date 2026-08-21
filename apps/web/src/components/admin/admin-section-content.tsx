import { Activity, Bot, Building2, Check, CircleAlert, UsersRound } from "lucide-react";
import type { CollaborationActor, WorkspaceAuditEvent } from "@haloai/contracts";
import { HaloEmptyState } from "@/components/ui/halo-empty-state";
import { HaloMetricCard } from "@/components/ui/halo-metric-card";
import type { AdminDictionary } from "@/lib/admin-i18n";
import type { AdminSection } from "@/lib/admin-sections";
import { formatRelativeTime } from "@/lib/format-relative-time";
import { labelAuditAction } from "@/lib/audit-action-i18n";
import type { Locale } from "@/lib/i18n";
import { AdminPageHeader } from "./admin-page-header";
import { LiveAgents } from "./live-agents";
import { LiveAudit } from "./live-audit";
import { LiveMembers } from "./live-members";
import { LiveModels } from "./live-models";
import { LiveRoles } from "./live-roles";
import { LiveSecurity } from "./live-security";

export interface AdminLiveStats {
  memberCount: number;
  departmentCount: number;
  agents: readonly CollaborationActor[];
  recentAudit: readonly WorkspaceAuditEvent[];
}

interface AdminSectionContentProps {
  dictionary: AdminDictionary;
  section: AdminSection;
  locale: Locale;
  live?: AdminLiveStats | undefined;
}

function Overview({ props }: { props: AdminSectionContentProps }) {
  const { dictionary, live, locale } = props;
  const memberCount = live?.memberCount ?? 0;
  const agentCount = live?.agents.length ?? 0;
  const events = live?.recentAudit ?? [];
  return (
    <>
      <AdminPageHeader kicker={dictionary.navGroupSpace} title={dictionary.overviewTitle} />
      <section className="admin-metrics" aria-label={dictionary.overviewTitle}>
        <HaloMetricCard
          icon={<UsersRound size={20} />}
          label={dictionary.activeMembers}
          value={String(memberCount)}
          detail={dictionary.availableNow}
          tone="violet"
        />
        <HaloMetricCard
          icon={<Building2 size={20} />}
          label={dictionary.departments}
          value={String(live?.departmentCount ?? 0)}
          detail={dictionary.availableNow}
          tone="blue"
        />
        <HaloMetricCard
          icon={<Bot size={20} />}
          label={dictionary.aiCollaborators}
          value={String(agentCount)}
          detail={dictionary.availableNow}
          tone="mint"
        />
        <HaloMetricCard
          icon={<CircleAlert size={20} />}
          label={dictionary.pendingApprovals}
          value="0"
          detail={dictionary.metricUnavailable}
          tone="amber"
        />
      </section>

      <div className="admin-overview-grid">
        <section className="admin-panel admin-governance-panel">
          <div className="admin-panel-heading">
            <h2>{dictionary.governanceHealth}</h2>
          </div>
          <div className="admin-governance-list">
            {[dictionary.identityStatus, dictionary.aiPolicyStatus, dictionary.retentionStatus].map(
              (label) => (
                <div className="admin-governance-item" key={label}>
                  <span className="admin-governance-check">
                    <Check size={15} />
                  </span>
                  <strong>{label}</strong>
                </div>
              ),
            )}
          </div>
        </section>

        <section className="admin-panel">
          <div className="admin-panel-heading">
            <h2>{dictionary.recentActivity}</h2>
          </div>
          {events.length === 0 ? (
            <HaloEmptyState icon={<Activity size={20} />} title={dictionary.emptyAdminActivity} />
          ) : (
            <ul className="admin-activity-list">
              {events.map((event) => (
                <li key={event.id}>
                  <span className="admin-activity-action">
                    {labelAuditAction(event.action, locale)}
                  </span>
                  <span>{event.actorName ?? dictionary.auditSystem}</span>
                  <small>{formatRelativeTime(event.occurredAt, locale)}</small>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </>
  );
}

export function AdminSectionContent(props: AdminSectionContentProps) {
  if (props.section === "overview") return <Overview props={props} />;
  if (props.section === "members") return <LiveMembers />;
  if (props.section === "roles") return <LiveRoles dictionary={props.dictionary} />;
  if (props.section === "agents") {
    return <LiveAgents dictionary={props.dictionary} agents={props.live?.agents ?? []} />;
  }
  if (props.section === "integrations") return <LiveModels dictionary={props.dictionary} />;
  if (props.section === "security") return <LiveSecurity dictionary={props.dictionary} />;
  return <LiveAudit dictionary={props.dictionary} />;
}
