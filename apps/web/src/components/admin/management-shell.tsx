"use client";

import type { LucideIcon } from "lucide-react";
import { PanelLeft } from "lucide-react";
import type { Route } from "next";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import { AccountMenu } from "@/components/account-menu";
import { HaloMark } from "@/components/workspace/primitives";
import type { Theme } from "@/components/workspace/types";
import { adminDictionaries, type AdminDictionary } from "@/lib/admin-i18n";
import type { Locale } from "@/lib/i18n";
import { readStoredPortal, type PortalKey } from "@/lib/portals";

export function ManagementShell({
  titleKey,
  navLabelKey,
  items,
  activeHref,
  workspaceName,
  children,
}: {
  titleKey: keyof AdminDictionary;
  navLabelKey: keyof AdminDictionary;
  items: ReadonlyArray<{ href: Route; labelKey: keyof AdminDictionary; icon: LucideIcon }>;
  activeHref: string;
  workspaceName?: string;
  children: (dictionary: AdminDictionary) => ReactNode;
}) {
  const [locale, setLocale] = useState<Locale>("zh-CN");
  const [theme, setTheme] = useState<Theme>("light");
  const [collapsed, setCollapsed] = useState(false);
  const [portal, setPortal] = useState<PortalKey>("member");
  const [menuOpen, setMenuOpen] = useState(false);
  const [ready, setReady] = useState(false);
  const dictionary = useMemo(() => adminDictionaries[locale], [locale]);

  useEffect(() => {
    const savedLocale = window.localStorage.getItem("haloai.locale");
    const savedTheme = window.localStorage.getItem("haloai.theme");
    const savedCollapsed = window.localStorage.getItem("haloai.sidebarCollapsed");
    if (savedLocale === "zh-CN" || savedLocale === "en-US") setLocale(savedLocale);
    if (savedTheme === "light" || savedTheme === "dark") setTheme(savedTheme);
    if (savedCollapsed === "true") setCollapsed(true);
    setPortal(readStoredPortal());
    setReady(true);
  }, []);

  useEffect(() => {
    if (!ready) return;
    document.documentElement.lang = locale;
    document.documentElement.dataset.theme = theme;
    window.localStorage.setItem("haloai.locale", locale);
    window.localStorage.setItem("haloai.theme", theme);
    window.localStorage.setItem("haloai.sidebarCollapsed", collapsed ? "true" : "false");
  }, [collapsed, locale, ready, theme]);

  return (
    <div className={`halo-shell is-management${collapsed ? " is-collapsed" : ""}`}>
      <aside
        className={`workspace-sidebar ${collapsed ? "is-collapsed" : ""}`}
        aria-label={dictionary[navLabelKey]}
      >
        <div className="brand-row">
          {collapsed ? (
            <button
              type="button"
              className="sidebar-compact-brand"
              aria-label={dictionary.expandSidebar}
              onClick={() => setCollapsed(false)}
            >
              <span className="sidebar-mark-slot">
                <HaloMark compact />
                <span className="sidebar-mark-toggle">
                  <PanelLeft size={16} />
                </span>
              </span>
              <span className="sidebar-expand-hint">{dictionary.expandSidebar}</span>
            </button>
          ) : (
            <>
              <Link className="brand" href={"/app" as Route} aria-label="HaloAI">
                <HaloMark />
                <span className="brand-copy">
                  <strong>HaloAI</strong>
                  <small>{dictionary[titleKey]}</small>
                </span>
              </Link>
              <button
                type="button"
                className="icon-button"
                aria-label={dictionary.collapseSidebar}
                onClick={() => setCollapsed(true)}
              >
                <PanelLeft size={16} />
              </button>
            </>
          )}
        </div>
        <nav className="primary-nav" aria-label={dictionary[navLabelKey]}>
          {items.map((item) => {
            const Icon = item.icon;
            const active = activeHref === item.href;
            const label = dictionary[item.labelKey];
            return (
              <Link
                key={item.href}
                className={`nav-item ${active ? "is-active" : ""}`}
                href={item.href}
                aria-current={active ? "page" : undefined}
                title={label}
              >
                <Icon size={18} />
                {collapsed ? null : <span>{label}</span>}
              </Link>
            );
          })}
        </nav>
        <div className="sidebar-footer">
          <AccountMenu
            open={menuOpen}
            name="Andy Yang"
            detail={workspaceName ?? dictionary.roleOwner}
            initials="AY"
            locale={locale}
            theme={theme}
            portal={portal}
            collapsed={collapsed}
            workspaces={[]}
            labels={{
              personalSettings: dictionary.personalSettings,
              language: dictionary.changeLanguage,
              theme: dictionary.changeTheme,
              lightTheme: dictionary.lightTheme,
              darkTheme: dictionary.darkTheme,
              switchRole: dictionary.switchRole,
              switchWorkspace: dictionary.workspaceScope,
              roleMember: dictionary.roleMember,
              roleWorkspaceAdmin: dictionary.roleWorkspaceAdmin,
              roleSystemAdmin: dictionary.roleSystemAdmin,
              switchedToRole: dictionary.switchedToRole,
              signOut: dictionary.signOut,
            }}
            onToggle={() => setMenuOpen((current) => !current)}
            onClose={() => setMenuOpen(false)}
            onToggleLocale={() => setLocale((current) => (current === "zh-CN" ? "en-US" : "zh-CN"))}
            onToggleTheme={() => setTheme((current) => (current === "light" ? "dark" : "light"))}
          />
        </div>
      </aside>
      <main className="management-main">{children(dictionary)}</main>
    </div>
  );
}
