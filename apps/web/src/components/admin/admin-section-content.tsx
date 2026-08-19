import {
  Activity,
  ArrowUpRight,
  Bot,
  Building2,
  Check,
  CircleAlert,
  Database,
  KeyRound,
  LockKeyhole,
  Plus,
  ShieldCheck,
  UserPlus,
  UsersRound,
} from "lucide-react";
import type { ReactNode } from "react";
import type { AdminDictionary } from "@/lib/admin-i18n";
import type { AdminSection } from "@/lib/admin-sections";
import { HaloMetricCard } from "@/components/ui/halo-metric-card";
import { LiveMembers } from "./live-members";
import type { CollaborationActor } from "@haloai/contracts";

export interface AdminLiveStats {
  memberCount: number;
  departmentCount: number;
  agents: readonly CollaborationActor[];
}

interface AdminSectionContentProps {
  dictionary: AdminDictionary;
  section: AdminSection;
  onNotify: () => void;
  live?: AdminLiveStats | undefined;
}

const sectionTitleKeys: Record<AdminSection, keyof AdminDictionary> = {
  overview: "overviewTitle",
  members: "membersTitle",
  agents: "agentsTitle",
  integrations: "integrationsTitle",
  security: "securityTitle",
  audit: "auditTitle",
};

function SectionHeading({
  dictionary,
  section,
  action,
  onNotify,
  description,
}: AdminSectionContentProps & { action?: "invite" | "agent" | "export"; description?: string }) {
  const actionLabel =
    action === "invite"
      ? dictionary.inviteMember
      : action === "agent"
        ? dictionary.createAgent
        : action === "export"
          ? dictionary.exportAudit
          : undefined;

  return (
    <div className="admin-section-heading">
      <div>
        <h1>{dictionary[sectionTitleKeys[section]]}</h1>
        {description ? <p>{description}</p> : null}
      </div>
      {actionLabel === undefined ? null : (
        <button type="button" className="admin-primary-button" onClick={onNotify}>
          {action === "invite" ? (
            <UserPlus size={17} />
          ) : action === "agent" ? (
            <Plus size={17} />
          ) : (
            <ArrowUpRight size={17} />
          )}
          {actionLabel}
        </button>
      )}
    </div>
  );
}

function StatusBadge({
  children,
  tone = "success",
}: {
  children: ReactNode;
  tone?: "success" | "warning" | "muted";
}) {
  return <span className={`admin-status-badge is-${tone}`}>{children}</span>;
}

function Overview({ props }: { props: AdminSectionContentProps }) {
  const { dictionary, live } = props;
  const memberCount = live?.memberCount ?? 0;
  const agentCount = live?.agents.length ?? 0;
  return (
    <>
      <SectionHeading {...props} />
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
            <div>
              <h2>{dictionary.governanceHealth}</h2>
              <p>{dictionary.governanceDescription}</p>
            </div>
          </div>
          <div className="admin-governance-list">
            {[
              [dictionary.identityStatus, dictionary.identityStatusDetail],
              [dictionary.aiPolicyStatus, dictionary.aiPolicyStatusDetail],
              [dictionary.retentionStatus, dictionary.retentionStatusDetail],
            ].map(([label, detail]) => (
              <div className="admin-governance-item" key={label}>
                <span className="admin-governance-check">
                  <Check size={15} />
                </span>
                <span>
                  <strong>{label}</strong>
                  <small>{detail}</small>
                </span>
              </div>
            ))}
          </div>
        </section>

        <section className="admin-panel">
          <div className="admin-panel-heading">
            <h2>{dictionary.recentActivity}</h2>
          </div>
          <p className="document-empty-copy">{dictionary.emptyAdminActivity}</p>
        </section>
      </div>
    </>
  );
}

function Members({ props }: { props: AdminSectionContentProps }) {
  return <LiveMembers />;
}

function Agents({ props }: { props: AdminSectionContentProps }) {
  const { dictionary, live, onNotify } = props;
  const agents = live?.agents ?? [];
  return (
    <>
      <SectionHeading {...props} action="agent" />
      {agents.length === 0 ? (
        <p className="document-empty-copy">{dictionary.emptyAgentDirectory}</p>
      ) : (
        <section className="admin-card-grid">
          {agents.map((agent, index) => (
            <article className="admin-agent-card" key={agent.id}>
              <div className={`admin-agent-orbit is-${(index % 3) + 1}`}>
                <span>{agent.displayName.slice(0, 1)}</span>
              </div>
              <div className="admin-agent-copy">
                <h2>{agent.displayName}</h2>
                <p>@{agent.handle}</p>
              </div>
              <StatusBadge>
                {agent.status === "active" ? dictionary.statusActive : agent.status}
              </StatusBadge>
              <div className="admin-agent-meta">
                <span>{dictionary.agentAssignedModel}</span>
                <strong>{dictionary.notAssigned}</strong>
              </div>
              <button type="button" className="admin-secondary-button" onClick={onNotify}>
                {dictionary.configure}
                <ArrowUpRight size={15} />
              </button>
            </article>
          ))}
        </section>
      )}
    </>
  );
}

function Integrations({ props }: { props: AdminSectionContentProps }) {
  const { dictionary } = props;
  const extras = [
    {
      icon: <Database size={21} />,
      title: dictionary.integrationStorage,
      description: dictionary.integrationStorageDetail,
    },
    {
      icon: <KeyRound size={21} />,
      title: dictionary.integrationMcp,
      description: dictionary.integrationMcpDetail,
    },
  ] as const;
  return (
    <>
      <SectionHeading {...props} description={dictionary.workspaceModelsIntro} />
      <p className="document-empty-copy">{dictionary.emptyModelCatalog}</p>
      <div className="admin-section-stack">
        <h2 className="admin-subheading">{dictionary.workspaceIntegrationsTitle}</h2>
        <section className="admin-stack-list">
          {extras.map((item) => (
            <article className="admin-integration-row" key={item.title}>
              <span className="admin-integration-icon">{item.icon}</span>
              <span>
                <h2>{item.title}</h2>
                <p>{item.description}</p>
              </span>
              <StatusBadge tone="muted">{dictionary.notConnected}</StatusBadge>
            </article>
          ))}
        </section>
      </div>
    </>
  );
}

function Security({ props }: { props: AdminSectionContentProps }) {
  const { dictionary } = props;
  const items = [
    {
      icon: <LockKeyhole size={22} />,
      title: dictionary.securitySession,
      description: dictionary.securitySessionDetail,
    },
    {
      icon: <ShieldCheck size={22} />,
      title: dictionary.securityApproval,
      description: dictionary.securityApprovalDetail,
    },
    {
      icon: <Database size={22} />,
      title: dictionary.securityRls,
      description: dictionary.securityRlsDetail,
    },
  ] as const;
  return (
    <>
      <SectionHeading {...props} />
      <section className="admin-security-grid">
        {items.map((item) => (
          <article className="admin-security-card" key={item.title}>
            <span className="admin-security-icon">{item.icon}</span>
            <StatusBadge>{dictionary.enforced}</StatusBadge>
            <h2>{item.title}</h2>
            <p>{item.description}</p>
            <button type="button" className="admin-secondary-button" onClick={props.onNotify}>
              {dictionary.configure}
              <ArrowUpRight size={15} />
            </button>
          </article>
        ))}
      </section>
    </>
  );
}

function Audit({ props }: { props: AdminSectionContentProps }) {
  const { dictionary } = props;
  return (
    <>
      <SectionHeading {...props} action="export" />
      <p className="document-empty-copy">{dictionary.emptyAuditLog}</p>
    </>
  );
}

export function AdminSectionContent(props: AdminSectionContentProps) {
  if (props.section === "overview") return <Overview props={props} />;
  if (props.section === "members") return <Members props={props} />;
  if (props.section === "agents") return <Agents props={props} />;
  if (props.section === "integrations") return <Integrations props={props} />;
  if (props.section === "security") return <Security props={props} />;
  return <Audit props={props} />;
}
