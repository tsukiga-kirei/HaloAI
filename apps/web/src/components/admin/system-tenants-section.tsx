"use client";

import {
  CreateSystemTenantResultSchema,
  SystemTenantPageSchema,
  type SystemTenant,
  type SystemTenantPage,
} from "@haloai/contracts";
import {
  Building2,
  Copy,
  Globe2,
  Languages,
  Mail,
  Plus,
  ShieldCheck,
  UserRoundCog,
  UsersRound,
} from "lucide-react";
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
import { SystemTenantMembersDialog } from "./system-tenant-members-dialog";

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
  const [creating, setCreating] = useState(false);
  const [viewingMembers, setViewingMembers] = useState<SystemTenant | null>(null);
  const [activationLink, setActivationLink] = useState<string | null>(null);
  const [newName, setNewName] = useState("");
  const [newSlug, setNewSlug] = useState("");
  const [newAdministratorEmail, setNewAdministratorEmail] = useState("");
  const [newLocale, setNewLocale] = useState<"zh-CN" | "en-US">("zh-CN");
  const [newTimeZone, setNewTimeZone] = useState("Asia/Shanghai");

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

  async function createTenant(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    setSaving(true);
    try {
      const payload = await apiFetch<unknown>("/v1/system/tenants", {
        method: "POST",
        body: JSON.stringify({
          name: newName,
          slug: newSlug,
          defaultAdministratorEmail: newAdministratorEmail,
          defaultLocale: newLocale,
          timeZone: newTimeZone,
        }),
      });
      const result = CreateSystemTenantResultSchema.parse(payload);
      if (result.status === "created") {
        notify(dictionary.tenantCreated);
        setCreating(false);
        setPage(1);
        await load();
      } else {
        notify(dictionary.tenantActivationCreated);
        setActivationLink(
          result.activationToken
            ? `${window.location.origin}/tenant-activate/${result.activationToken}`
            : null,
        );
      }
    } catch {
      notifyError(dictionary.loadError, "system-tenant-create-error");
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
      <div className="system-tenant-toolbar-row">
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
        <button
          type="button"
          className="admin-primary-button"
          onClick={() => {
            setNewName("");
            setNewSlug("");
            setNewAdministratorEmail("");
            setNewLocale(locale);
            setNewTimeZone("Asia/Shanghai");
            setActivationLink(null);
            setCreating(true);
          }}
        >
          <Plus size={16} /> {dictionary.createTenant}
        </button>
      </div>
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
                {dictionary.departmentsCount.replace("{count}", String(tenant.departmentCount))}
                {" · "}
                {tenant.defaultLocale}
                {" · "}
                {tenant.timeZone}
                {" · "}
                {formatSystemDate(tenant.createdAt, locale)}
              </p>
            </div>
            <div className="system-tenant-administrator">
              <span>
                <UserRoundCog size={15} />
              </span>
              <span>
                <small>{dictionary.defaultAdministrator}</small>
                <strong>{tenant.defaultAdministratorName}</strong>
                <em>{tenant.defaultAdministratorEmail}</em>
              </span>
            </div>
            <SystemStatusBadge tone={tenant.status === "active" ? "success" : "warning"}>
              {dictionary[tenant.status]}
            </SystemStatusBadge>
            <div className="system-card-actions">
              <button
                type="button"
                className="system-table-action"
                onClick={() => setViewingMembers(tenant)}
              >
                <UsersRound size={14} /> {dictionary.viewMembers}
              </button>
              <button
                type="button"
                className="system-table-action"
                onClick={() => openTenant(tenant)}
              >
                {dictionary.configure}
              </button>
            </div>
          </article>
        ))}
      </HaloCatalog>

      <HaloDialog
        open={creating}
        className="system-admin-drawer"
        title={dictionary.createTenant}
        description={dictionary.createTenantDescription}
        icon={<Plus size={18} />}
        closeLabel={dictionary.close}
        onClose={() => {
          setCreating(false);
          setActivationLink(null);
        }}
        footer={
          <>
            <button
              type="button"
              className="admin-secondary-button"
              onClick={() => {
                setCreating(false);
                setActivationLink(null);
              }}
            >
              {dictionary.cancel}
            </button>
            <button
              type="submit"
              form="system-create-tenant"
              className="admin-primary-button"
              disabled={saving}
            >
              {dictionary.createTenant}
            </button>
          </>
        }
      >
        <form
          id="system-create-tenant"
          className="system-form"
          noValidate
          onSubmit={(event) => void createTenant(event)}
        >
          <SystemFormField icon={<Building2 size={16} />} label={dictionary.name}>
            <input
              required
              value={newName}
              maxLength={80}
              onChange={(event) => setNewName(event.target.value)}
            />
          </SystemFormField>
          <SystemFormField icon={<Building2 size={16} />} label={dictionary.slug}>
            <input
              required
              value={newSlug}
              maxLength={63}
              pattern="[a-z0-9]+(?:-[a-z0-9]+)*"
              onChange={(event) => setNewSlug(event.target.value.toLowerCase())}
            />
          </SystemFormField>
          <SystemFormField
            icon={<Mail size={16} />}
            label={dictionary.administratorEmail}
            hint={dictionary.administratorEmailHint}
          >
            <input
              required
              type="email"
              value={newAdministratorEmail}
              maxLength={320}
              onChange={(event) => setNewAdministratorEmail(event.target.value)}
            />
          </SystemFormField>
          {activationLink ? (
            <div className="system-activation-link">
              <strong>{dictionary.activationLink}</strong>
              <code>{activationLink}</code>
              <button
                type="button"
                className="admin-secondary-button"
                onClick={() => void navigator.clipboard.writeText(activationLink)}
              >
                <Copy size={15} /> {dictionary.copyActivationLink}
              </button>
            </div>
          ) : null}
          <SystemFormField icon={<Languages size={16} />} label={dictionary.locale}>
            <HaloChoicePills
              value={newLocale}
              ariaLabel={dictionary.locale}
              onChange={(value) => setNewLocale(value as "zh-CN" | "en-US")}
              options={[
                { value: "zh-CN", label: dictionary.simplifiedChinese },
                { value: "en-US", label: dictionary.english },
              ]}
            />
          </SystemFormField>
          <SystemFormField icon={<Globe2 size={16} />} label={dictionary.timeZone}>
            <input
              required
              value={newTimeZone}
              maxLength={64}
              onChange={(event) => setNewTimeZone(event.target.value)}
            />
          </SystemFormField>
        </form>
      </HaloDialog>

      <SystemTenantMembersDialog tenant={viewingMembers} onClose={() => setViewingMembers(null)} />

      <HaloDialog
        open={editing !== null}
        className="system-admin-drawer"
        title={dictionary.editTenant}
        icon={<Building2 size={18} />}
        closeLabel={dictionary.close}
        onClose={() => setEditing(null)}
        footer={
          <>
            <button
              type="button"
              className="admin-secondary-button"
              onClick={() => setEditing(null)}
            >
              {dictionary.cancel}
            </button>
            <button
              type="submit"
              form="system-edit-tenant"
              className="admin-primary-button"
              disabled={saving}
            >
              {dictionary.save}
            </button>
          </>
        }
      >
        <form
          id="system-edit-tenant"
          className="system-form"
          noValidate
          onSubmit={(event) => void saveTenant(event)}
        >
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
        </form>
      </HaloDialog>
    </div>
  );
}
