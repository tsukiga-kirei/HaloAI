"use client";

import {
  PlatformModelApiFormatSchema,
  SystemModelPageSchema,
  SystemTenantPageSchema,
  type PlatformModelApiFormat,
  type SystemModel,
  type SystemModelPage,
  type SystemTenant,
} from "@haloai/contracts";
import { Cpu, KeyRound, Link2, Plus, ShieldCheck, Type, UsersRound, Warehouse } from "lucide-react";
import { useCallback, useEffect, useState, type FormEvent } from "react";
import { notify, notifyError } from "@/components/toast-host";
import { HaloCatalog } from "@/components/ui/halo-catalog";
import { HaloChoicePills } from "@/components/ui/halo-choice-pills";
import { HaloDialog } from "@/components/ui/halo-dialog";
import { HaloSelect } from "@/components/ui/halo-select";
import { apiFetch } from "@/lib/api-client";
import { useSystemAdminDictionary } from "@/lib/use-system-admin-dictionary";
import {
  paginationLabels,
  SystemFormField,
  SystemSearchToolbar,
  SystemSectionState,
  SystemStatusBadge,
} from "./system-section-primitives";

const apiFormats = PlatformModelApiFormatSchema.options;

export function SystemModelsSection() {
  const { dictionary } = useSystemAdminDictionary();
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [query, setQuery] = useState("");
  const [result, setResult] = useState<SystemModelPage | null>(null);
  const [tenants, setTenants] = useState<SystemTenant[]>([]);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<SystemModel | null>(null);
  const [name, setName] = useState("");
  const [provider, setProvider] = useState("");
  const [apiFormat, setApiFormat] = useState<PlatformModelApiFormat>("openai_responses");
  const [remoteModelId, setRemoteModelId] = useState("");
  const [baseUrl, setBaseUrl] = useState("");
  const [contextWindow, setContextWindow] = useState("");
  const [apiKey, setApiKey] = useState("");
  const [status, setStatus] = useState<SystemModel["status"]>("active");
  const [saving, setSaving] = useState(false);

  const load = useCallback(async (): Promise<SystemModelPage | null> => {
    setLoading(true);
    setFailed(false);
    try {
      const search = new URLSearchParams({ page: String(page), pageSize: String(pageSize) });
      if (query) search.set("query", query);
      const payload = await apiFetch<unknown>(`/v1/system/models?${search.toString()}`);
      const parsed = SystemModelPageSchema.parse(payload);
      setResult(parsed);
      return parsed;
    } catch {
      setFailed(true);
      return null;
    } finally {
      setLoading(false);
    }
  }, [page, pageSize, query]);

  useEffect(() => {
    void load();
  }, [load]);

  async function loadTenantOptions(): Promise<void> {
    try {
      const payload = await apiFetch<unknown>("/v1/system/tenants?page=1&pageSize=100");
      setTenants(SystemTenantPageSchema.parse(payload).items);
    } catch {
      setTenants([]);
      notifyError(dictionary.loadError, "system-model-tenants-error");
    }
  }

  function resetDraft(model: SystemModel | null): void {
    setEditing(model);
    setName(model?.name ?? "");
    setProvider(model?.provider ?? "");
    setApiFormat(model?.apiFormat ?? "openai_responses");
    setRemoteModelId(model?.remoteModelId ?? "");
    setBaseUrl(model?.baseUrl ?? "");
    setContextWindow(model?.contextWindow ? String(model.contextWindow) : "");
    setApiKey("");
    setStatus(model?.status ?? "active");
  }

  function openModel(model: SystemModel | null): void {
    resetDraft(model);
    setDialogOpen(true);
    void loadTenantOptions();
  }

  async function saveModel(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    setSaving(true);
    try {
      const body = JSON.stringify({
        name,
        provider,
        apiFormat,
        remoteModelId,
        baseUrl,
        contextWindow: contextWindow ? Number(contextWindow) : null,
        status,
        ...(apiKey ? { apiKey } : {}),
      });
      if (editing) {
        await apiFetch<void>(`/v1/system/models/${editing.id}`, { method: "PATCH", body });
        notify(dictionary.modelSaved);
      } else {
        await apiFetch<{ id: string }>("/v1/system/models", { method: "POST", body });
        notify(dictionary.modelCreated);
      }
      setDialogOpen(false);
      await load();
    } catch {
      notifyError(dictionary.loadError, "system-model-save-error");
    } finally {
      setSaving(false);
    }
  }

  async function toggleAllocation(tenant: SystemTenant): Promise<void> {
    if (!editing) return;
    const active = editing.allocations.some(
      (allocation) => allocation.workspaceId === tenant.id && allocation.status === "active",
    );
    try {
      await apiFetch<void>(`/v1/system/models/${editing.id}/allocation`, {
        method: "PUT",
        body: JSON.stringify({ workspaceId: tenant.id, enabled: !active }),
      });
      const next = await load();
      const refreshed = next?.items.find((item) => item.id === editing.id);
      if (refreshed) setEditing(refreshed);
    } catch {
      notifyError(dictionary.loadError, "system-model-allocation-error");
    }
  }

  if (failed && !result) {
    return (
      <SystemSectionState
        kind="error"
        label={dictionary.loadError}
        retryLabel={dictionary.retry}
        onRetry={() => void load()}
      />
    );
  }

  return (
    <div className="system-section-stack">
      <SystemSearchToolbar
        value={query}
        placeholder={dictionary.searchModels}
        searchLabel={dictionary.search}
        clearLabel={dictionary.clearSearch}
        onChange={(next) => {
          setPage(1);
          setQuery(next);
        }}
        action={
          <button type="button" className="admin-primary-button" onClick={() => openModel(null)}>
            <Plus size={16} /> {dictionary.registerModel}
          </button>
        }
      />
      <HaloCatalog
        total={result?.total ?? 0}
        page={page}
        pageSize={pageSize}
        loading={loading}
        empty={<SystemSectionState kind="empty" label={dictionary.emptyModels} />}
        labels={paginationLabels(dictionary)}
        onPageChange={setPage}
        onPageSizeChange={(next) => {
          setPage(1);
          setPageSize(next);
        }}
      >
        {(result?.items ?? []).map((model) => {
          const allocated = model.allocations.filter((item) => item.status === "active").length;
          return (
            <article className="system-catalog-card" key={model.id}>
              <span className="system-list-icon is-blue">
                <Cpu size={18} />
              </span>
              <div>
                <small>
                  {model.provider} · {model.remoteModelId}
                </small>
                <h2>{model.name}</h2>
                <p>
                  {dictionary.formatLabels[model.apiFormat]}
                  {" · "}
                  {model.secretConfigured ? dictionary.secretConfigured : dictionary.secretMissing}
                  {" · "}
                  {allocated
                    ? dictionary.allocatedCount.replace("{count}", String(allocated))
                    : dictionary.noAllocation}
                </p>
              </div>
              <SystemStatusBadge tone={model.status === "active" ? "success" : "muted"}>
                {dictionary[model.status]}
              </SystemStatusBadge>
              <button
                type="button"
                className="system-table-action"
                onClick={() => openModel(model)}
              >
                {dictionary.configure}
              </button>
            </article>
          );
        })}
      </HaloCatalog>

      <HaloDialog
        open={dialogOpen}
        className="system-admin-drawer"
        title={editing ? dictionary.editModel : dictionary.registerModel}
        icon={<Cpu size={18} />}
        size="wide"
        closeLabel={dictionary.close}
        onClose={() => setDialogOpen(false)}
        footer={
          <>
            <button
              type="button"
              className="admin-secondary-button"
              onClick={() => setDialogOpen(false)}
            >
              {dictionary.cancel}
            </button>
            <button
              type="submit"
              form="system-save-model"
              className="admin-primary-button"
              disabled={saving}
            >
              {dictionary.save}
            </button>
          </>
        }
      >
        <form
          id="system-save-model"
          className="system-form"
          onSubmit={(event) => void saveModel(event)}
        >
          <SystemFormField icon={<Type size={16} />} tone="blue" label={dictionary.name}>
            <input
              value={name}
              required
              maxLength={120}
              onChange={(event) => setName(event.target.value)}
            />
          </SystemFormField>
          <SystemFormField icon={<Warehouse size={16} />} tone="blue" label={dictionary.provider}>
            <input
              value={provider}
              required
              maxLength={120}
              onChange={(event) => setProvider(event.target.value)}
            />
          </SystemFormField>
          <SystemFormField icon={<Cpu size={16} />} tone="blue" label={dictionary.apiFormat}>
            <HaloSelect
              value={apiFormat}
              ariaLabel={dictionary.apiFormat}
              onValueChange={(value) => setApiFormat(value as PlatformModelApiFormat)}
              options={apiFormats.map((format) => ({
                value: format,
                label: dictionary.formatLabels[format],
              }))}
            />
          </SystemFormField>
          <SystemFormField icon={<Type size={16} />} tone="blue" label={dictionary.remoteModelId}>
            <input
              value={remoteModelId}
              required
              maxLength={200}
              onChange={(event) => setRemoteModelId(event.target.value)}
            />
          </SystemFormField>
          <SystemFormField icon={<Link2 size={16} />} tone="blue" label={dictionary.baseUrl}>
            <input
              value={baseUrl}
              type="url"
              maxLength={2048}
              onChange={(event) => setBaseUrl(event.target.value)}
            />
          </SystemFormField>
          <SystemFormField icon={<Cpu size={16} />} tone="blue" label={dictionary.contextWindow}>
            <input
              value={contextWindow}
              inputMode="numeric"
              onChange={(event) => setContextWindow(event.target.value.replace(/\D/gu, ""))}
            />
          </SystemFormField>
          <SystemFormField icon={<KeyRound size={16} />} tone="blue" label={dictionary.apiKey}>
            <input
              value={apiKey}
              type="password"
              autoComplete="new-password"
              maxLength={4096}
              placeholder={editing ? dictionary.apiKeyPlaceholder : undefined}
              onChange={(event) => setApiKey(event.target.value)}
            />
          </SystemFormField>
          <SystemFormField icon={<ShieldCheck size={16} />} tone="blue" label={dictionary.status}>
            <HaloChoicePills
              value={status}
              ariaLabel={dictionary.status}
              onChange={(value) => setStatus(value as SystemModel["status"])}
              options={[
                { value: "active", label: dictionary.active },
                { value: "disabled", label: dictionary.disabled },
              ]}
            />
          </SystemFormField>

          {editing ? (
            <section className="system-allocation-panel">
              <h3>
                <UsersRound size={16} /> {dictionary.allocationTitle}
              </h3>
              {tenants.length === 0 ? (
                <p>{dictionary.emptyTenants}</p>
              ) : (
                <div>
                  {tenants.map((tenant) => {
                    const allocated = editing.allocations.some(
                      (item) => item.workspaceId === tenant.id && item.status === "active",
                    );
                    return (
                      <button
                        type="button"
                        className={allocated ? "is-selected" : ""}
                        key={tenant.id}
                        onClick={() => void toggleAllocation(tenant)}
                      >
                        <span>
                          <strong>{tenant.name}</strong>
                          <small>{tenant.slug}</small>
                        </span>
                        <SystemStatusBadge tone={allocated ? "success" : "muted"}>
                          {allocated ? dictionary.enabled : dictionary.noAllocation}
                        </SystemStatusBadge>
                      </button>
                    );
                  })}
                </div>
              )}
            </section>
          ) : null}
        </form>
      </HaloDialog>
    </div>
  );
}
