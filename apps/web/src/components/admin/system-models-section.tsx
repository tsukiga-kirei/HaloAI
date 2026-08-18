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
import type { LegacyColumnDef as ColumnDef } from "@tanstack/react-table/legacy";
import { Cpu, Edit3, KeyRound, Plus, UsersRound } from "lucide-react";
import { useCallback, useEffect, useMemo, useState, type FormEvent } from "react";
import { notify, notifyError } from "@/components/toast-host";
import { HaloDataTable } from "@/components/ui/halo-data-table";
import { HaloDialog } from "@/components/ui/halo-dialog";
import { HaloSelect } from "@/components/ui/halo-select";
import { apiFetch } from "@/lib/api-client";
import type { SystemAdminDictionary } from "@/lib/system-admin-i18n";
import {
  paginationLabels,
  SystemSearchToolbar,
  SystemSectionState,
  SystemStatusBadge,
} from "./system-section-primitives";

const apiFormats = PlatformModelApiFormatSchema.options;

export function SystemModelsSection({ dictionary }: { dictionary: SystemAdminDictionary }) {
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

  const columns = useMemo<ColumnDef<SystemModel>[]>(
    () => [
      {
        header: dictionary.name,
        cell: ({ row }) => (
          <span className="system-table-identity">
            <span className="system-list-icon is-blue">
              <Cpu size={15} />
            </span>
            <span>
              <strong>{row.original.name}</strong>
              <small>{row.original.remoteModelId}</small>
            </span>
          </span>
        ),
      },
      { header: dictionary.provider, accessorKey: "provider" },
      {
        header: dictionary.apiFormat,
        cell: ({ row }) => dictionary.formatLabels[row.original.apiFormat],
      },
      {
        header: dictionary.apiKey,
        cell: ({ row }) => (
          <SystemStatusBadge tone={row.original.secretConfigured ? "success" : "muted"}>
            <KeyRound size={12} />
            {row.original.secretConfigured ? dictionary.secretConfigured : dictionary.secretMissing}
          </SystemStatusBadge>
        ),
      },
      {
        header: dictionary.allocatedTenants,
        cell: ({ row }) =>
          row.original.allocations.filter((item) => item.status === "active").length ||
          dictionary.noAllocation,
      },
      {
        header: dictionary.status,
        cell: ({ row }) => (
          <SystemStatusBadge tone={row.original.status === "active" ? "success" : "muted"}>
            {dictionary[row.original.status]}
          </SystemStatusBadge>
        ),
      },
      {
        id: "actions",
        header: dictionary.actions,
        cell: ({ row }) => (
          <button
            type="button"
            className="system-table-action"
            onClick={() => openModel(row.original)}
          >
            <Edit3 size={14} /> {dictionary.configure}
          </button>
        ),
      },
    ],
    [dictionary],
  );

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
        onChange={(next) => {
          setPage(1);
          setQuery(next.trim());
        }}
        action={
          <button type="button" className="admin-primary-button" onClick={() => openModel(null)}>
            <Plus size={16} /> {dictionary.registerModel}
          </button>
        }
      />
      <HaloDataTable
        columns={columns}
        data={result?.items ?? []}
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
      />

      <HaloDialog
        open={dialogOpen}
        className="system-admin-drawer"
        title={editing ? dictionary.editModel : dictionary.registerModel}
        icon={<Cpu size={18} />}
        closeLabel={dictionary.close}
        onClose={() => setDialogOpen(false)}
      >
        <form className="system-form" onSubmit={(event) => void saveModel(event)}>
          <div className="system-form-grid">
            <label>
              <span>{dictionary.name}</span>
              <input
                value={name}
                required
                maxLength={120}
                onChange={(e) => setName(e.target.value)}
              />
            </label>
            <label>
              <span>{dictionary.provider}</span>
              <input
                value={provider}
                required
                maxLength={120}
                onChange={(e) => setProvider(e.target.value)}
              />
            </label>
            <label className="is-wide">
              <span>{dictionary.apiFormat}</span>
              <HaloSelect
                value={apiFormat}
                ariaLabel={dictionary.apiFormat}
                onValueChange={(value) => setApiFormat(value as PlatformModelApiFormat)}
                options={apiFormats.map((format) => ({
                  value: format,
                  label: dictionary.formatLabels[format],
                }))}
              />
            </label>
            <label>
              <span>{dictionary.remoteModelId}</span>
              <input
                value={remoteModelId}
                required
                maxLength={200}
                onChange={(e) => setRemoteModelId(e.target.value)}
              />
            </label>
            <label>
              <span>{dictionary.contextWindow}</span>
              <input
                value={contextWindow}
                inputMode="numeric"
                onChange={(e) => setContextWindow(e.target.value.replace(/\D/gu, ""))}
              />
            </label>
            <label className="is-wide">
              <span>{dictionary.baseUrl}</span>
              <input
                value={baseUrl}
                type="url"
                maxLength={2048}
                onChange={(e) => setBaseUrl(e.target.value)}
              />
            </label>
            <label className="is-wide">
              <span>{dictionary.apiKey}</span>
              <input
                value={apiKey}
                type="password"
                autoComplete="new-password"
                maxLength={4096}
                placeholder={editing ? dictionary.apiKeyPlaceholder : undefined}
                onChange={(e) => setApiKey(e.target.value)}
              />
            </label>
            <label className="is-wide">
              <span>{dictionary.status}</span>
              <HaloSelect
                value={status}
                ariaLabel={dictionary.status}
                onValueChange={(value) => setStatus(value as SystemModel["status"])}
                options={[
                  { value: "active", label: dictionary.active },
                  { value: "disabled", label: dictionary.disabled },
                ]}
              />
            </label>
          </div>

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

          <footer className="system-form-actions">
            <button
              type="button"
              className="admin-secondary-button"
              onClick={() => setDialogOpen(false)}
            >
              {dictionary.cancel}
            </button>
            <button type="submit" className="admin-primary-button" disabled={saving}>
              {dictionary.save}
            </button>
          </footer>
        </form>
      </HaloDialog>
    </div>
  );
}
