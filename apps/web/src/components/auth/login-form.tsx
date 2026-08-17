"use client";

import {
  Eye,
  EyeOff,
  Languages,
  LayoutDashboard,
  LoaderCircle,
  LockKeyhole,
  LogIn,
  Mail,
  Settings2,
  Shield,
  ShieldCheck,
  UserRound,
} from "lucide-react";
import type { Route } from "next";
import { useRouter, useSearchParams } from "next/navigation";
import { type FormEvent, useEffect, useState } from "react";
import { HaloMark } from "@/components/workspace/primitives";
import { persistPortal, portalPath, type PortalKey } from "@/lib/portals";
import { getApiBaseUrl } from "@/lib/api-client";
import { authCopy, type AuthLocale } from "./auth-copy";
import styles from "./auth-shell.module.css";

type AuthMode = "sign-in" | "sign-up";

const fallbackPortal = {
  key: "member" as const,
  icon: LayoutDashboard,
  label: "portalMember" as const,
  description: "portalMemberDesc" as const,
};
const portals = [
  fallbackPortal,
  {
    key: "workspace_admin" as const,
    icon: Settings2,
    label: "portalWorkspace" as const,
    description: "portalWorkspaceDesc" as const,
  },
  {
    key: "system_admin" as const,
    icon: Shield,
    label: "portalSystem" as const,
    description: "portalSystemDesc" as const,
  },
];

export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [locale, setLocale] = useState<AuthLocale>("zh-CN");
  const [mode, setMode] = useState<AuthMode>("sign-in");
  const [portal, setPortal] = useState<PortalKey>("member");
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const copy = authCopy[locale];
  const demoMode = process.env.NEXT_PUBLIC_AUTH_MODE === "demo";
  const activePortal = portals.find((item) => item.key === portal) ?? fallbackPortal;
  const ActiveIcon = activePortal.icon;

  useEffect(() => {
    const saved = window.localStorage.getItem("haloai.locale");
    if (saved === "zh-CN" || saved === "en-US") setLocale(saved);
  }, []);

  function changeMode(nextMode: AuthMode): void {
    setMode(nextMode);
    setError(null);
  }

  function enterWorkspace(): void {
    persistPortal(portal);
    const requestedNext = searchParams.get("next");
    const safeNext =
      requestedNext?.startsWith("/") && !requestedNext.startsWith("//")
        ? requestedNext
        : portalPath(portal);
    router.replace(safeNext as Route);
    router.refresh();
  }

  async function submit(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    setSubmitting(true);
    setError(null);
    if (demoMode) {
      enterWorkspace();
      setSubmitting(false);
      return;
    }
    const data = new FormData(event.currentTarget);
    const email = String(data.get("email") ?? "").trim();
    const password = String(data.get("password") ?? "");
    const name = String(data.get("name") ?? "").trim();
    try {
      const endpoint = mode === "sign-in" ? "/api/auth/sign-in/email" : "/api/auth/sign-up/email";
      const response = await fetch(`${getApiBaseUrl()}${endpoint}`, {
        method: "POST",
        credentials: "include",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(mode === "sign-in" ? { email, password } : { name, email, password }),
      });
      if (!response.ok) {
        const payload = (await response.json().catch(() => null)) as { code?: string } | null;
        setError(payload?.code?.includes("USER_ALREADY_EXISTS") ? copy.duplicate : copy.invalid);
        return;
      }
      enterWorkspace();
    } catch {
      setError(copy.generic);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className={styles.authShell}>
      <section className={styles.storyPanel} aria-label={copy.eyebrow}>
        <div className={styles.storyInner}>
          <div className={styles.brand}>
            <HaloMark size="brand" />
            <strong>HaloAI</strong>
          </div>
          <div className={styles.storyCopy}>
            <span className={styles.eyebrow}>{copy.eyebrow}</span>
            <h1>{copy.title}</h1>
            <p>{copy.description}</p>
            <ul className={styles.benefits}>
              {copy.benefits.map((benefit) => (
                <li key={benefit}>
                  <span className={styles.benefitIcon}>
                    <ShieldCheck size={16} />
                  </span>
                  {benefit}
                </li>
              ))}
            </ul>
          </div>
          <small className={styles.storyFooter}>HaloAI · Teams and AI, working as one</small>
        </div>
      </section>

      <section className={styles.formPanel}>
        <button
          type="button"
          className={styles.languageButton}
          onClick={() => {
            const next = locale === "zh-CN" ? "en-US" : "zh-CN";
            setLocale(next);
            window.localStorage.setItem("haloai.locale", next);
            document.documentElement.lang = next;
          }}
        >
          <Languages size={16} /> {copy.language}
        </button>
        <div className={styles.formCard}>
          <h2>{mode === "sign-in" ? copy.welcome : copy.createTitle}</h2>
          <p className={styles.formLead}>
            {mode === "sign-in" ? copy.welcomeDetail : copy.createDetail}
          </p>
          <div className={styles.tabs} role="tablist">
            <button
              type="button"
              role="tab"
              aria-selected={mode === "sign-in"}
              className={mode === "sign-in" ? styles.activeTab : ""}
              onClick={() => changeMode("sign-in")}
            >
              <LogIn size={15} /> {copy.signIn}
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={mode === "sign-up"}
              className={mode === "sign-up" ? styles.activeTab : ""}
              onClick={() => changeMode("sign-up")}
            >
              <UserRound size={15} /> {copy.signUp}
            </button>
          </div>
          <div className={styles.portalSelector} role="radiogroup" aria-label={copy.selectIdentity}>
            {portals.map((item) => {
              const Icon = item.icon;
              const selected = item.key === portal;
              return (
                <button
                  type="button"
                  role="radio"
                  aria-checked={selected}
                  className={selected ? styles.portalActive : styles.portalPill}
                  key={item.key}
                  onClick={() => setPortal(item.key)}
                >
                  <Icon size={15} />
                  {copy[item.label]}
                </button>
              );
            })}
          </div>
          <p className={styles.portalDesc}>
            <span className={`${styles.portalDot} ${styles[`dot-${portal}`]}`} />
            {copy[activePortal.description]}
          </p>
          <form className={styles.form} onSubmit={(event) => void submit(event)}>
            {mode === "sign-up" ? (
              <label className={styles.field}>
                <span>{copy.name}</span>
                <div className={styles.inputWrap}>
                  <UserRound size={16} />
                  <input
                    name="name"
                    type="text"
                    autoComplete="name"
                    minLength={1}
                    maxLength={120}
                    required
                    placeholder={copy.namePlaceholder}
                  />
                </div>
              </label>
            ) : null}
            <label className={styles.field}>
              <span>{copy.email}</span>
              <div className={styles.inputWrap}>
                <Mail size={16} />
                <input
                  name="email"
                  type="email"
                  autoComplete="email"
                  maxLength={320}
                  required={!demoMode}
                  placeholder={copy.emailPlaceholder}
                />
              </div>
            </label>
            <label className={styles.field}>
              <span>{copy.password}</span>
              <div className={styles.inputWrap}>
                <LockKeyhole size={16} />
                <input
                  name="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete={mode === "sign-in" ? "current-password" : "new-password"}
                  minLength={demoMode ? 0 : 10}
                  maxLength={128}
                  required={!demoMode}
                  placeholder={copy.passwordPlaceholder}
                />
                <button
                  type="button"
                  className={styles.passwordToggle}
                  onClick={() => setShowPassword((current) => !current)}
                  aria-label={showPassword ? copy.hidePassword : copy.showPassword}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </label>
            {error ? (
              <p className={styles.error} role="alert">
                {error}
              </p>
            ) : null}
            <button type="submit" className={styles.submit} disabled={submitting}>
              {submitting ? (
                <LoaderCircle size={18} className={styles.loadingMark} />
              ) : (
                <ActiveIcon size={18} />
              )}
              {submitting
                ? copy.working
                : copy.submitAs.replace("{role}", copy[activePortal.label])}
            </button>
          </form>
          <p className={styles.securityNote}>
            <ShieldCheck size={16} />
            {copy.security}
          </p>
        </div>
      </section>
    </main>
  );
}
