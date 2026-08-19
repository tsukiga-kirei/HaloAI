"use client";

import {
  SystemTenantInvitationInfoSchema,
  type SessionContext,
  type SystemTenantInvitationInfo,
} from "@haloai/contracts";
import {
  ArrowRight,
  Building2,
  Check,
  KeyRound,
  LoaderCircle,
  Mail,
  UserRound,
} from "lucide-react";
import Link from "next/link";
import type { Route } from "next";
import { useParams, useRouter } from "next/navigation";
import { type FormEvent, useEffect, useState } from "react";
import { apiFetch, ApiClientError, getApiBaseUrl } from "@/lib/api-client";
import { useShellPreferences } from "@/lib/shell-preferences";
import { tenantActivationDictionaries } from "@/lib/tenant-activation-i18n";
import styles from "./auth-shell.module.css";

type ActivationState = "loading" | "ready" | "activating" | "done" | "invalid" | "error";

export function TenantAdministratorActivation() {
  const params = useParams<{ token?: string }>();
  const token = params.token;
  const router = useRouter();
  const { locale } = useShellPreferences();
  const copy = tenantActivationDictionaries[locale];
  const [state, setState] = useState<ActivationState>("loading");
  const [invitation, setInvitation] = useState<SystemTenantInvitationInfo | null>(null);
  const [session, setSession] = useState<SessionContext | null>(null);
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");

  useEffect(() => {
    if (!token) {
      setState("invalid");
      return;
    }
    void (async () => {
      try {
        const payload = await apiFetch<unknown>(`/v1/system/tenant-invitations/${token}`);
        setInvitation(SystemTenantInvitationInfoSchema.parse(payload));
        try {
          setSession(await apiFetch<SessionContext>("/v1/session"));
        } catch (caught) {
          if (!(caught instanceof ApiClientError && caught.status === 401)) throw caught;
        }
        setState("ready");
      } catch {
        setState("invalid");
      }
    })();
  }, [token]);

  async function accept(): Promise<void> {
    if (!token) return;
    const result = await apiFetch<{ workspaceId: string }>("/v1/system/tenant-invitations/accept", {
      method: "POST",
      body: JSON.stringify({ token }),
    });
    window.localStorage.setItem("haloai.workspaceId", result.workspaceId);
    setState("done");
    window.setTimeout(() => {
      router.replace("/app" as Route);
      router.refresh();
    }, 700);
  }

  async function registerAndActivate(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    if (!invitation || name.trim().length < 2 || password.length < 10) {
      setState("error");
      return;
    }
    setState("activating");
    try {
      const response = await fetch(`${getApiBaseUrl()}/api/auth/sign-up/email`, {
        method: "POST",
        credentials: "include",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          email: invitation.administratorEmail,
          name: name.trim(),
          password,
        }),
      });
      if (!response.ok) throw new Error("sign_up_failed");
      await accept();
    } catch {
      setState("error");
    }
  }

  const emailMatches =
    session && invitation
      ? session.user.email.toLocaleLowerCase() === invitation.administratorEmail.toLocaleLowerCase()
      : false;
  const description = invitation ? copy.description.replace("{tenant}", invitation.tenantName) : "";

  return (
    <main className={styles.statusPage}>
      <section className={`${styles.statusCard} ${styles.activationCard}`}>
        <span className={styles.statusIcon}>
          {state === "done" ? <Check size={23} /> : <Building2 size={23} />}
        </span>
        <h1>{copy.title}</h1>
        {state === "loading" ? (
          <div className={styles.loadingMark}>
            <LoaderCircle size={19} /> {copy.loading}
          </div>
        ) : state === "invalid" ? (
          <p>{copy.invalid}</p>
        ) : state === "done" ? (
          <p>{copy.completed}</p>
        ) : (
          <>
            <p>{description}</p>
            {session ? (
              <div className={styles.activationSession}>
                <strong>{copy.signedInAs.replace("{email}", session.user.email)}</strong>
                {emailMatches ? (
                  <>
                    <button
                      type="button"
                      className={styles.primaryButton}
                      disabled={state === "activating"}
                      onClick={() => {
                        setState("activating");
                        void accept().catch(() => setState("error"));
                      }}
                    >
                      {state === "activating" ? <LoaderCircle size={16} /> : <KeyRound size={16} />}
                      {state === "activating" ? copy.activating : copy.activate}
                    </button>
                    {state === "error" ? <p className={styles.error}>{copy.genericError}</p> : null}
                  </>
                ) : (
                  <p className={styles.error}>{copy.wrongAccount}</p>
                )}
              </div>
            ) : (
              <form className={styles.activationForm} noValidate onSubmit={registerAndActivate}>
                <label className={styles.field}>
                  <span>{copy.email}</span>
                  <span className={styles.inputWrap}>
                    <Mail size={17} />
                    <input value={invitation?.administratorEmail ?? ""} readOnly />
                  </span>
                </label>
                <label className={styles.field}>
                  <span>{copy.name}</span>
                  <span className={styles.inputWrap}>
                    <UserRound size={17} />
                    <input
                      value={name}
                      maxLength={120}
                      onChange={(event) => setName(event.target.value)}
                    />
                  </span>
                </label>
                <label className={styles.field}>
                  <span>{copy.password}</span>
                  <small className={styles.fieldHint}>{copy.passwordHint}</small>
                  <span className={styles.inputWrap}>
                    <KeyRound size={17} />
                    <input
                      type="password"
                      value={password}
                      minLength={10}
                      maxLength={128}
                      autoComplete="new-password"
                      onChange={(event) => setPassword(event.target.value)}
                    />
                  </span>
                </label>
                {state === "error" ? <p className={styles.error}>{copy.genericError}</p> : null}
                <button type="submit" className={styles.submit} disabled={state === "activating"}>
                  {state === "activating" ? <LoaderCircle size={17} /> : <ArrowRight size={17} />}
                  {state === "activating" ? copy.activating : copy.activate}
                </button>
                <Link
                  className={styles.textLink}
                  href={`/login?next=${encodeURIComponent(`/tenant-activate/${token}`)}`}
                >
                  {copy.signInInstead}
                </Link>
              </form>
            )}
          </>
        )}
      </section>
    </main>
  );
}
