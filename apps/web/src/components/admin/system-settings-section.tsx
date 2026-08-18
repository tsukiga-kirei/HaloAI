"use client";

import {
  SESSION_EXPIRES_IN_SECONDS_OPTIONS,
  SESSION_UPDATE_AGE_SECONDS_OPTIONS,
  SystemSettingsSchema,
  type SystemSettings,
} from "@haloai/contracts";
import { Clock3, Globe2, Languages, RefreshCw, ShieldCheck } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { notify, notifyError } from "@/components/toast-host";
import { HaloChoicePills } from "@/components/ui/halo-choice-pills";
import { HaloSegmented } from "@/components/ui/halo-segmented";
import { apiFetch } from "@/lib/api-client";
import { useSystemAdminDictionary } from "@/lib/use-system-admin-dictionary";
import {
  SystemFormField,
  SystemSectionState,
  SystemStatusBadge,
} from "./system-section-primitives";

type SettingsTab = "general" | "authentication";

export function SystemSettingsSection() {
  const { dictionary } = useSystemAdminDictionary();
  const [settings, setSettings] = useState<SystemSettings | null>(null);
  const [tab, setTab] = useState<SettingsTab>("general");
  const [locale, setLocale] = useState<"zh-CN" | "en-US">("zh-CN");
  const [sessionExpiresInSeconds, setSessionExpiresInSeconds] = useState(604_800);
  const [sessionUpdateAgeSeconds, setSessionUpdateAgeSeconds] = useState(86_400);
  const [slidingRenewal, setSlidingRenewal] = useState(true);
  const [failed, setFailed] = useState(false);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setFailed(false);
    try {
      const parsed = SystemSettingsSchema.parse(await apiFetch<unknown>("/v1/system/settings"));
      setSettings(parsed);
      setLocale(parsed.defaultLocale);
      setSessionExpiresInSeconds(parsed.authentication.sessionExpiresInSeconds);
      setSessionUpdateAgeSeconds(parsed.authentication.sessionUpdateAgeSeconds);
      setSlidingRenewal(parsed.authentication.slidingRenewal);
    } catch {
      setFailed(true);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

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
        ]}
      />

      <section className="system-settings-panel" data-motion="admin-item">
        {tab === "general" ? (
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
        ) : (
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
      </section>
    </div>
  );
}
