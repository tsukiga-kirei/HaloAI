"use client";

import { ArrowLeft, Languages, LockKeyhole, Moon, ShieldCheck, Sun } from "lucide-react";
import type { Route } from "next";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { HaloMark } from "@/components/workspace/primitives";
import type { Theme } from "@/components/workspace/types";
import { adminDictionaries } from "@/lib/admin-i18n";
import type { Locale } from "@/lib/i18n";

export function RestrictedSurface({
  kind,
  variant = "page",
}: {
  kind: "workspace" | "system";
  variant?: "page" | "panel";
}) {
  const [locale, setLocale] = useState<Locale>("zh-CN");
  const [theme, setTheme] = useState<Theme>("light");
  const [preferencesReady, setPreferencesReady] = useState(false);
  const dictionary = useMemo(() => adminDictionaries[locale], [locale]);

  useEffect(() => {
    const savedLocale = window.localStorage.getItem("haloai.locale");
    const savedTheme = window.localStorage.getItem("haloai.theme");
    if (savedLocale === "zh-CN" || savedLocale === "en-US") setLocale(savedLocale);
    if (savedTheme === "light" || savedTheme === "dark") setTheme(savedTheme);
    setPreferencesReady(true);
  }, []);

  useEffect(() => {
    if (!preferencesReady) return;
    document.documentElement.lang = locale;
    document.documentElement.dataset.theme = theme;
    window.localStorage.setItem("haloai.locale", locale);
    window.localStorage.setItem("haloai.theme", theme);
  }, [locale, preferencesReady, theme]);

  const system = kind === "system";
  const panel = variant === "panel";
  return (
    <main className={`restricted-shell${panel ? " is-panel" : ""}`}>
      {panel ? null : (
        <div className="restricted-toolbar">
          <Link className="restricted-brand" href={"/app" as Route} aria-label="HaloAI">
            <HaloMark compact />
            <strong>HaloAI</strong>
          </Link>
          <div>
            <button
              type="button"
              className="admin-icon-button"
              aria-label={dictionary.changeLanguage}
              onClick={() => setLocale((current) => (current === "zh-CN" ? "en-US" : "zh-CN"))}
            >
              <Languages size={18} />
              <span>{locale === "zh-CN" ? "EN" : "中"}</span>
            </button>
            <button
              type="button"
              className="admin-icon-button is-square"
              aria-label={dictionary.changeTheme}
              onClick={() => setTheme((current) => (current === "light" ? "dark" : "light"))}
            >
              {theme === "light" ? <Moon size={18} /> : <Sun size={18} />}
            </button>
          </div>
        </div>
      )}

      <section className="restricted-card">
        <div className="restricted-visual" aria-hidden="true">
          <span className="restricted-orbit">
            <ShieldCheck size={34} />
          </span>
          <LockKeyhole className="restricted-lock" size={24} />
        </div>
        <span className="restricted-eyebrow">
          {system ? dictionary.systemBoundary : dictionary.administration}
        </span>
        <h1>{system ? dictionary.systemTitle : dictionary.accessDeniedTitle}</h1>
        <p>{system ? dictionary.systemDescription : dictionary.accessDeniedDescription}</p>
        {system ? (
          <ul className="restricted-rules">
            {[dictionary.systemRuleOne, dictionary.systemRuleTwo, dictionary.systemRuleThree].map(
              (rule) => (
                <li key={rule}>
                  <ShieldCheck size={17} aria-hidden="true" />
                  <span>{rule}</span>
                </li>
              ),
            )}
          </ul>
        ) : (
          <div className="restricted-reason">
            <LockKeyhole size={17} />
            {dictionary.accessDeniedReason}
          </div>
        )}
        <Link className="admin-primary-button" href={"/app" as Route}>
          <ArrowLeft size={17} aria-hidden="true" />
          {dictionary.returnToWorkspace}
        </Link>
      </section>
    </main>
  );
}
