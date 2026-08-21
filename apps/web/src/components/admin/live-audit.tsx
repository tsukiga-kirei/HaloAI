"use client";

import {
  WorkspaceAuditPageSchema,
  type AuditOutcome,
  type SessionContext,
  type WorkspaceAuditEvent,
} from "@haloai/contracts";
import { ArrowUpRight, LoaderCircle, ScrollText, Search } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { notify, notifyError } from "@/components/toast-host";
import { AdminPageHeader } from "./admin-page-header";
import { HaloDialog } from "@/components/ui/halo-dialog";
import { HaloEmptyState } from "@/components/ui/halo-empty-state";
import { HaloSegmented } from "@/components/ui/halo-segmented";
import { resolveActiveWorkspace } from "@/lib/active-workspace";
import type { AdminDictionary } from "@/lib/admin-i18n";
import { apiFetch } from "@/lib/api-client";
import { formatRelativeTime } from "@/lib/format-relative-time";
import { useShellPreferences } from "@/lib/shell-preferences";

const outcomes: ReadonlyArray<AuditOutcome | "all"> = [
  "all",
  "succeeded",
  "failed",
  "denied",
  "cancelled",
];

function outcomeTone(outcome: AuditOutcome): "success" | "warning" | "muted" {
  if (outcome === "succeeded") return "success";
  if (outcome === "denied" || outcome === "failed") return "warning";
  return "muted";
}

/**
 * 审计是只追加治理记录。页面筛选不得把密钥、完整请求或模型原文带进查询或导出。
 */
export function LiveAudit({ dictionary }: { dictionary: AdminDictionary }) {
  const { locale } = useShellPreferences();
  const [items, setItems] = useState<WorkspaceAuditEvent[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [query, setQuery] = useState("");
  const [appliedQuery, setAppliedQuery] = useState("");
  const [outcome, setOutcome] = useState<AuditOutcome | "all">("all");
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<WorkspaceAuditEvent | null>(null);
  const pageSize = 20;

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setAppliedQuery((current) => {
        const next = query.trim();
        if (current !== next) setPage(1);
        return next;
      });
    }, 300);
    return () => window.clearTimeout(timer);
  }, [query]);

  const load = useCallback(async (): Promise<void> => {
    setLoading(true);
    try {
      const session = await apiFetch<SessionContext>("/v1/session");
      const workspace = resolveActiveWorkspace(session);
      if (!workspace) {
        setItems([]);
        setTotal(0);
        return;
      }
      const search = new URLSearchParams({ page: String(page), pageSize: String(pageSize) });
      if (appliedQuery) search.set("query", appliedQuery);
      if (outcome !== "all") search.set("outcome", outcome);
      const payload = await apiFetch<unknown>(`/v1/workspaces/${workspace.id}/audit?${search}`);
      const parsed = WorkspaceAuditPageSchema.parse(payload);
      setItems(parsed.items);
      setTotal(parsed.total);
    } catch {
      notifyError(dictionary.auditLoadError, "workspace-audit-load-error");
      setItems([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  }, [appliedQuery, dictionary.auditLoadError, outcome, page]);

  useEffect(() => {
    void load();
  }, [load]);

  const outcomeLabel = useCallback(
    (value: AuditOutcome | "all") =>
      ({
        all: dictionary.auditAllOutcomes,
        succeeded: dictionary.auditOutcomeSucceeded,
        failed: dictionary.auditOutcomeFailed,
        denied: dictionary.auditOutcomeDenied,
        cancelled: dictionary.auditOutcomeCancelled,
      })[value],
    [dictionary],
  );

  const pageCount = Math.max(1, Math.ceil(total / pageSize));

  async function exportLog(): Promise<void> {
    const payload = JSON.stringify({ exportedAt: new Date().toISOString(), total, items }, null, 2);
    const blob = new Blob([payload], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = "haloai-audit.json";
    anchor.click();
    URL.revokeObjectURL(url);
    notify(dictionary.auditExported);
  }

  const toolbar = useMemo(
    () => (
      <div className="admin-audit-toolbar">
        <label className="organization-search admin-audit-search">
          <Search size={16} />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder={dictionary.auditSearchPlaceholder}
            aria-label={dictionary.auditSearchPlaceholder}
          />
        </label>
        <HaloSegmented
          ariaLabel={dictionary.auditAllOutcomes}
          value={outcome}
          onChange={(value) => {
            setOutcome(value as AuditOutcome | "all");
            setPage(1);
          }}
          items={outcomes.map((value) => ({ value, label: outcomeLabel(value) }))}
        />
      </div>
    ),
    [dictionary, outcome, outcomeLabel, query],
  );

  return (
    <>
      <AdminPageHeader
        kicker={dictionary.navGroupGovernance}
        title={dictionary.auditTitle}
        description={dictionary.auditDescription}
        actions={
          <button type="button" className="admin-primary-button" onClick={() => void exportLog()}>
            <ArrowUpRight size={17} />
            {dictionary.exportAudit}
          </button>
        }
      />
      {toolbar}
      {loading ? (
        <p className="halo-loading-copy">
          <LoaderCircle size={16} className="halo-spin" /> {dictionary.auditLoading}
        </p>
      ) : items.length === 0 ? (
        <HaloEmptyState
          icon={<ScrollText size={22} />}
          title={dictionary.emptyAuditLog}
          description={dictionary.auditEmptyDescription}
        />
      ) : (
        <section className="admin-table-panel">
          <div className="admin-table is-audit">
            <div className="admin-table-row is-header">
              <span>{dictionary.auditEvent}</span>
              <span>{dictionary.auditActor}</span>
              <span>{dictionary.auditScope}</span>
              <span>{dictionary.auditTime}</span>
            </div>
            {items.map((event) => (
              <button
                type="button"
                className="admin-table-row"
                key={event.id}
                onClick={() => setSelected(event)}
              >
                <span data-label={dictionary.auditEvent}>
                  <code>{event.action}</code>
                  <small>{event.resourceType}</small>
                </span>
                <span data-label={dictionary.auditActor}>
                  {event.actorName ?? dictionary.auditSystem}
                </span>
                <span data-label={dictionary.auditScope}>
                  <span className={`admin-status-badge is-${outcomeTone(event.outcome)}`}>
                    {outcomeLabel(event.outcome)}
                  </span>
                </span>
                <span data-label={dictionary.auditTime}>
                  {formatRelativeTime(event.occurredAt, locale)}
                </span>
              </button>
            ))}
          </div>
          {pageCount > 1 ? (
            <footer className="system-pagination">
              <span>
                {page} / {pageCount} · {total}
              </span>
              <div className="system-pagination-actions">
                <button
                  type="button"
                  disabled={page <= 1}
                  aria-label={dictionary.auditPreviousPage}
                  onClick={() => setPage((current) => current - 1)}
                >
                  ←
                </button>
                <button
                  type="button"
                  disabled={page >= pageCount}
                  aria-label={dictionary.auditNextPage}
                  onClick={() => setPage((current) => current + 1)}
                >
                  →
                </button>
              </div>
            </footer>
          ) : null}
        </section>
      )}
      <HaloDialog
        open={selected !== null}
        title={dictionary.auditDetailTitle}
        onClose={() => setSelected(null)}
      >
        {selected ? (
          <dl className="admin-audit-detail">
            <div>
              <dt>{dictionary.auditEvent}</dt>
              <dd>
                <code>{selected.action}</code>
              </dd>
            </div>
            <div>
              <dt>{dictionary.auditActor}</dt>
              <dd>{selected.actorName ?? dictionary.auditSystem}</dd>
            </div>
            <div>
              <dt>{dictionary.auditResource}</dt>
              <dd>
                {selected.resourceType} · {selected.resourceId}
              </dd>
            </div>
            <div>
              <dt>{dictionary.auditDecision}</dt>
              <dd>{selected.decision}</dd>
            </div>
            <div>
              <dt>{dictionary.auditReason}</dt>
              <dd>{selected.reasonCode ?? "—"}</dd>
            </div>
            <div>
              <dt>{dictionary.auditTime}</dt>
              <dd>{new Date(selected.occurredAt).toLocaleString(locale)}</dd>
            </div>
          </dl>
        ) : null}
      </HaloDialog>
    </>
  );
}
