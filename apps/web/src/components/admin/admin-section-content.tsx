import {
  Activity,
  ArrowUpRight,
  Bot,
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

interface AdminSectionContentProps {
  dictionary: AdminDictionary;
  section: AdminSection;
  onNotify: () => void;
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
  const { dictionary } = props;
  return (
    <>
      <SectionHeading {...props} />
      <section className="admin-metrics" aria-label={dictionary.overviewTitle}>
        <HaloMetricCard
          icon={<UsersRound size={20} />}
          label={dictionary.activeMembers}
          value="8"
          detail={dictionary.availableNow}
          tone="violet"
        />
        <HaloMetricCard
          icon={<Bot size={20} />}
          label={dictionary.aiCollaborators}
          value="3"
          detail={dictionary.availableNow}
          tone="blue"
        />
        <HaloMetricCard
          icon={<Activity size={20} />}
          label={dictionary.monthlyRuns}
          value="1,284"
          detail={dictionary.comparedToLastMonth}
          tone="mint"
        />
        <HaloMetricCard
          icon={<CircleAlert size={20} />}
          label={dictionary.pendingApprovals}
          value="2"
          detail={dictionary.requiresReview}
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
            <span className="admin-score-ring">92</span>
          </div>
          <div className="admin-governance-list">
            {[
              [dictionary.identityStatus, dictionary.identityStatusDetail, "96%"],
              [dictionary.aiPolicyStatus, dictionary.aiPolicyStatusDetail, "90%"],
              [dictionary.retentionStatus, dictionary.retentionStatusDetail, "88%"],
            ].map(([label, detail, score]) => (
              <div className="admin-governance-item" key={label}>
                <span className="admin-governance-check">
                  <Check size={15} />
                </span>
                <span>
                  <strong>{label}</strong>
                  <small>{detail}</small>
                </span>
                <span>{score}</span>
              </div>
            ))}
          </div>
        </section>

        <section className="admin-panel">
          <div className="admin-panel-heading">
            <h2>{dictionary.recentActivity}</h2>
          </div>
          <div className="admin-activity-list">
            {[
              ["LL", dictionary.activityMember, dictionary.timeMinutes, "coral"],
              ["N", dictionary.activityAgent, dictionary.timeHours, "violet"],
              ["S", dictionary.activityPolicy, dictionary.timeHours, "blue"],
            ].map(([initials, label, time, tone]) => (
              <div className="admin-activity-item" key={label}>
                <span className={`admin-activity-avatar is-${tone}`}>{initials}</span>
                <span>
                  <strong>{label}</strong>
                  <small>{time}</small>
                </span>
              </div>
            ))}
          </div>
        </section>
      </div>
    </>
  );
}

function Members({ props }: { props: AdminSectionContentProps }) {
  if (process.env.NEXT_PUBLIC_AUTH_MODE !== "demo") {
    return <LiveMembers dictionary={props.dictionary} />;
  }
  const { dictionary } = props;
  const rows: ReadonlyArray<readonly [string, string, string, string, string]> = [
    [
      dictionary.memberMina,
      dictionary.typePerson,
      dictionary.roleWorkspaceOwner,
      dictionary.statusActive,
      "10:42",
    ],
    [
      dictionary.memberAndy,
      dictionary.typePerson,
      dictionary.roleProductLead,
      dictionary.statusActive,
      "09:18",
    ],
    [
      dictionary.memberNoah,
      dictionary.typePerson,
      dictionary.roleGuestReviewer,
      dictionary.statusInvited,
      "—",
    ],
  ];
  return (
    <>
      <SectionHeading {...props} action="invite" />
      <section className="admin-panel admin-table-panel">
        <div className="admin-table" role="table" aria-label={dictionary.membersTitle}>
          <div className="admin-table-row is-header" role="row">
            {[
              dictionary.tableName,
              dictionary.tableType,
              dictionary.tableRole,
              dictionary.tableStatus,
              dictionary.tableLastActive,
            ].map((label) => (
              <span role="columnheader" key={label}>
                {label}
              </span>
            ))}
          </div>
          {rows.map(([name, type, role, status, active]) => (
            <div className="admin-table-row" role="row" key={name}>
              <span role="cell" className="admin-table-person">
                <span>{name.slice(0, 2).toLocaleUpperCase()}</span>
                <strong>{name}</strong>
              </span>
              <span role="cell" data-label={dictionary.tableType}>
                {type}
              </span>
              <span role="cell" data-label={dictionary.tableRole}>
                {role}
              </span>
              <span role="cell" data-label={dictionary.tableStatus}>
                <StatusBadge tone={status === dictionary.statusActive ? "success" : "warning"}>
                  {status}
                </StatusBadge>
              </span>
              <span role="cell" data-label={dictionary.tableLastActive}>
                {active}
              </span>
            </div>
          ))}
        </div>
      </section>
    </>
  );
}

function Agents({ props }: { props: AdminSectionContentProps }) {
  const { dictionary } = props;
  const agents: ReadonlyArray<readonly [string, string, string, string, string]> = [
    [dictionary.agentNova, dictionary.agentResearch, "4", "3", dictionary.modelConversationDefault],
    [dictionary.agentMuse, dictionary.agentWriting, "3", "2", dictionary.modelConversationDefault],
    [dictionary.agentHalo, dictionary.agentFacilitator, "5", "1", dictionary.modelLocalName],
  ];
  return (
    <>
      <SectionHeading {...props} action="agent" />
      <section className="admin-card-grid">
        {agents.map(([name, description, version, tools, model], index) => (
          <article className="admin-agent-card" key={name}>
            <div className={`admin-agent-orbit is-${index + 1}`}>
              <span>{name.slice(0, 1)}</span>
            </div>
            <div className="admin-agent-copy">
              <h2>{name}</h2>
              <p>{description}</p>
            </div>
            <StatusBadge>{dictionary.publishedVersion.replace("{version}", version)}</StatusBadge>
            <div className="admin-agent-meta">
              <span>{dictionary.agentAssignedModel}</span>
              <strong>{model}</strong>
            </div>
            <div className="admin-agent-meta">
              <span>{dictionary.toolScope}</span>
              <strong>{tools}</strong>
            </div>
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

function Integrations({ props }: { props: AdminSectionContentProps }) {
  const { dictionary } = props;
  const allocated = [
    {
      name: dictionary.modelConversationDefault,
      agents: [dictionary.agentNova, dictionary.agentMuse].join(dictionary.listSeparator),
    },
  ] as const;
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
      <section className="admin-panel admin-table-panel">
        <table className="data-table">
          <thead>
            <tr>
              <th>{dictionary.tableName}</th>
              <th>{dictionary.tableStatus}</th>
              <th>{dictionary.agentAssignedModel}</th>
              <th>{dictionary.tableActions}</th>
            </tr>
          </thead>
          <tbody>
            {allocated.map((row) => (
              <tr key={row.name}>
                <td>{row.name}</td>
                <td>{dictionary.workspaceModelAllocated}</td>
                <td>{row.agents}</td>
                <td>
                  <button type="button" className="admin-secondary-button" onClick={props.onNotify}>
                    {dictionary.assignToAgent}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
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
  const rows = [
    [dictionary.auditEventMember, dictionary.memberMina, "workspace", "2026-08-12 10:42"],
    [dictionary.auditEventAgent, dictionary.agentNova, "agent:nova", "2026-08-12 09:18"],
    [dictionary.auditEventPolicy, dictionary.auditSystem, "workspace", "2026-08-12 08:00"],
  ];
  return (
    <>
      <SectionHeading {...props} action="export" />
      <section className="admin-panel admin-table-panel">
        <div className="admin-table is-audit" role="table" aria-label={dictionary.auditTitle}>
          <div className="admin-table-row is-header" role="row">
            {[
              dictionary.auditEvent,
              dictionary.auditActor,
              dictionary.auditScope,
              dictionary.auditTime,
            ].map((label) => (
              <span role="columnheader" key={label}>
                {label}
              </span>
            ))}
          </div>
          {rows.map(([event, actor, scope, time]) => (
            <div className="admin-table-row" role="row" key={event}>
              <span role="cell">
                <code>{event}</code>
              </span>
              <span role="cell" data-label={dictionary.auditActor}>
                {actor}
              </span>
              <span role="cell" data-label={dictionary.auditScope}>
                {scope}
              </span>
              <span role="cell" data-label={dictionary.auditTime}>
                {time}
              </span>
            </div>
          ))}
        </div>
      </section>
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
