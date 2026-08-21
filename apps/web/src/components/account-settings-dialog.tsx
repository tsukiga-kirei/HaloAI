"use client";

import type { SessionContext, WorkspaceSummary } from "@haloai/contracts";
import { IdCard, ShieldCheck } from "lucide-react";
import { type FormEvent, useEffect, useState } from "react";
import { notify, notifyError } from "@/components/toast-host";
import { HaloDialog } from "@/components/ui/halo-dialog";
import { HaloSegmented } from "@/components/ui/halo-segmented";
import { apiFetch } from "@/lib/api-client";

type AccountTab = "profile" | "session";

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
    tabSession: string;
    email: string;
    displayName: string;
    workspace: string;
    role: string;
    sessionProtected: string;
    saved: string;
    saveError: string;
    nameRequired: string;
    save: string;
    cancel: string;
    owner: string;
    admin: string;
    member: string;
    guest: string;
  };
  onSaved?: ((name: string) => void) | undefined;
}) {
  const [name, setName] = useState(session?.user.name ?? "");
  const [tab, setTab] = useState<AccountTab>("profile");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (open) {
      setName(session?.user.name ?? "");
      setTab("profile");
    }
  }, [open, session?.user.name]);

  const roleLabel = {
    owner: labels.owner,
    admin: labels.admin,
    member: labels.member,
    guest: labels.guest,
  } as const;

  async function save(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    const nextName = name.trim();
    if (!nextName) {
      notifyError(labels.nameRequired, "account-name-required");
      return;
    }
    setSubmitting(true);
    try {
      await apiFetch("/v1/session/profile", {
        method: "PATCH",
        body: JSON.stringify({ name: nextName }),
      });
      notify(labels.saved);
      onSaved?.(nextName);
      onClose();
    } catch {
      notifyError(labels.saveError, "account-profile-error");
    } finally {
      setSubmitting(false);
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
        <>
          <button type="button" className="secondary-button" onClick={onClose}>
            {labels.cancel}
          </button>
          <button
            type="submit"
            form="account-settings-form"
            className="primary-button"
            disabled={submitting}
          >
            {labels.save}
          </button>
        </>
      }
    >
      <HaloSegmented
        ariaLabel={labels.title}
        value={tab}
        onChange={setTab}
        items={[
          { value: "profile", label: labels.tabProfile, icon: IdCard },
          { value: "session", label: labels.tabSession, icon: ShieldCheck },
        ]}
      />
      <form
        id="account-settings-form"
        className="account-settings-form"
        onSubmit={(event) => void save(event)}
      >
        {tab === "profile" ? (
          <>
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
          </>
        ) : (
          <>
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
          </>
        )}
      </form>
    </HaloDialog>
  );
}
