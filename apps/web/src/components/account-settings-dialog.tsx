"use client";

import type { Locale } from "@/lib/i18n";
import type { SessionContext, WorkspaceSummary } from "@haloai/contracts";
import { IdCard, KeyRound, LockKeyhole, ShieldCheck } from "lucide-react";
import { type FormEvent, useEffect, useState } from "react";
import { notify, notifyError } from "@/components/toast-host";
import { HaloDialog } from "@/components/ui/halo-dialog";
import { HaloSegmented } from "@/components/ui/halo-segmented";
import { HaloSelect } from "@/components/ui/halo-select";
import { apiFetch } from "@/lib/api-client";

type AccountTab = "profile" | "security" | "session";

const timeZoneOptions = [
  { value: "Asia/Shanghai", label: "Asia/Shanghai (UTC+8 北京/上海)" },
  { value: "Asia/Tokyo", label: "Asia/Tokyo (UTC+9 东京)" },
  { value: "Asia/Singapore", label: "Asia/Singapore (UTC+8 新加坡)" },
  { value: "Europe/London", label: "Europe/London (UTC+0/1 伦敦)" },
  { value: "Europe/Paris", label: "Europe/Paris (UTC+1/2 巴黎/柏林)" },
  { value: "America/New_York", label: "America/New_York (UTC-5/4 纽约)" },
  { value: "America/Los_Angeles", label: "America/Los_Angeles (UTC-8/7 洛杉矶)" },
  { value: "UTC", label: "UTC (协调世界时)" },
];

export function AccountSettingsDialog({
  open,
  onClose,
  session,
  workspace,
  labels,
  onSaved,
}: {
  open: boolean;
  onClose: () => void;
  session: SessionContext | null;
  workspace?: WorkspaceSummary | undefined;
  labels: {
    title: string;
    description: string;
    tabProfile: string;
    tabSecurity?: string;
    tabSession: string;
    email: string;
    displayName: string;
    language?: string;
    timeZone?: string;
    workspace: string;
    role: string;
    sessionProtected: string;
    saved: string;
    saveError: string;
    nameRequired: string;
    save: string;
    cancel: string;
    currentPassword?: string;
    newPassword?: string;
    confirmPassword?: string;
    passwordLengthHint?: string;
    passwordMismatch?: string;
    passwordChanged?: string;
    passwordChangeError?: string;
    currentPasswordRequired?: string;
    newPasswordRequired?: string;
    changePasswordButton?: string;
    owner: string;
    admin: string;
    member: string;
    guest: string;
  };
  onSaved?: ((name: string, locale?: Locale, timeZone?: string) => void) | undefined;
}) {
  const [name, setName] = useState(session?.user.name ?? "");
  const [locale, setLocale] = useState<Locale>(session?.user.locale ?? "zh-CN");
  const [timeZone, setTimeZone] = useState(session?.user.timeZone ?? "Asia/Shanghai");
  const [tab, setTab] = useState<AccountTab>("profile");
  const [submittingProfile, setSubmittingProfile] = useState(false);

  // 密码修改表单状态
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [submittingPassword, setSubmittingPassword] = useState(false);

  useEffect(() => {
    if (open) {
      setName(session?.user.name ?? "");
      setLocale(session?.user.locale ?? "zh-CN");
      setTimeZone(session?.user.timeZone ?? "Asia/Shanghai");
      setTab("profile");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    }
  }, [open, session]);

  const roleLabel = {
    owner: labels.owner,
    admin: labels.admin,
    member: labels.member,
    guest: labels.guest,
  } as const;

  async function saveProfile(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    const nextName = name.trim();
    if (!nextName) {
      notifyError(labels.nameRequired, "account-name-required");
      return;
    }
    setSubmittingProfile(true);
    try {
      await apiFetch("/v1/session/profile", {
        method: "PATCH",
        body: JSON.stringify({
          name: nextName,
          preferredLocale: locale,
          timeZone,
        }),
      });
      notify(labels.saved);
      onSaved?.(nextName, locale, timeZone);
      onClose();
    } catch {
      notifyError(labels.saveError, "account-profile-error");
    } finally {
      setSubmittingProfile(false);
    }
  }

  async function changePassword(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    if (!currentPassword) {
      notifyError(labels.currentPasswordRequired ?? "请输入当前密码", "current-password-required");
      return;
    }
    if (!newPassword || newPassword.length < 10) {
      notifyError(labels.passwordLengthHint ?? "新密码长度至少 10 位", "new-password-too-short");
      return;
    }
    if (newPassword !== confirmPassword) {
      notifyError(labels.passwordMismatch ?? "两次输入的新密码不一致", "password-mismatch");
      return;
    }
    setSubmittingPassword(true);
    try {
      await apiFetch("/v1/session/change-password", {
        method: "POST",
        body: JSON.stringify({
          currentPassword,
          newPassword,
          revokeOtherSessions: true,
        }),
      });
      notify(labels.passwordChanged ?? "密码已成功修改");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setTab("profile");
    } catch {
      notifyError(
        labels.passwordChangeError ?? "密码修改失败，请检查当前密码",
        "change-password-failed",
      );
    } finally {
      setSubmittingPassword(false);
    }
  }

  return (
    <HaloDialog
      open={open}
      title={labels.title}
      description={labels.description}
      icon={<ShieldCheck size={18} />}
      onClose={onClose}
      closeLabel={labels.cancel}
      footer={
        tab === "profile" ? (
          <>
            <button type="button" className="secondary-button" onClick={onClose}>
              {labels.cancel}
            </button>
            <button
              type="submit"
              form="account-settings-form"
              className="primary-button"
              disabled={submittingProfile}
            >
              {labels.save}
            </button>
          </>
        ) : (
          <button type="button" className="secondary-button" onClick={onClose}>
            {labels.cancel}
          </button>
        )
      }
    >
      <HaloSegmented
        ariaLabel={labels.title}
        value={tab}
        onChange={setTab}
        items={[
          { value: "profile", label: labels.tabProfile, icon: IdCard },
          {
            value: "security",
            label: labels.tabSecurity ?? "安全与密码",
            icon: LockKeyhole,
          },
          { value: "session", label: labels.tabSession, icon: ShieldCheck },
        ]}
      />

      {tab === "profile" && (
        <form
          id="account-settings-form"
          className="account-settings-form"
          onSubmit={(event) => void saveProfile(event)}
        >
          <label>
            <span>{labels.displayName}</span>
            <input
              value={name}
              onChange={(event) => setName(event.target.value)}
              maxLength={120}
              required
            />
          </label>
          <label>
            <span>{labels.email}</span>
            <input value={session?.user.email ?? ""} readOnly />
          </label>
          <label>
            <span>{labels.language ?? "界面语言"}</span>
            <HaloSelect
              value={locale}
              onValueChange={(val) => setLocale(val as Locale)}
              ariaLabel={labels.language ?? "界面语言"}
              options={[
                { value: "zh-CN", label: "简体中文" },
                { value: "en-US", label: "English" },
              ]}
            />
          </label>
          <label>
            <span>{labels.timeZone ?? "时区"}</span>
            <HaloSelect
              value={timeZone}
              onValueChange={setTimeZone}
              ariaLabel={labels.timeZone ?? "时区"}
              options={timeZoneOptions}
            />
          </label>
        </form>
      )}

      {tab === "security" && (
        <form
          id="account-password-form"
          className="account-settings-form"
          onSubmit={(event) => void changePassword(event)}
        >
          <label>
            <span>{labels.currentPassword ?? "当前密码"}</span>
            <input
              type="password"
              autoComplete="current-password"
              value={currentPassword}
              onChange={(event) => setCurrentPassword(event.target.value)}
              required
            />
          </label>
          <label>
            <span>{labels.newPassword ?? "新密码"}</span>
            <input
              type="password"
              autoComplete="new-password"
              value={newPassword}
              minLength={10}
              onChange={(event) => setNewPassword(event.target.value)}
              required
            />
            <small style={{ color: "var(--halo-text-muted)", fontSize: "0.8125rem" }}>
              {labels.passwordLengthHint ?? "密码至少包含 10 个字符"}
            </small>
          </label>
          <label>
            <span>{labels.confirmPassword ?? "确认新密码"}</span>
            <input
              type="password"
              autoComplete="new-password"
              value={confirmPassword}
              minLength={10}
              onChange={(event) => setConfirmPassword(event.target.value)}
              required
            />
          </label>
          <div style={{ display: "flex", justifyContent: "flex-end", marginTop: "1rem" }}>
            <button type="submit" className="primary-button" disabled={submittingPassword}>
              <KeyRound size={16} />
              {labels.changePasswordButton ?? "更新密码"}
            </button>
          </div>
        </form>
      )}

      {tab === "session" && (
        <div className="account-settings-form">
          <label>
            <span>{labels.workspace}</span>
            <input value={workspace?.name ?? "—"} readOnly />
          </label>
          <label>
            <span>{labels.role}</span>
            <input value={workspace ? roleLabel[workspace.role] : "—"} readOnly />
          </label>
          <p className="security-note">
            <ShieldCheck size={16} /> {labels.sessionProtected}
          </p>
        </div>
      )}
    </HaloDialog>
  );
}
