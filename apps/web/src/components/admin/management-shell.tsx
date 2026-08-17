"use client";

import type { LucideIcon } from "lucide-react";
import { PanelLeft } from "lucide-react";
import type { Route } from "next";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useLayoutEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import { AccountMenu } from "@/components/account-menu";
import { HaloMark } from "@/components/workspace/primitives";
import { adminDictionaries, type AdminDictionary } from "@/lib/admin-i18n";
import { clearClientPortalSession, type PortalKey } from "@/lib/portals";
import { useShellPreferences } from "@/lib/shell-preferences";

/**
 * 工作空间后台与系统后台共用侧栏外壳。
 * portalKey 跟当前表面走，不能沿用 localStorage 里的协作身份，否则深链进后台后无法点选「协作成员」返回前台。
 */
export function ManagementShell({
  titleKey,
  navLabelKey,
  items,
  activeHref,
  portalKey,
  workspaceName,
  children,
}: {
  titleKey: keyof AdminDictionary;
  navLabelKey: keyof AdminDictionary;
  items: ReadonlyArray<{ href: Route; labelKey: keyof AdminDictionary; icon: LucideIcon }>;
  activeHref: string;
  portalKey: PortalKey;
  workspaceName?: string;
  children: (dictionary: AdminDictionary) => ReactNode;
}) {
  const { locale, setLocale, theme, setTheme, collapsed, setCollapsed, sidebarMotion } =
    useShellPreferences();
  const [menuOpen, setMenuOpen] = useState(false);
  const [narrowNav, setNarrowNav] = useState(false);
  const dictionary = useMemo(() => adminDictionaries[locale], [locale]);
  const router = useRouter();
  // 窄屏管理页必须展开文字分区栏；折叠轨会把链接收成图标，移动验收与横向浏览都会失败。
  const sidebarCollapsed = narrowNav ? false : collapsed;

  useLayoutEffect(() => {
    const media = window.matchMedia("(max-width: 767px)");
    const sync = () => setNarrowNav(media.matches);
    sync();
    media.addEventListener("change", sync);
    return () => media.removeEventListener("change", sync);
  }, []);

  function signOut(): void {
    clearClientPortalSession();
    router.replace("/login" as Route);
    router.refresh();
  }

  return (
    <div
      className={`halo-shell is-management${sidebarCollapsed ? " is-collapsed" : ""}${
        sidebarMotion ? " is-sidebar-motion" : ""
      }`}
    >
      <aside
        className={`workspace-sidebar ${sidebarCollapsed ? "is-collapsed" : ""}`}
        aria-label={dictionary[navLabelKey]}
      >
        <div className="brand-row">
          {sidebarCollapsed ? (
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
            portal={portalKey}
            collapsed={sidebarCollapsed}
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
            onSignOut={signOut}
          />
        </div>
      </aside>
      <main className="management-main">{children(dictionary)}</main>
    </div>
  );
}
