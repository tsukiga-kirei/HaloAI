"use client";

import {
  SystemTenantPageSchema,
  type SystemTenant,
  type SystemTenantPage,
} from "@haloai/contracts";
import { Building2, Globe2, Languages, ShieldCheck } from "lucide-react";
import { useCallback, useEffect, useState, type FormEvent } from "react";
import { notify, notifyError } from "@/components/toast-host";
import { HaloCatalog } from "@/components/ui/halo-catalog";
import { HaloChoicePills } from "@/components/ui/halo-choice-pills";
import { HaloDialog } from "@/components/ui/halo-dialog";
import { apiFetch } from "@/lib/api-client";
import { useSystemAdminDictionary } from "@/lib/use-system-admin-dictionary";
import {
  formatSystemDate,
  paginationLabels,
  SystemFormField,
  SystemSearchToolbar,
  SystemSectionState,
  SystemStatusBadge,
} from "./system-section-primitives";

export function SystemTenantsSection() {
  const { dictionary, locale } = useSystemAdminDictionary();
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [query, setQuery] = useState("");
  const [result, setResult] = useState<SystemTenantPage | null>(null);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);
  const [editing, setEditing] = useState<SystemTenant | null>(null);
  const [status, setStatus] = useState<SystemTenant["status"]>("active");
  const [defaultLocale, setDefaultLocale] = useState<"zh-CN" | "en-US">("zh-CN");
  const [timeZone, setTimeZone] = useState("UTC");
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setFailed(false);
    try {
      const search = new URLSearchParams({ page: String(page), pageSize: String(pageSize) });
      if (query) search.set("query", query);
      const payload = await apiFetch<unknown>(`/v1/system/tenants?${search.toString()}`);
      setResult(SystemTenantPageSchema.parse(payload));
    } catch {
      setFailed(true);
    } finally {
      setLoading(false);
    }
  }, [page, pageSize, query]);

  useEffect(() => {
    void load();
  }, [load]);

  function openTenant(tenant: SystemTenant): void {
    setEditing(tenant);
    setStatus(tenant.status);
    setDefaultLocale(tenant.defaultLocale);
    setTimeZone(tenant.timeZone);
  }

  async function saveTenant(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    if (!editing) return;
    setSaving(true);
    try {
      await apiFetch<void>(`/v1/system/tenants/${editing.id}`, {
        method: "PATCH",
        body: JSON.stringify({ status, defaultLocale, timeZone }),
      });
      notify(dictionary.saved);
      setEditing(null);
      await load();
    } catch {
      notifyError(dictionary.loadError, "system-tenant-save-error");
    } finally {
      setSaving(false);
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
        placeholder={dictionary.searchTenants}
        searchLabel={dictionary.search}
        clearLabel={dictionary.clearSearch}
        onChange={(next) => {
          setPage(1);
          setQuery(next);
        }}
      />
      <HaloCatalog
        total={result?.total ?? 0}
        page={page}
        pageSize={pageSize}
        loading={loading}
        empty={<SystemSectionState kind="empty" label={dictionary.emptyTenants} />}
        labels={paginationLabels(dictionary)}
        onPageChange={setPage}
        onPageSizeChange={(next) => {
          setPage(1);
          setPageSize(next);
        }}
      >
        {(result?.items ?? []).map((tenant) => (
          <article className="system-catalog-card" key={tenant.id}>
            <span className="system-list-icon is-violet">
              <Building2 size={18} />
            </span>
            <div>
              <small>{tenant.slug}</small>
              <h2>{tenant.name}</h2>
              <p>
                {dictionary.membersCount.replace("{count}", String(tenant.memberCount))}
                {" · "}
                {tenant.defaultLocale}
                {" · "}
                {tenant.timeZone}
                {" · "}
                {formatSystemDate(tenant.createdAt, locale)}
              </p>
            </div>
            <SystemStatusBadge tone={tenant.status === "active" ? "success" : "warning"}>
              {dictionary[tenant.status]}
            </SystemStatusBadge>
            <button
              type="button"
              className="system-table-action"
              onClick={() => openTenant(tenant)}
            >
              {dictionary.configure}
            </button>
          </article>
        ))}
      </HaloCatalog>

      <HaloDialog
        open={editing !== null}
        className="system-admin-drawer"
        title={dictionary.editTenant}
        icon={<Building2 size={18} />}
        closeLabel={dictionary.close}
        onClose={() => setEditing(null)}
      >
        <form className="system-form" onSubmit={(event) => void saveTenant(event)}>
          <div className="system-form-summary">
            <strong>{editing?.name}</strong>
            <small>{editing?.slug}</small>
          </div>
          <SystemFormField icon={<ShieldCheck size={16} />} label={dictionary.status}>
            <HaloChoicePills
              value={status}
              ariaLabel={dictionary.status}
              onChange={(value) => setStatus(value as SystemTenant["status"])}
              options={[
                { value: "active", label: dictionary.active },
                { value: "suspended", label: dictionary.suspended },
                { value: "archived", label: dictionary.archived },
              ]}
            />
          </SystemFormField>
          <SystemFormField icon={<Languages size={16} />} label={dictionary.locale}>
            <HaloChoicePills
              value={defaultLocale}
              ariaLabel={dictionary.locale}
              onChange={(value) => setDefaultLocale(value as "zh-CN" | "en-US")}
              options={[
                { value: "zh-CN", label: dictionary.simplifiedChinese },
                { value: "en-US", label: dictionary.english },
              ]}
            />
          </SystemFormField>
          <SystemFormField icon={<Globe2 size={16} />} label={dictionary.timeZone}>
            <input
              value={timeZone}
              maxLength={64}
              onChange={(event) => setTimeZone(event.target.value)}
            />
          </SystemFormField>
          <footer className="system-form-actions">
            <button
              type="button"
              className="admin-secondary-button"
              onClick={() => setEditing(null)}
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
