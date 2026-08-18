"use client";

import {
  SystemTenantPageSchema,
  type SystemTenant,
  type SystemTenantPage,
} from "@haloai/contracts";
import type { LegacyColumnDef as ColumnDef } from "@tanstack/react-table/legacy";
import { Building2, Edit3 } from "lucide-react";
import { useCallback, useEffect, useMemo, useState, type FormEvent } from "react";
import { notify, notifyError } from "@/components/toast-host";
import { HaloDataTable } from "@/components/ui/halo-data-table";
import { HaloDialog } from "@/components/ui/halo-dialog";
import { HaloSelect } from "@/components/ui/halo-select";
import { apiFetch } from "@/lib/api-client";
import type { SystemAdminDictionary } from "@/lib/system-admin-i18n";
import {
  formatSystemDate,
  paginationLabels,
  SystemSearchToolbar,
  SystemSectionState,
  SystemStatusBadge,
} from "./system-section-primitives";

export function SystemTenantsSection({
  dictionary,
  locale,
}: {
  dictionary: SystemAdminDictionary;
  locale: "zh-CN" | "en-US";
}) {
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

  const columns = useMemo<ColumnDef<SystemTenant>[]>(
    () => [
      {
        header: dictionary.name,
        cell: ({ row }) => (
          <span className="system-table-identity">
            <span className="system-list-icon is-violet">
              <Building2 size={15} />
            </span>
            <span>
              <strong>{row.original.name}</strong>
              <small>{row.original.slug}</small>
            </span>
          </span>
        ),
      },
      {
        header: dictionary.status,
        accessorKey: "status",
        cell: ({ row }) => (
          <SystemStatusBadge tone={row.original.status === "active" ? "success" : "warning"}>
            {dictionary[row.original.status]}
          </SystemStatusBadge>
        ),
      },
      { header: dictionary.members, accessorKey: "memberCount" },
      {
        header: dictionary.locale,
        cell: ({ row }) => row.original.defaultLocale,
      },
      { header: dictionary.timeZone, accessorKey: "timeZone" },
      {
        header: dictionary.createdAt,
        cell: ({ row }) => formatSystemDate(row.original.createdAt, locale),
      },
      {
        id: "actions",
        header: dictionary.actions,
        cell: ({ row }) => (
          <button
            type="button"
            className="system-table-action"
            onClick={() => openTenant(row.original)}
          >
            <Edit3 size={14} /> {dictionary.configure}
          </button>
        ),
      },
    ],
    [dictionary, locale],
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
        placeholder={dictionary.searchTenants}
        searchLabel={dictionary.search}
        onChange={(next) => {
          setPage(1);
          setQuery(next.trim());
        }}
      />
      <HaloDataTable
        columns={columns}
        data={result?.items ?? []}
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
      />

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
          <label>
            <span>{dictionary.status}</span>
            <HaloSelect
              value={status}
              ariaLabel={dictionary.status}
              onValueChange={(value) => setStatus(value as SystemTenant["status"])}
              options={[
                { value: "active", label: dictionary.active },
                { value: "suspended", label: dictionary.suspended },
                { value: "archived", label: dictionary.archived },
              ]}
            />
          </label>
          <label>
            <span>{dictionary.locale}</span>
            <HaloSelect
              value={defaultLocale}
              ariaLabel={dictionary.locale}
              onValueChange={(value) => setDefaultLocale(value as "zh-CN" | "en-US")}
              options={[
                { value: "zh-CN", label: dictionary.simplifiedChinese },
                { value: "en-US", label: dictionary.english },
              ]}
            />
          </label>
          <label>
            <span>{dictionary.timeZone}</span>
            <input
              value={timeZone}
              maxLength={64}
              onChange={(event) => setTimeZone(event.target.value)}
            />
          </label>
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
