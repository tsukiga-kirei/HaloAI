"use client";

import { SystemSettingsSchema, type SystemSettings } from "@haloai/contracts";
import { Bot, Clock3, Globe2, RefreshCw, ShieldCheck } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { notify, notifyError } from "@/components/toast-host";
import { HaloSelect } from "@/components/ui/halo-select";
import { apiFetch } from "@/lib/api-client";
import type { SystemAdminDictionary } from "@/lib/system-admin-i18n";
import { SystemSectionState, SystemStatusBadge } from "./system-section-primitives";

type SettingsTab = "general" | "authentication" | "ai";

function formatDuration(seconds: number, dictionary: SystemAdminDictionary): string {
  if (seconds % 86_400 === 0) {
    return dictionary.days.replace("{count}", String(seconds / 86_400));
  }
  return dictionary.hours.replace("{count}", String(Math.round(seconds / 3_600)));
}

export function SystemSettingsSection({ dictionary }: { dictionary: SystemAdminDictionary }) {
  const [settings, setSettings] = useState<SystemSettings | null>(null);
  const [tab, setTab] = useState<SettingsTab>("general");
  const [locale, setLocale] = useState<"zh-CN" | "en-US">("zh-CN");
  const [failed, setFailed] = useState(false);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setFailed(false);
    try {
      const parsed = SystemSettingsSchema.parse(await apiFetch<unknown>("/v1/system/settings"));
      setSettings(parsed);
      setLocale(parsed.defaultLocale);
    } catch {
      setFailed(true);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function save(): Promise<void> {
    setSaving(true);
    try {
      await apiFetch<void>("/v1/system/settings", {
        method: "PATCH",
        body: JSON.stringify({ defaultLocale: locale }),
      });
      notify(dictionary.settingsSaved);
      await load();
    } catch {
      notifyError(dictionary.loadError, "system-settings-save-error");
    } finally {
      setSaving(false);
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

  const tabs = [
    { key: "general" as const, label: dictionary.generalTab, icon: Globe2 },
    { key: "authentication" as const, label: dictionary.authenticationTab, icon: ShieldCheck },
    { key: "ai" as const, label: dictionary.aiConversationTab, icon: Bot },
  ];

  return (
    <div className="system-settings-layout">
      <nav className="system-settings-tabs" aria-label={dictionary.settingsTitle}>
        {tabs.map((item) => {
          const Icon = item.icon;
          return (
            <button
              type="button"
              key={item.key}
              className={tab === item.key ? "is-active" : ""}
              aria-current={tab === item.key ? "page" : undefined}
              onClick={() => setTab(item.key)}
            >
              <Icon size={17} /> {item.label}
            </button>
          );
        })}
      </nav>

      <section className="system-settings-panel" data-motion="admin-item">
        {tab === "general" ? (
          <div className="system-settings-group">
            <div className="system-setting-row">
              <span className="system-list-icon is-violet">
                <Globe2 size={17} />
              </span>
              <span>
                <strong>{dictionary.defaultLocale}</strong>
              </span>
              <HaloSelect
                value={locale}
                compact
                ariaLabel={dictionary.defaultLocale}
                onValueChange={(value) => setLocale(value as "zh-CN" | "en-US")}
                options={[
                  { value: "zh-CN", label: dictionary.simplifiedChinese },
                  { value: "en-US", label: dictionary.english },
                ]}
              />
            </div>
            <footer className="system-form-actions">
              <button
                type="button"
                className="admin-primary-button"
                disabled={saving || locale === settings.defaultLocale}
                onClick={() => void save()}
              >
                {dictionary.save}
              </button>
            </footer>
          </div>
        ) : null}

        {tab === "authentication" ? (
          <div className="system-auth-grid">
            <article>
              <span>
                <ShieldCheck size={18} />
              </span>
              <small>{dictionary.sessionMode}</small>
              <strong>{dictionary.databaseSession}</strong>
            </article>
            <article>
              <span>
                <Clock3 size={18} />
              </span>
              <small>{dictionary.cookieLifetime}</small>
              <strong>
                {formatDuration(settings.authentication.sessionExpiresInSeconds, dictionary)}
              </strong>
            </article>
            <article>
              <span>
                <RefreshCw size={18} />
              </span>
              <small>{dictionary.renewalInterval}</small>
              <strong>
                {formatDuration(settings.authentication.sessionUpdateAgeSeconds, dictionary)}
              </strong>
            </article>
            <article>
              <span>
                <RefreshCw size={18} />
              </span>
              <small>{dictionary.slidingRenewal}</small>
              <SystemStatusBadge tone="success">{dictionary.enabled}</SystemStatusBadge>
            </article>
          </div>
        ) : null}

        {tab === "ai" ? (
          <SystemSectionState kind="empty" label={dictionary.aiSettingsReserved} />
        ) : null}
      </section>
    </div>
  );
}
