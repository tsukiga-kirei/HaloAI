"use client";

import {
  WorkspaceAllocatedModelListSchema,
  type SessionContext,
  type WorkspaceAllocatedModel,
} from "@haloai/contracts";
import { Boxes, Database, KeyRound } from "lucide-react";
import { useEffect, useState } from "react";
import { notifyError } from "@/components/toast-host";
import { AdminPageHeader } from "./admin-page-header";
import { HaloEmptyState } from "@/components/ui/halo-empty-state";
import { resolveActiveWorkspace } from "@/lib/active-workspace";
import type { AdminDictionary } from "@/lib/admin-i18n";
import { apiFetch } from "@/lib/api-client";

const protocolLabels: Record<WorkspaceAllocatedModel["apiFormat"], string> = {
  openai_chat_completions: "OpenAI Chat Completions",
  openai_responses: "OpenAI Responses",
  anthropic_messages: "Anthropic Messages",
  google_generate_content: "Google Generate Content",
};

export function LiveModels({ dictionary }: { dictionary: AdminDictionary }) {
  const [models, setModels] = useState<WorkspaceAllocatedModel[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    async function load(): Promise<void> {
      try {
        const session = await apiFetch<SessionContext>("/v1/session");
        const workspace = resolveActiveWorkspace(session);
        if (!workspace) {
          if (!cancelled) setModels([]);
          return;
        }
        const payload = await apiFetch<unknown>(`/v1/workspaces/${workspace.id}/models`);
        if (!cancelled) setModels(WorkspaceAllocatedModelListSchema.parse(payload).items);
      } catch {
        if (!cancelled) {
          notifyError(dictionary.emptyModelCatalog, "workspace-models-load-error");
          setModels([]);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    void load();
    return () => {
      cancelled = true;
    };
  }, [dictionary.emptyModelCatalog]);

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
      <AdminPageHeader
        kicker={dictionary.navGroupGovernance}
        title={dictionary.integrationsTitle}
        description={dictionary.workspaceModelsIntro}
      />
      {loading ? (
        <p className="halo-loading-copy">{dictionary.modelsLoading}</p>
      ) : models.length === 0 ? (
        <HaloEmptyState
          icon={<Boxes size={22} />}
          title={dictionary.emptyModelCatalog}
          description={dictionary.modelUnallocatedDescription}
        />
      ) : (
        <section className="admin-card-grid">
          {models.map((model) => (
            <article className="admin-model-card" key={model.id}>
              <span
                className={`admin-status-badge ${model.status === "active" ? "is-success" : "is-muted"}`}
              >
                {model.status === "active" ? dictionary.statusActive : dictionary.statusPaused}
              </span>
              <h2>{model.name}</h2>
              <p>
                {model.provider} · {model.remoteModelId}
              </p>
              <div className="admin-agent-meta">
                <span>{dictionary.modelProtocol}</span>
                <strong>{protocolLabels[model.apiFormat]}</strong>
              </div>
              <div className="admin-agent-meta">
                <span>{dictionary.modelSecret}</span>
                <strong>
                  {model.secretConfigured
                    ? dictionary.modelSecretStored
                    : dictionary.modelSecretMissing}
                </strong>
              </div>
              {model.contextWindow ? (
                <div className="admin-agent-meta">
                  <span>
                    {dictionary.modelContextWindow.replace("{value}", String(model.contextWindow))}
                  </span>
                </div>
              ) : null}
            </article>
          ))}
        </section>
      )}
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
              <span className="admin-status-badge is-muted">{dictionary.notConnected}</span>
            </article>
          ))}
        </section>
      </div>
    </>
  );
}
