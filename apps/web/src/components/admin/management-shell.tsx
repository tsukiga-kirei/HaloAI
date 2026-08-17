"use client";

import type { LucideIcon } from "lucide-react";
import { PanelLeft } from "lucide-react";
import type { Route } from "next";
import Link from "next/link";
import { useMemo, useState } from "react";
import type { ReactNode } from "react";
import { AccountMenu } from "@/components/account-menu";
import { HaloMark } from "@/components/workspace/primitives";
import { adminDictionaries, type AdminDictionary } from "@/lib/admin-i18n";
import { useShellPreferences } from "@/lib/shell-preferences";

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
  const { locale, setLocale, theme, setTheme, collapsed, setCollapsed, portal, sidebarMotion } =
    useShellPreferences();
  const [menuOpen, setMenuOpen] = useState(false);
  const dictionary = useMemo(() => adminDictionaries[locale], [locale]);

  return (
    <div
      className={`halo-shell is-management${collapsed ? " is-collapsed" : ""}${
        sidebarMotion ? " is-sidebar-motion" : ""
      }`}
    >
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
                <span className="brand-copy sidebar-label">
                  <strong>HaloAI</strong>
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
          <p className="sidebar-kicker sidebar-label">{dictionary[titleKey]}</p>
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
                <span className="sidebar-label">{label}</span>
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
            onOpenChange={setMenuOpen}
            onToggleLocale={() => setLocale((current) => (current === "zh-CN" ? "en-US" : "zh-CN"))}
            onToggleTheme={() => setTheme((current) => (current === "light" ? "dark" : "light"))}
          />
        </div>
      </aside>
      <main className="management-main">{children(dictionary)}</main>
    </div>
  );
}
