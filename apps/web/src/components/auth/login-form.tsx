"use client";

import {
  Eye,
  EyeOff,
  Languages,
  LayoutDashboard,
  LoaderCircle,
  LockKeyhole,
  Mail,
  Settings2,
  Shield,
  ShieldCheck,
} from "lucide-react";
import type { Route } from "next";
import { useRouter, useSearchParams } from "next/navigation";
import { type FormEvent, useEffect, useState } from "react";
import { HaloMark } from "@/components/workspace/primitives";
import { persistPortal, portalPath, type PortalKey } from "@/lib/portals";
import { getApiBaseUrl } from "@/lib/api-client";
import { FieldError } from "@/components/ui/field-error";
import { HaloSegmented } from "@/components/ui/halo-segmented";
import { authCopy, type AuthLocale } from "./auth-copy";
import styles from "./auth-shell.module.css";

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

function looksLikeEmail(value: string): boolean {
  // 登录页禁止浏览器原生气泡，邮箱格式只在提交时由产品浮层提示。
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [locale, setLocale] = useState<AuthLocale>("zh-CN");
  const [portal, setPortal] = useState<PortalKey>("member");
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldError, setFieldError] = useState<"email" | "password" | null>(null);
  const copy = authCopy[locale];
  const activePortal = portals.find((item) => item.key === portal) ?? fallbackPortal;
  const ActiveIcon = activePortal.icon;

  useEffect(() => {
    const saved = window.localStorage.getItem("haloai.locale");
    if (saved === "zh-CN" || saved === "en-US") setLocale(saved);
  }, []);

  useEffect(() => {
    setFieldError(null);
    setError(null);
  }, [portal]);

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
    setFieldError(null);
    const data = new FormData(event.currentTarget);
    const email = String(data.get("email") ?? "").trim();
    const password = String(data.get("password") ?? "");
    if (email.length === 0 || !looksLikeEmail(email)) {
      setFieldError("email");
      setSubmitting(false);
      return;
    }
    if (password.length < 10) {
      setFieldError("password");
      setSubmitting(false);
      return;
    }
    try {
      const response = await fetch(`${getApiBaseUrl()}/api/auth/sign-in/email`, {
        method: "POST",
        credentials: "include",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      if (!response.ok) {
        setError(copy.invalid);
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
        <div className={styles.formCard} data-portal={portal}>
          <h2>{copy.welcome}</h2>
          <p className={styles.formLead}>{copy.welcomeDetail}</p>
          <HaloSegmented
            fill
            ariaLabel={copy.selectIdentity}
            value={portal}
            items={portals.map((item) => ({
              value: item.key,
              label: copy[item.label],
              icon: item.icon,
            }))}
            onChange={(next) => {
              setPortal(next);
            }}
          />
          <p className={styles.portalDesc}>
            <span className={`${styles.portalDot} ${styles[`dot-${portal}`]}`} />
            {copy[activePortal.description]}
          </p>
          <form className={styles.form} noValidate onSubmit={(event) => void submit(event)}>
            <label className={styles.field}>
              <span>{copy.email}</span>
              <FieldError open={fieldError === "email"} message={copy.emailInvalid}>
                <div className={styles.inputWrap}>
                  <Mail size={16} />
                  <input
                    name="email"
                    type="text"
                    inputMode="email"
                    autoComplete="email"
                    maxLength={320}
                    placeholder={copy.emailPlaceholder}
                    onChange={() => setFieldError(null)}
                  />
                </div>
              </FieldError>
            </label>
            <label className={styles.field}>
              <span>{copy.password}</span>
              <FieldError open={fieldError === "password"} message={copy.passwordRequired}>
                <div className={styles.inputWrap}>
                  <LockKeyhole size={16} />
                  <input
                    name="password"
                    type={showPassword ? "text" : "password"}
                    autoComplete="current-password"
                    maxLength={128}
                    placeholder={copy.passwordPlaceholder}
                    onChange={() => setFieldError(null)}
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
              </FieldError>
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
        </div>
      </section>
    </main>
  );
}
