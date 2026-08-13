"use client";

import { Check, Eye, EyeOff, Languages, LoaderCircle, ShieldCheck } from "lucide-react";
import type { Route } from "next";
import { useRouter, useSearchParams } from "next/navigation";
import { type FormEvent, useEffect, useState } from "react";
import { HaloMark } from "@/components/workspace/primitives";
import { getApiBaseUrl } from "@/lib/api-client";
import { authCopy, type AuthLocale } from "./auth-copy";
import styles from "./auth-shell.module.css";

type AuthMode = "sign-in" | "sign-up";

export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [locale, setLocale] = useState<AuthLocale>("zh-CN");
  const [mode, setMode] = useState<AuthMode>("sign-in");
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const copy = authCopy[locale];

  useEffect(() => {
    const saved = window.localStorage.getItem("haloai.locale");
    if (saved === "zh-CN" || saved === "en-US") setLocale(saved);
  }, []);

  function changeMode(nextMode: AuthMode): void {
    setMode(nextMode);
    setError(null);
  }

  async function submit(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    setSubmitting(true);
    setError(null);
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
      const requestedNext = searchParams.get("next");
      const safeNext =
        requestedNext?.startsWith("/") && !requestedNext.startsWith("//") ? requestedNext : "/app";
      router.replace(safeNext as Route);
      router.refresh();
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
            <HaloMark />
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
                    <Check size={16} />
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
              {copy.signIn}
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={mode === "sign-up"}
              className={mode === "sign-up" ? styles.activeTab : ""}
              onClick={() => changeMode("sign-up")}
            >
              {copy.signUp}
            </button>
          </div>
          <form className={styles.form} onSubmit={(event) => void submit(event)}>
            {mode === "sign-up" ? (
              <label className={styles.field}>
                <span>{copy.name}</span>
                <input
                  name="name"
                  type="text"
                  autoComplete="name"
                  minLength={1}
                  maxLength={120}
                  required
                  placeholder={copy.namePlaceholder}
                />
              </label>
            ) : null}
            <label className={styles.field}>
              <span>{copy.email}</span>
              <input
                name="email"
                type="email"
                autoComplete="email"
                maxLength={320}
                required
                placeholder={copy.emailPlaceholder}
              />
            </label>
            <label className={styles.field}>
              <span>{copy.password}</span>
              <div className={styles.passwordWrap}>
                <input
                  name="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete={mode === "sign-in" ? "current-password" : "new-password"}
                  minLength={10}
                  maxLength={128}
                  required
                  placeholder={copy.passwordPlaceholder}
                />
                <button
                  type="button"
                  className={styles.passwordToggle}
                  onClick={() => setShowPassword((current) => !current)}
                  aria-label={showPassword ? "隐藏密码" : "显示密码"}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
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
                <>
                  <LoaderCircle size={18} className={styles.loadingMark} />
                  {copy.working}
                </>
              ) : mode === "sign-in" ? (
                copy.submitSignIn
              ) : (
                copy.submitSignUp
              )}
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
