"use client";

import type { SessionContext, WorkspaceAnnouncement } from "@haloai/contracts";
import {
  AlertTriangle,
  Bell,
  Check,
  Clock,
  Info,
  LoaderCircle,
  Plus,
  RefreshCw,
  Search,
  ShieldAlert,
  Trash2,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useState, type FormEvent } from "react";
import { notify, notifyError } from "@/components/toast-host";
import { HaloDialog } from "@/components/ui/halo-dialog";
import { HaloEmptyState } from "@/components/ui/halo-empty-state";
import { HaloModal } from "@/components/ui/halo-modal";
import { resolveActiveWorkspace } from "@/lib/active-workspace";
import type { AdminDictionary } from "@/lib/admin-i18n";
import { apiFetch } from "@/lib/api-client";
import { AdminPageHeader } from "./admin-page-header";

export function LiveAnnouncements({ dictionary }: { dictionary: AdminDictionary }) {
  const [announcements, setAnnouncements] = useState<WorkspaceAnnouncement[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  // 创建抽屉状态
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [level, setLevel] = useState<"info" | "warning" | "critical">("info");
  const [active, setActive] = useState(true);
  const [expiresAt, setExpiresAt] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // 删除确认 Modal
  const [deletingAnnouncement, setDeletingAnnouncement] = useState<WorkspaceAnnouncement | null>(
    null,
  );
  const [deleteSubmitting, setDeleteSubmitting] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const session = await apiFetch<SessionContext>("/v1/session");
      const workspace = resolveActiveWorkspace(session);
      if (!workspace) {
        setAnnouncements([]);
        return;
      }
      const res = await apiFetch<{ items: WorkspaceAnnouncement[] }>(
        `/v1/workspaces/${workspace.id}/announcements`,
      );
      setAnnouncements(res.items);
    } catch {
      notifyError(dictionary.announcementsLoadError, "load-announcements-error");
    } finally {
      setLoading(false);
    }
  }, [dictionary.announcementsLoadError]);

  useEffect(() => {
    void load();
  }, [load]);

  const filteredAnnouncements = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return announcements;
    return announcements.filter(
      (a) => a.title.toLowerCase().includes(q) || a.content.toLowerCase().includes(q),
    );
  }, [announcements, search]);

  function handleOpenCreate() {
    setTitle("");
    setContent("");
    setLevel("info");
    setActive(true);
    setExpiresAt("");
    setDrawerOpen(true);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    if (!title.trim() || !content.trim()) return;

    setSubmitting(true);
    try {
      const session = await apiFetch<SessionContext>("/v1/session");
      const workspace = resolveActiveWorkspace(session);
      if (!workspace) return;

      await apiFetch<void>(`/v1/workspaces/${workspace.id}/announcements`, {
        method: "POST",
        body: JSON.stringify({
          title: title.trim(),
          content: content.trim(),
          level,
          active,
          expiresAt: expiresAt ? new Date(expiresAt).toISOString() : null,
        }),
      });

      notify(dictionary.announcementCreated);
      setDrawerOpen(false);
      await load();
    } catch {
      notifyError(dictionary.announcementSaveError, "save-announcement-error");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete(): Promise<void> {
    if (!deletingAnnouncement) return;
    setDeleteSubmitting(true);
    try {
      const session = await apiFetch<SessionContext>("/v1/session");
      const workspace = resolveActiveWorkspace(session);
      if (!workspace) return;

      await apiFetch<void>(
        `/v1/workspaces/${workspace.id}/announcements/${deletingAnnouncement.id}`,
        {
          method: "DELETE",
        },
      );
      notify(dictionary.announcementDeleted);
      setDeletingAnnouncement(null);
      await load();
    } catch {
      notifyError(dictionary.announcementDeleteError, "delete-announcement-error");
    } finally {
      setDeleteSubmitting(false);
    }
  }

  function getLevelBadge(lvl: "info" | "warning" | "critical") {
    if (lvl === "critical") {
      return (
        <span
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "4px",
            fontSize: "11px",
            fontWeight: 600,
            padding: "2px 8px",
            borderRadius: "6px",
            background: "color-mix(in srgb, var(--danger, #ef4444) 15%, transparent)",
            color: "var(--danger, #ef4444)",
          }}
        >
          <ShieldAlert size={12} />
          {dictionary.announcementLevelCritical}
        </span>
      );
    }
    if (lvl === "warning") {
      return (
        <span
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "4px",
            fontSize: "11px",
            fontWeight: 600,
            padding: "2px 8px",
            borderRadius: "6px",
            background: "color-mix(in srgb, var(--warning, #f59e0b) 15%, transparent)",
            color: "var(--warning, #d97706)",
          }}
        >
          <AlertTriangle size={12} />
          {dictionary.announcementLevelWarning}
        </span>
      );
    }
    return (
      <span
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: "4px",
          fontSize: "11px",
          fontWeight: 600,
          padding: "2px 8px",
          borderRadius: "6px",
          background: "color-mix(in srgb, var(--accent) 12%, transparent)",
          color: "var(--accent)",
        }}
      >
        <Info size={12} />
        {dictionary.announcementLevelInfo}
      </span>
    );
  }

  return (
    <>
      <AdminPageHeader
        kicker={dictionary.navGroupSpace}
        title={dictionary.navAnnouncements}
        actions={
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <button
              type="button"
              className="admin-secondary-button compact"
              onClick={() => void load()}
              disabled={loading}
            >
              <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
              {dictionary.reload}
            </button>
            <button
              type="button"
              className="admin-primary-button compact"
              onClick={handleOpenCreate}
            >
              <Plus size={14} />
              {dictionary.createAnnouncement}
            </button>
          </div>
        }
      />

      <div
        className="admin-panel"
        style={{ display: "flex", flexDirection: "column", gap: "16px" }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: "12px",
            flexWrap: "wrap",
          }}
        >
          <div
            className="admin-search-input"
            style={{ width: "min(320px, 100%)", position: "relative" }}
          >
            <Search
              size={15}
              style={{
                position: "absolute",
                left: "10px",
                top: "50%",
                transform: "translateY(-50%)",
                color: "var(--text-muted)",
              }}
            />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={dictionary.announcementSearchPlaceholder}
              style={{
                width: "100%",
                height: "36px",
                paddingLeft: "32px",
                paddingRight: "10px",
                borderRadius: "8px",
                border: "1px solid var(--border)",
                background: "var(--surface)",
                color: "var(--text)",
                fontSize: "13px",
                outline: 0,
              }}
            />
          </div>
          <span style={{ fontSize: "12px", color: "var(--text-muted)", fontWeight: 500 }}>
            {filteredAnnouncements.length} {dictionary.navAnnouncements}
          </span>
        </div>

        {filteredAnnouncements.length === 0 ? (
          <HaloEmptyState
            icon={<Bell size={24} />}
            title={dictionary.noAnnouncements}
            description={dictionary.noAnnouncementsDesc}
          />
        ) : (
          <div style={{ display: "grid", gap: "12px" }}>
            {filteredAnnouncements.map((announcement) => (
              <div
                key={announcement.id}
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "8px",
                  padding: "16px",
                  borderRadius: "12px",
                  border: "1px solid var(--border)",
                  background: "var(--surface)",
                  transition: "border-color 0.15s ease",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    gap: "12px",
                    flexWrap: "wrap",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    {getLevelBadge(announcement.level)}
                    <h3
                      style={{ margin: 0, fontSize: "14px", fontWeight: 650, color: "var(--text)" }}
                    >
                      {announcement.title}
                    </h3>
                  </div>

                  <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <span
                      style={{
                        fontSize: "11px",
                        fontWeight: 600,
                        padding: "2px 6px",
                        borderRadius: "4px",
                        background: announcement.active
                          ? "color-mix(in srgb, #10b981 15%, transparent)"
                          : "var(--surface-raised)",
                        color: announcement.active ? "#10b981" : "var(--text-muted)",
                      }}
                    >
                      {announcement.active ? dictionary.statusActive : dictionary.statusPaused}
                    </span>

                    <button
                      type="button"
                      className="icon-button tiny"
                      style={{ color: "var(--text-muted)" }}
                      onClick={() => setDeletingAnnouncement(announcement)}
                      aria-label={dictionary.delete}
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                </div>

                <p
                  style={{
                    margin: 0,
                    fontSize: "13px",
                    color: "var(--text-soft)",
                    lineHeight: 1.5,
                  }}
                >
                  {announcement.content}
                </p>

                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "16px",
                    fontSize: "11px",
                    color: "var(--text-muted)",
                    marginTop: "4px",
                    flexWrap: "wrap",
                  }}
                >
                  <span style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                    <Clock size={12} />
                    {dictionary.announcementCreatedAt}:{" "}
                    {new Date(announcement.createdAt).toLocaleDateString()}
                  </span>
                  {announcement.expiresAt ? (
                    <span style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                      <Clock size={12} />
                      {dictionary.announcementExpiresAt}:{" "}
                      {new Date(announcement.expiresAt).toLocaleDateString()}
                    </span>
                  ) : null}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 创建空间公告抽屉 */}
      <HaloDialog
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        title={dictionary.createAnnouncementDrawerTitle}
        description={dictionary.createAnnouncementDrawerDesc}
        icon={<Bell size={18} />}
        closeLabel={dictionary.cancel}
        footer={
          <>
            <button
              type="button"
              className="admin-secondary-button"
              onClick={() => setDrawerOpen(false)}
            >
              {dictionary.cancel}
            </button>
            <button
              type="submit"
              form="workspace-announcement-form"
              className="admin-primary-button"
              disabled={submitting || !title.trim() || !content.trim()}
            >
              {submitting ? <LoaderCircle size={16} className="animate-spin" /> : null}
              {dictionary.createAnnouncement}
            </button>
          </>
        }
      >
        <form
          id="workspace-announcement-form"
          className="organization-form"
          onSubmit={(e) => void handleSubmit(e)}
        >
          <label>
            <span>{dictionary.announcementTitle}</span>
            <input
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder={dictionary.announcementTitlePlaceholder}
              maxLength={200}
            />
          </label>

          <label>
            <span>{dictionary.announcementContent}</span>
            <textarea
              required
              rows={4}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder={dictionary.announcementContentPlaceholder}
              maxLength={2000}
            />
          </label>

          <label>
            <span>{dictionary.announcementLevel}</span>
            <div style={{ display: "flex", gap: "8px", marginTop: "2px" }}>
              {(["info", "warning", "critical"] as const).map((lvl) => (
                <button
                  key={lvl}
                  type="button"
                  onClick={() => setLevel(lvl)}
                  style={{
                    flex: 1,
                    padding: "8px",
                    borderRadius: "8px",
                    border: level === lvl ? "1.5px solid var(--accent)" : "1px solid var(--border)",
                    background: level === lvl ? "var(--accent-soft)" : "var(--surface)",
                    color: level === lvl ? "var(--accent)" : "var(--text-soft)",
                    fontSize: "12px",
                    fontWeight: level === lvl ? 650 : 500,
                    cursor: "pointer",
                  }}
                >
                  {lvl === "info"
                    ? dictionary.announcementLevelInfo
                    : lvl === "warning"
                      ? dictionary.announcementLevelWarning
                      : dictionary.announcementLevelCritical}
                </button>
              ))}
            </div>
          </label>

          <label
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              cursor: "pointer",
              marginTop: "4px",
            }}
          >
            <input type="checkbox" checked={active} onChange={(e) => setActive(e.target.checked)} />
            <span style={{ fontSize: "13px", fontWeight: 600 }}>
              {dictionary.announcementActive}
            </span>
          </label>
        </form>
      </HaloDialog>

      {/* 删除公告居中 Modal */}
      <HaloModal
        open={Boolean(deletingAnnouncement)}
        danger
        title={dictionary.deleteAnnouncementConfirmTitle}
        description={dictionary.deleteAnnouncementConfirmDesc}
        icon={<Trash2 size={18} />}
        closeLabel={dictionary.cancel}
        onClose={() => setDeletingAnnouncement(null)}
        footer={
          <>
            <button
              type="button"
              className="admin-secondary-button"
              onClick={() => setDeletingAnnouncement(null)}
            >
              {dictionary.cancel}
            </button>
            <button
              type="button"
              className="admin-secondary-button is-danger"
              style={{ color: "#ffffff", background: "#ef4444", borderColor: "#ef4444" }}
              disabled={deleteSubmitting}
              onClick={() => void handleDelete()}
            >
              {deleteSubmitting ? <LoaderCircle size={16} className="animate-spin" /> : null}
              {dictionary.confirmDelete}
            </button>
          </>
        }
      >
        <p style={{ margin: 0, fontSize: "13px", color: "var(--text-muted)", lineHeight: 1.5 }}>
          {dictionary.irreversibleAction}
        </p>
      </HaloModal>
    </>
  );
}
