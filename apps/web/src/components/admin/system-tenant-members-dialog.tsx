"use client";

import {
  SystemTenantMemberPageSchema,
  type SystemTenant,
  type SystemTenantMember,
  type SystemTenantMemberPage,
} from "@haloai/contracts";
import { Building2, BriefcaseBusiness, Mail, UsersRound } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { HaloCatalog } from "@/components/ui/halo-catalog";
import { HaloDialog } from "@/components/ui/halo-dialog";
import { apiFetch } from "@/lib/api-client";
import { useSystemAdminDictionary } from "@/lib/use-system-admin-dictionary";
import {
  formatSystemDate,
  paginationLabels,
  SystemSearchToolbar,
  SystemSectionState,
  SystemStatusBadge,
} from "./system-section-primitives";

function roleTone(role: SystemTenantMember["role"]): "success" | "warning" | "muted" {
  if (role === "owner") return "success";
  if (role === "admin") return "warning";
  return "muted";
}

export function SystemTenantMembersDialog({
  tenant,
  onClose,
}: {
  tenant: SystemTenant | null;
  onClose(): void;
}) {
  const { dictionary, locale } = useSystemAdminDictionary();
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [query, setQuery] = useState("");
  const [result, setResult] = useState<SystemTenantMemberPage | null>(null);
  const [loading, setLoading] = useState(false);
  const [failed, setFailed] = useState(false);

  const load = useCallback(async () => {
    if (!tenant) return;
    setLoading(true);
    setFailed(false);
    try {
      const search = new URLSearchParams({ page: String(page), pageSize: String(pageSize) });
      if (query) search.set("query", query);
      const payload = await apiFetch<unknown>(
        `/v1/system/tenants/${tenant.id}/members?${search.toString()}`,
      );
      setResult(SystemTenantMemberPageSchema.parse(payload));
    } catch {
      setFailed(true);
    } finally {
      setLoading(false);
    }
  }, [page, pageSize, query, tenant]);

  useEffect(() => {
    setPage(1);
    setQuery("");
    setResult(null);
  }, [tenant?.id]);

  useEffect(() => {
    void load();
  }, [load]);

  const roleLabel = (role: SystemTenantMember["role"]) => dictionary[role];
  const statusLabel = (status: SystemTenantMember["status"]) => dictionary[status];

  return (
    <HaloDialog
      open={tenant !== null}
      className="system-admin-drawer system-members-drawer"
      title={dictionary.tenantMembersTitle}
      description={tenant ? `${tenant.name} · ${tenant.slug}` : ""}
      icon={<UsersRound size={18} />}
      closeLabel={dictionary.close}
      onClose={onClose}
    >
      <div className="system-members-stack">
        <SystemSearchToolbar
          value={query}
          placeholder={dictionary.searchTenantMembers}
          searchLabel={dictionary.search}
          clearLabel={dictionary.clearSearch}
          onChange={(next) => {
            setPage(1);
            setQuery(next);
          }}
        />
        {failed && !result ? (
          <SystemSectionState
            kind="error"
            label={dictionary.loadError}
            retryLabel={dictionary.retry}
            onRetry={() => void load()}
          />
        ) : (
          <HaloCatalog
            total={result?.total ?? 0}
            page={page}
            pageSize={pageSize}
            loading={loading}
            empty={<SystemSectionState kind="empty" label={dictionary.emptyTenantMembers} />}
            labels={paginationLabels(dictionary)}
            onPageChange={setPage}
            onPageSizeChange={(next) => {
              setPage(1);
              setPageSize(next);
            }}
          >
            {(result?.items ?? []).map((member) => (
              <article className="system-member-card" key={member.membershipId}>
                <span className="system-member-avatar">
                  {member.name.slice(0, 2).toLocaleUpperCase(locale)}
                </span>
                <div className="system-member-identity">
                  <strong>{member.name}</strong>
                  <span>
                    <Mail size={13} /> {member.email}
                  </span>
                </div>
                <SystemStatusBadge tone={roleTone(member.role)}>
                  {roleLabel(member.role)}
                </SystemStatusBadge>
                <dl>
                  <div>
                    <dt>
                      <Building2 size={13} /> {dictionary.department}
                    </dt>
                    <dd>{member.departmentName ?? "—"}</dd>
                  </div>
                  <div>
                    <dt>
                      <BriefcaseBusiness size={13} /> {dictionary.jobTitle}
                    </dt>
                    <dd>{member.jobTitle || "—"}</dd>
                  </div>
                  <div>
                    <dt>{dictionary.status}</dt>
                    <dd>{statusLabel(member.status)}</dd>
                  </div>
                  <div>
                    <dt>{dictionary.joinedAt}</dt>
                    <dd>{member.joinedAt ? formatSystemDate(member.joinedAt, locale) : "—"}</dd>
                  </div>
                </dl>
              </article>
            ))}
          </HaloCatalog>
        )}
      </div>
    </HaloDialog>
  );
}
