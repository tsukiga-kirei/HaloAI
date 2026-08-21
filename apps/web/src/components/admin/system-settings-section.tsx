"use client";

import {
  SESSION_EXPIRES_IN_SECONDS_OPTIONS,
  SESSION_UPDATE_AGE_SECONDS_OPTIONS,
  SystemSettingsSchema,
  type SystemAdministrator,
  type SystemAnnouncement,
  type SystemSettings,
} from "@haloai/contracts";
import {
  Bell,
  Clock3,
  Globe2,
  Languages,
  LoaderCircle,
  Plus,
  RefreshCw,
  ShieldCheck,
  Trash2,
  UserCheck,
  UserCog,
  UserX,
} from "lucide-react";
import {
  type FormEvent,
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { animatePanelIn } from "@/lib/motion";
import { notify, notifyError } from "@/components/toast-host";
import { HaloChoicePills } from "@/components/ui/halo-choice-pills";
import { HaloDialog } from "@/components/ui/halo-dialog";
import { HaloSegmented } from "@/components/ui/halo-segmented";
import { HaloSelect } from "@/components/ui/halo-select";
import { apiFetch } from "@/lib/api-client";
import { useSystemAdminDictionary } from "@/lib/use-system-admin-dictionary";
import {
  SystemFormField,
  SystemSectionState,
  SystemStatusBadge,
} from "./system-section-primitives";

type SettingsTab = "general" | "authentication" | "administrators" | "announcements";

export function SystemSettingsSection() {
  const { dictionary } = useSystemAdminDictionary();
  const [settings, setSettings] = useState<SystemSettings | null>(null);
  const [tab, setTab] = useState<SettingsTab>("general");
  const panelRef = useRef<HTMLElement>(null);
  const [locale, setLocale] = useState<"zh-CN" | "en-US">("zh-CN");
  const [sessionExpiresInSeconds, setSessionExpiresInSeconds] = useState(604_800);
  const [sessionUpdateAgeSeconds, setSessionUpdateAgeSeconds] = useState(86_400);
  const [slidingRenewal, setSlidingRenewal] = useState(true);
  const [failed, setFailed] = useState(false);
  const [saving, setSaving] = useState(false);

  // 管理员管理状态
  const [administrators, setAdministrators] = useState<SystemAdministrator[]>([]);
  const [adminDialogOpen, setAdminDialogOpen] = useState(false);
  const [newAdminEmail, setNewAdminEmail] = useState("");
  const [adminSubmitting, setAdminSubmitting] = useState(false);

  // 公告管理状态
  const [announcements, setAnnouncements] = useState<SystemAnnouncement[]>([]);
  const [announcementDialogOpen, setAnnouncementDialogOpen] = useState(false);
  const [announcementTitle, setAnnouncementTitle] = useState("");
  const [announcementContent, setAnnouncementContent] = useState("");
  const [announcementLevel, setAnnouncementLevel] = useState<"info" | "warning" | "critical">(
    "info",
  );
  const [announcementSubmitting, setAnnouncementSubmitting] = useState(false);

  const load = useCallback(async () => {
    setFailed(false);
    try {
      const [settingsData, adminsData, announcementsData] = await Promise.all([
        apiFetch<unknown>("/v1/system/settings"),
        apiFetch<{ items: SystemAdministrator[] }>("/v1/system/administrators"),
        apiFetch<{ items: SystemAnnouncement[] }>("/v1/system/announcements"),
      ]);
      const parsed = SystemSettingsSchema.parse(settingsData);
      setSettings(parsed);
      setLocale(parsed.defaultLocale);
      setSessionExpiresInSeconds(parsed.authentication.sessionExpiresInSeconds);
      setSessionUpdateAgeSeconds(parsed.authentication.sessionUpdateAgeSeconds);
      setSlidingRenewal(parsed.authentication.slidingRenewal);
      setAdministrators(adminsData.items);
      setAnnouncements(announcementsData.items);
    } catch {
      setFailed(true);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const panelReady = useRef(false);
  const settingsReady = Boolean(settings);
  useLayoutEffect(() => {
    const panel = panelRef.current;
    if (!panel) return;
    if (!panelReady.current) {
      panelReady.current = true;
      return;
    }
    return animatePanelIn(panel);
  }, [tab, settingsReady]);

  const dirty = useMemo(() => {
    if (!settings) return false;
    return (
      locale !== settings.defaultLocale ||
      sessionExpiresInSeconds !== settings.authentication.sessionExpiresInSeconds ||
      sessionUpdateAgeSeconds !== settings.authentication.sessionUpdateAgeSeconds ||
      slidingRenewal !== settings.authentication.slidingRenewal
    );
  }, [locale, sessionExpiresInSeconds, sessionUpdateAgeSeconds, settings, slidingRenewal]);

  const renewalOptions = SESSION_UPDATE_AGE_SECONDS_OPTIONS.filter(
    (seconds) => seconds < sessionExpiresInSeconds,
  ).map((seconds) => ({
    value: String(seconds),
    label:
      seconds === 3_600
        ? dictionary.renewal1Hour
        : seconds === 21_600
          ? dictionary.renewal6Hours
          : seconds === 43_200
            ? dictionary.renewal12Hours
            : dictionary.renewal1Day,
  }));

  async function save(): Promise<void> {
    setSaving(true);
    try {
      await apiFetch<void>("/v1/system/settings", {
        method: "PATCH",
        body: JSON.stringify({
          defaultLocale: locale,
          authentication: {
            sessionExpiresInSeconds,
            sessionUpdateAgeSeconds,
            slidingRenewal,
          },
        }),
      });
      notify(dictionary.settingsSaved);
      await load();
    } catch {
      notifyError(dictionary.loadError, "system-settings-save-error");
    } finally {
      setSaving(false);
    }
  }

  async function handleAddAdministrator(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    if (!newAdminEmail.trim()) return;
    setAdminSubmitting(true);
    try {
      await apiFetch<void>("/v1/system/administrators", {
        method: "POST",
        body: JSON.stringify({ email: newAdminEmail.trim() }),
      });
      notify(dictionary.administratorAdded);
      setAdminDialogOpen(false);
      setNewAdminEmail("");
      await load();
    } catch {
      notifyError(dictionary.loadError, "add-admin-error");
    } finally {
      setAdminSubmitting(false);
    }
  }

  async function handleUpdateAdminStatus(
    userId: string,
    status: "active" | "suspended",
  ): Promise<void> {
    try {
      await apiFetch<void>(`/v1/system/administrators/${userId}/status`, {
        method: "PATCH",
        body: JSON.stringify({ status }),
      });
      notify(dictionary.administratorStatusUpdated);
      await load();
    } catch {
      notifyError(dictionary.loadError, "update-admin-status-error");
    }
  }

  async function handleCreateAnnouncement(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    if (!announcementTitle.trim() || !announcementContent.trim()) return;
    setAnnouncementSubmitting(true);
    try {
      await apiFetch<void>("/v1/system/announcements", {
        method: "POST",
        body: JSON.stringify({
          title: announcementTitle.trim(),
          content: announcementContent.trim(),
          level: announcementLevel,
          active: true,
        }),
      });
      notify(dictionary.announcementCreated);
      setAnnouncementDialogOpen(false);
      setAnnouncementTitle("");
      setAnnouncementContent("");
      await load();
    } catch {
      notifyError(dictionary.loadError, "create-announcement-error");
    } finally {
      setAnnouncementSubmitting(false);
    }
  }

  async function handleDeleteAnnouncement(id: string): Promise<void> {
    try {
      await apiFetch<void>(`/v1/system/announcements/${id}`, {
        method: "DELETE",
      });
      notify(dictionary.announcementDeleted);
      await load();
    } catch {
      notifyError(dictionary.loadError, "delete-announcement-error");
    }
  }

  if (failed) {
    return (
      <SystemSectionState
        kind="error"
        label={dictionary.loadError}
        retryLabel={dictionary.retry}
        onRetry={() => void load()}
      />
    );
  }
  if (!settings) return <SystemSectionState kind="loading" label={dictionary.loading} />;

  return (
    <div className="system-settings-layout">
      <HaloSegmented
        value={tab}
        ariaLabel={dictionary.settingsTitle}
        onChange={setTab}
        items={[
          { value: "general", label: dictionary.generalTab, icon: Globe2 },
          { value: "authentication", label: dictionary.authenticationTab, icon: ShieldCheck },
          { value: "administrators", label: dictionary.administratorsTab, icon: UserCog },
          { value: "announcements", label: dictionary.announcementsTab, icon: Bell },
        ]}
      />

      <section className="system-settings-panel" data-motion="admin-item" ref={panelRef}>
        {tab === "general" && (
          <div className="system-settings-group">
            <SystemFormField
              icon={<Languages size={16} />}
              label={dictionary.defaultLocale}
              hint={dictionary.defaultLocaleHint}
            >
              <HaloChoicePills
                value={locale}
                ariaLabel={dictionary.defaultLocale}
                onChange={(value) => setLocale(value as "zh-CN" | "en-US")}
                options={[
                  { value: "zh-CN", label: dictionary.simplifiedChinese },
                  { value: "en-US", label: dictionary.english },
                ]}
              />
            </SystemFormField>
          </div>
        )}

        {tab === "authentication" && (
          <div className="system-settings-group">
            <SystemFormField icon={<ShieldCheck size={16} />} label={dictionary.sessionMode}>
              <div className="system-setting-static">
                <strong>{dictionary.databaseSession}</strong>
                <SystemStatusBadge tone="success">{dictionary.enabled}</SystemStatusBadge>
              </div>
            </SystemFormField>
            <SystemFormField
              icon={<Clock3 size={16} />}
              label={dictionary.cookieLifetime}
              hint={dictionary.cookieLifetimeHint}
            >
              <HaloChoicePills
                value={String(sessionExpiresInSeconds)}
                ariaLabel={dictionary.cookieLifetime}
                onChange={(value) => {
                  const next = Number(value);
                  setSessionExpiresInSeconds(next);
                  if (sessionUpdateAgeSeconds >= next) {
                    const fallback = [...SESSION_UPDATE_AGE_SECONDS_OPTIONS]
                      .reverse()
                      .find((option) => option < next);
                    if (fallback) setSessionUpdateAgeSeconds(fallback);
                  }
                }}
                options={SESSION_EXPIRES_IN_SECONDS_OPTIONS.map((seconds) => ({
                  value: String(seconds),
                  label:
                    seconds === 86_400
                      ? dictionary.lifetime1Day
                      : seconds === 604_800
                        ? dictionary.lifetime7Days
                        : seconds === 1_209_600
                          ? dictionary.lifetime14Days
                          : dictionary.lifetime30Days,
                }))}
              />
            </SystemFormField>
            <SystemFormField
              icon={<RefreshCw size={16} />}
              label={dictionary.renewalInterval}
              hint={dictionary.renewalIntervalHint}
            >
              <HaloChoicePills
                value={String(sessionUpdateAgeSeconds)}
                ariaLabel={dictionary.renewalInterval}
                onChange={(value) => setSessionUpdateAgeSeconds(Number(value))}
                options={renewalOptions}
              />
            </SystemFormField>
            <SystemFormField
              icon={<RefreshCw size={16} />}
              label={dictionary.slidingRenewal}
              hint={dictionary.slidingRenewalHint}
            >
              <HaloChoicePills
                value={slidingRenewal ? "true" : "false"}
                ariaLabel={dictionary.slidingRenewal}
                onChange={(value) => setSlidingRenewal(value === "true")}
                options={[
                  { value: "true", label: dictionary.enabled },
                  { value: "false", label: dictionary.disabled },
                ]}
              />
            </SystemFormField>
          </div>
        )}

        {tab === "administrators" && (
          <div
            className="system-settings-group"
            style={{ display: "flex", flexDirection: "column", gap: "1rem" }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <h3 style={{ fontSize: "1rem", fontWeight: 600 }}>
                  {dictionary.administratorsTitle}
                </h3>
                <p style={{ fontSize: "0.8125rem", color: "var(--halo-text-muted)" }}>
                  平台管理员拥有跨租户与系统级配置权限。
                </p>
              </div>
              <button
                type="button"
                className="admin-primary-button compact"
                onClick={() => setAdminDialogOpen(true)}
              >
                <Plus size={16} /> {dictionary.addAdministrator}
              </button>
            </div>

            <div className="organization-table-wrap">
              <table className="organization-table">
                <thead>
                  <tr>
                    <th>{dictionary.adminName}</th>
                    <th>{dictionary.adminEmail}</th>
                    <th>{dictionary.adminStatus}</th>
                    <th>{dictionary.adminActions}</th>
                  </tr>
                </thead>
                <tbody>
                  {administrators.map((admin) => (
                    <tr key={admin.id}>
                      <td>
                        <strong>{admin.name}</strong>
                      </td>
                      <td>{admin.email}</td>
                      <td>
                        <SystemStatusBadge tone={admin.status === "active" ? "success" : "muted"}>
                          {admin.status === "active" ? dictionary.active : dictionary.suspended}
                        </SystemStatusBadge>
                      </td>
                      <td>
                        <span className="admin-table-actions">
                          {admin.status === "active" ? (
                            <button
                              type="button"
                              className="admin-table-action is-danger"
                              onClick={() =>
                                void handleUpdateAdminStatus(admin.userId, "suspended")
                              }
                            >
                              <UserX size={14} /> {dictionary.suspendAdmin}
                            </button>
                          ) : (
                            <button
                              type="button"
                              className="admin-table-action"
                              onClick={() => void handleUpdateAdminStatus(admin.userId, "active")}
                            >
                              <UserCheck size={14} /> {dictionary.restoreAdmin}
                            </button>
                          )}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {tab === "announcements" && (
          <div
            className="system-settings-group"
            style={{ display: "flex", flexDirection: "column", gap: "1rem" }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <h3 style={{ fontSize: "1rem", fontWeight: 600 }}>
                  {dictionary.announcementsTitle}
                </h3>
                <p style={{ fontSize: "0.8125rem", color: "var(--halo-text-muted)" }}>
                  向所有工作空间广播系统维护通知或重要更新。
                </p>
              </div>
              <button
                type="button"
                className="admin-primary-button compact"
                onClick={() => setAnnouncementDialogOpen(true)}
              >
                <Plus size={16} /> {dictionary.createAnnouncement}
              </button>
            </div>

            {announcements.length === 0 ? (
              <p style={{ color: "var(--halo-text-muted)", fontSize: "0.875rem" }}>
                暂无发布的系统公告。
              </p>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                {announcements.map((item) => (
                  <div
                    key={item.id}
                    style={{
                      padding: "1rem",
                      borderRadius: "var(--halo-radius-md)",
                      background: "var(--halo-bg-muted)",
                      border: "1px solid var(--halo-border)",
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "flex-start",
                    }}
                  >
                    <div>
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "0.5rem",
                          marginBottom: "0.25rem",
                        }}
                      >
                        <span
                          className={`admin-status-badge is-${item.level === "critical" ? "danger" : item.level === "warning" ? "warning" : "success"}`}
                        >
                          {item.level === "critical"
                            ? dictionary.levelCritical
                            : item.level === "warning"
                              ? dictionary.levelWarning
                              : dictionary.levelInfo}
                        </span>
                        <h4 style={{ fontWeight: 600 }}>{item.title}</h4>
                      </div>
                      <p style={{ fontSize: "0.875rem", color: "var(--halo-text)" }}>
                        {item.content}
                      </p>
                    </div>
                    <button
                      type="button"
                      className="icon-button tiny is-danger"
                      aria-label={dictionary.deleteAnnouncement}
                      onClick={() => void handleDeleteAnnouncement(item.id)}
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {(tab === "general" || tab === "authentication") && (
          <footer className="system-form-actions">
            <button
              type="button"
              className="admin-primary-button"
              disabled={saving || !dirty}
              onClick={() => void save()}
            >
              {dictionary.save}
            </button>
          </footer>
        )}
      </section>

      {/* 添加管理员弹窗 */}
      <HaloDialog
        open={adminDialogOpen}
        title={dictionary.addAdministrator}
        description="输入已有账户的工作邮箱将其指定为系统管理员。"
        icon={<UserCog size={18} />}
        onClose={() => setAdminDialogOpen(false)}
        closeLabel={dictionary.cancel}
        footer={
          <>
            <button
              type="button"
              className="secondary-button"
              onClick={() => setAdminDialogOpen(false)}
            >
              {dictionary.cancel}
            </button>
            <button
              type="submit"
              form="add-admin-form"
              className="primary-button"
              disabled={adminSubmitting || !newAdminEmail.trim()}
            >
              {adminSubmitting ? <LoaderCircle size={16} /> : null}
              {dictionary.save}
            </button>
          </>
        }
      >
        <form
          id="add-admin-form"
          className="organization-form"
          onSubmit={(event) => void handleAddAdministrator(event)}
        >
          <label>
            <span>{dictionary.adminEmail}</span>
            <input
              type="email"
              required
              value={newAdminEmail}
              onChange={(event) => setNewAdminEmail(event.target.value)}
              placeholder="admin@company.com"
            />
          </label>
        </form>
      </HaloDialog>

      {/* 创建系统公告弹窗 */}
      <HaloDialog
        open={announcementDialogOpen}
        title={dictionary.createAnnouncement}
        description="广播全局维护横幅或系统更新通知。"
        icon={<Bell size={18} />}
        onClose={() => setAnnouncementDialogOpen(false)}
        closeLabel={dictionary.cancel}
        footer={
          <>
            <button
              type="button"
              className="secondary-button"
              onClick={() => setAnnouncementDialogOpen(false)}
            >
              {dictionary.cancel}
            </button>
            <button
              type="submit"
              form="create-announcement-form"
              className="primary-button"
              disabled={
                announcementSubmitting || !announcementTitle.trim() || !announcementContent.trim()
              }
            >
              {announcementSubmitting ? <LoaderCircle size={16} /> : null}
              {dictionary.save}
            </button>
          </>
        }
      >
        <form
          id="create-announcement-form"
          className="organization-form"
          onSubmit={(event) => void handleCreateAnnouncement(event)}
        >
          <label>
            <span>{dictionary.announcementTitle}</span>
            <input
              required
              value={announcementTitle}
              onChange={(event) => setAnnouncementTitle(event.target.value)}
              maxLength={200}
            />
          </label>
          <label>
            <span>{dictionary.announcementLevel}</span>
            <HaloSelect
              value={announcementLevel}
              onValueChange={(val) => setAnnouncementLevel(val as "info" | "warning" | "critical")}
              ariaLabel={dictionary.announcementLevel}
              options={[
                { value: "info", label: dictionary.levelInfo },
                { value: "warning", label: dictionary.levelWarning },
                { value: "critical", label: dictionary.levelCritical },
              ]}
            />
          </label>
          <label>
            <span>{dictionary.announcementContent}</span>
            <textarea
              required
              rows={3}
              value={announcementContent}
              onChange={(event) => setAnnouncementContent(event.target.value)}
              maxLength={2000}
            />
          </label>
        </form>
      </HaloDialog>
    </div>
  );
}
