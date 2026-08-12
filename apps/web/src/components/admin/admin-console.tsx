"use client";

import {
  ArrowLeft,
  Bot,
  Boxes,
  ChevronDown,
  Languages,
  LayoutDashboard,
  Moon,
  ScrollText,
  ShieldCheck,
  Sun,
  UsersRound,
} from "lucide-react";
import type { Route } from "next";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { adminDictionaries } from "@/lib/admin-i18n";
import { type AdminSection } from "@/lib/admin-sections";
import type { Locale } from "@/lib/i18n";
import type { Theme } from "@/components/workspace/types";
import { HaloMark } from "@/components/workspace/primitives";
import { AdminSectionContent } from "./admin-section-content";

const navigation = [
  { section: "overview", icon: LayoutDashboard, label: "navOverview" },
  { section: "members", icon: UsersRound, label: "navMembers" },
  { section: "agents", icon: Bot, label: "navAgents" },
  { section: "integrations", icon: Boxes, label: "navIntegrations" },
  { section: "security", icon: ShieldCheck, label: "navSecurity" },
  { section: "audit", icon: ScrollText, label: "navAudit" },
] as const;

export function AdminConsole({ section }: { section: AdminSection }) {
  const [locale, setLocale] = useState<Locale>("zh-CN");
  const [theme, setTheme] = useState<Theme>("light");
  const [preferencesReady, setPreferencesReady] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const dictionary = useMemo(() => adminDictionaries[locale], [locale]);

  useEffect(() => {
    const savedLocale = window.localStorage.getItem("haloai.locale");
    const savedTheme = window.localStorage.getItem("haloai.theme");
    if (savedLocale === "zh-CN" || savedLocale === "en-US") setLocale(savedLocale);
    if (savedTheme === "light" || savedTheme === "dark") {
      setTheme(savedTheme);
    } else if (window.matchMedia("(prefers-color-scheme: dark)").matches) {
      setTheme("dark");
    }
    setPreferencesReady(true);
  }, []);

  useEffect(() => {
    if (!preferencesReady) return;
    document.documentElement.lang = locale;
    document.documentElement.dataset.theme = theme;
    window.localStorage.setItem("haloai.locale", locale);
    window.localStorage.setItem("haloai.theme", theme);
  }, [locale, preferencesReady, theme]);

  useEffect(() => {
    if (notice === null) return;
    const timer = window.setTimeout(() => setNotice(null), 2_800);
    return () => window.clearTimeout(timer);
  }, [notice]);

  return (
    <div className="admin-shell">
      <aside className="admin-sidebar">
        <div className="admin-brand-row">
          <Link className="admin-brand" href={"/app" as Route} aria-label="HaloAI">
            <HaloMark compact />
            <span>
              <strong>HaloAI</strong>
              <small>{dictionary.administration}</small>
            </span>
          </Link>
        </div>

        <button
          className="admin-workspace-switcher"
          type="button"
          onClick={() => setNotice(dictionary.localOnlyNotice)}
        >
          <span className="admin-workspace-avatar">N</span>
          <span>
            <small>{dictionary.workspaceScope}</small>
            <strong>HaloAI Pilot</strong>
          </span>
          <ChevronDown size={16} aria-hidden="true" />
        </button>

        <nav className="admin-navigation" aria-label={dictionary.navLabel}>
          {navigation.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.section}
                className={section === item.section ? "admin-nav-item is-active" : "admin-nav-item"}
                href={`/admin/${item.section}` as Route}
                aria-current={section === item.section ? "page" : undefined}
              >
                <Icon size={18} aria-hidden="true" />
                <span>{dictionary[item.label]}</span>
              </Link>
            );
          })}
        </nav>

        <div className="admin-sidebar-footer">
          <span className="admin-user-avatar">AY</span>
          <span>
            <strong>Andy Yang</strong>
            <small>{dictionary.roleOwner}</small>
          </span>
        </div>
      </aside>

      <div className="admin-main">
        <header className="admin-topbar">
          <div>
            <span className="admin-eyebrow">{dictionary.administration}</span>
            <strong>{dictionary.administrationSubtitle}</strong>
          </div>
          <div className="admin-topbar-actions">
            <span className="admin-preview-chip">{dictionary.previewBadge}</span>
            <button
              type="button"
              className="admin-icon-button"
              aria-label={dictionary.changeLanguage}
              title={dictionary.changeLanguage}
              onClick={() => setLocale((current) => (current === "zh-CN" ? "en-US" : "zh-CN"))}
            >
              <Languages size={18} />
              <span>{locale === "zh-CN" ? "EN" : "中"}</span>
            </button>
            <button
              type="button"
              className="admin-icon-button is-square"
              aria-label={dictionary.changeTheme}
              title={dictionary.changeTheme}
              onClick={() => setTheme((current) => (current === "light" ? "dark" : "light"))}
            >
              {theme === "light" ? <Moon size={18} /> : <Sun size={18} />}
            </button>
            <Link className="admin-back-link" href={"/app" as Route}>
              <ArrowLeft size={17} aria-hidden="true" />
              <span>{dictionary.backToWork}</span>
            </Link>
          </div>
        </header>

        <main className="admin-content">
          <div className="admin-preview-notice" role="note">
            <span className="admin-notice-dot" aria-hidden="true" />
            {dictionary.previewNotice}
          </div>
          <AdminSectionContent
            dictionary={dictionary}
            section={section}
            onNotify={() => setNotice(dictionary.localOnlyNotice)}
          />
        </main>
      </div>

      {notice === null ? null : (
        <div className="admin-toast" role="status">
          <ShieldCheck size={17} aria-hidden="true" />
          {notice}
        </div>
      )}
    </div>
  );
}
