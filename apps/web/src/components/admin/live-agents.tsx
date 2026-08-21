"use client";

import type { CollaborationActor } from "@haloai/contracts";
import { Bot } from "lucide-react";
import { useState } from "react";
import { notify } from "@/components/toast-host";
import { AdminPageHeader } from "./admin-page-header";
import { HaloDialog } from "@/components/ui/halo-dialog";
import { HaloEmptyState } from "@/components/ui/halo-empty-state";
import type { AdminDictionary } from "@/lib/admin-i18n";

export function LiveAgents({
  dictionary,
  agents,
}: {
  dictionary: AdminDictionary;
  agents: readonly CollaborationActor[];
}) {
  const [selected, setSelected] = useState<CollaborationActor | null>(null);

  return (
    <>
      <AdminPageHeader
        kicker={dictionary.navGroupPeople}
        title={dictionary.agentsTitle}
        description={dictionary.agentReadOnly}
        actions={
          <button
            type="button"
            className="admin-primary-button"
            onClick={() => notify(dictionary.createAgentPending)}
          >
            <Bot size={17} />
            {dictionary.createAgent}
          </button>
        }
      />
      {agents.length === 0 ? (
        <HaloEmptyState icon={<Bot size={22} />} title={dictionary.emptyAgentDirectory} />
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
              <span
                className={`admin-status-badge ${agent.status === "active" ? "is-success" : "is-muted"}`}
              >
                {agent.status === "active" ? dictionary.statusActive : agent.status}
              </span>
              <div className="admin-agent-meta">
                <span>{dictionary.agentAssignedModel}</span>
                <strong>{dictionary.notAssigned}</strong>
              </div>
              <button
                type="button"
                className="admin-secondary-button"
                onClick={() => setSelected(agent)}
              >
                {dictionary.configure}
              </button>
            </article>
          ))}
        </section>
      )}
      <HaloDialog
        open={selected !== null}
        title={selected?.displayName ?? dictionary.agentsTitle}
        onClose={() => setSelected(null)}
      >
        {selected ? (
          <dl className="admin-audit-detail">
            <div>
              <dt>{dictionary.agentHandle}</dt>
              <dd>@{selected.handle}</dd>
            </div>
            <div>
              <dt>{dictionary.tableStatus}</dt>
              <dd>{selected.status === "active" ? dictionary.statusActive : selected.status}</dd>
            </div>
            <div>
              <dt>{dictionary.agentAssignedModel}</dt>
              <dd>{dictionary.notAssigned}</dd>
            </div>
            <p className="document-empty-copy">{dictionary.agentReadOnly}</p>
          </dl>
        ) : null}
      </HaloDialog>
    </>
  );
}
