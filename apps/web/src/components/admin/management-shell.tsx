"use client";

import type { LucideIcon } from "lucide-react";
import { PanelLeft } from "lucide-react";
import type { SessionContext, WorkspaceSummary } from "@haloai/contracts";
import type { Route } from "next";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useLayoutEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import { AccountMenu } from "@/components/account-menu";
import { AccountSettingsDialog } from "@/components/account-settings-dialog";
import { HaloMark } from "@/components/workspace/primitives";
import { adminDictionaries, type AdminDictionary } from "@/lib/admin-i18n";
import { apiFetch } from "@/lib/api-client";
import { persistWorkspaceId, readStoredWorkspaceId } from "@/lib/portals";
import { clearClientPortalSession, type PortalKey } from "@/lib/portals";
import { usePortalSurface, useShellPreferences } from "@/lib/shell-preferences";
import { SidebarTooltip } from "@/components/ui/sidebar-tooltip";

export type ManagementNavItem = {
  href: Route;
  labelKey: keyof AdminDictionary;
  icon: LucideIcon;
};

export type ManagementNavSection = {
  id: string;
  titleKey: keyof AdminDictionary;
  items: ReadonlyArray<ManagementNavItem>;
};

/**
 * 工作空间后台与系统后台共用侧栏外壳。
 * portalKey 跟当前表面走，不能沿用 localStorage 里的协作身份，否则深链进后台后无法点选「协作成员」返回前台。
 */
export function ManagementShell({
  navLabelKey,
  sections,
  activeHref,
  portalKey,
  workspaceName,
  children,
}: {
  navLabelKey: keyof AdminDictionary;
  sections: ReadonlyArray<ManagementNavSection>;
  activeHref: string;
  portalKey: PortalKey;
  workspaceName?: string;
  children: (dictionary: AdminDictionary, locale: "zh-CN" | "en-US") => ReactNode;
}) {
  const { locale, setLocale, theme, setTheme, collapsed, setCollapsed, sidebarMotion } =
    useShellPreferences();
  usePortalSurface(portalKey);
  const [menuOpen, setMenuOpen] = useState(false);
  const [accountOpen, setAccountOpen] = useState(false);
  const [narrowNav, setNarrowNav] = useState(false);
  const [motionReady, setMotionReady] = useState(false);
  const dictionary = useMemo(() => adminDictionaries[locale], [locale]);
  const router = useRouter();
  const [session, setSession] = useState<SessionContext | null>(null);
  const workspaces = session?.workspaces ?? [];
  const rememberedWorkspaceId = typeof window === "undefined" ? null : readStoredWorkspaceId();
  const activeWorkspace =
    workspaces.find((workspace) => workspace.id === rememberedWorkspaceId) ?? workspaces[0];
  const profileName = session?.user.name ?? "HaloAI";
  const profileInitials =
    profileName
      .split(/\s+/u)
      .map((part) => part.slice(0, 1))
      .join("")
      .slice(0, 2)
      .toLocaleUpperCase() || "HA";
  // 窄屏管理页必须展开文字分区栏；折叠轨会把链接收成图标，移动验收与横向浏览都会失败。
  const sidebarCollapsed = narrowNav ? false : collapsed;

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => setMotionReady(true));
    return () => window.cancelAnimationFrame(frame);
  }, []);

  useEffect(() => {
    apiFetch<SessionContext>("/v1/session")
      .then(setSession)
      .catch(() => setSession(null));
  }, []);

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
        sidebarMotion && motionReady ? " is-sidebar-motion" : ""
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
          {sections.map((section) => (
            <div className="nav-section" key={section.id}>
              <p className="nav-section-title sidebar-label">{dictionary[section.titleKey]}</p>
              {section.items.map((item) => {
                const Icon = item.icon;
                const active = activeHref === item.href;
                const label = dictionary[item.labelKey];
                return (
                  <SidebarTooltip key={item.href} enabled={sidebarCollapsed} label={label}>
                    <Link
                      className={`nav-item ${active ? "is-active" : ""}`}
                      href={item.href}
                      aria-current={active ? "page" : undefined}
                      title={label}
                    >
                      <Icon size={18} />
                      <span className="sidebar-label">{label}</span>
                    </Link>
                  </SidebarTooltip>
                );
              })}
            </div>
          ))}
        </nav>
        <div className="sidebar-footer">
          <AccountMenu
            open={menuOpen}
            name={profileName}
            detail={activeWorkspace?.name ?? workspaceName ?? dictionary.roleOwner}
            initials={profileInitials}
            locale={locale}
            theme={theme}
            portal={portalKey}
            collapsed={sidebarCollapsed}
            workspaces={workspaces}
            activeWorkspaceId={activeWorkspace?.id}
            labels={{
              personalSettings: dictionary.personalSettings,
              language: dictionary.changeLanguage,
              theme: dictionary.changeTheme,
              lightTheme: dictionary.lightTheme,
              darkTheme: dictionary.darkTheme,
              switchRole: dictionary.switchRole,
              switchWorkspace: dictionary.switchWorkspace,
              emptyWorkspaceList: dictionary.emptyWorkspaceList,
              roleMember: dictionary.roleMember,
              roleWorkspaceAdmin: dictionary.roleWorkspaceAdmin,
              roleSystemAdmin: dictionary.roleSystemAdmin,
              switchedToRole: dictionary.switchedToRole,
              signOut: dictionary.signOut,
              accountAndSecurity: dictionary.accountAndSecurity,
            }}
            onOpenChange={setMenuOpen}
            onToggleLocale={() => setLocale((current) => (current === "zh-CN" ? "en-US" : "zh-CN"))}
            onToggleTheme={() => setTheme((current) => (current === "light" ? "dark" : "light"))}
            onWorkspaceChange={(workspace: WorkspaceSummary) => {
              persistWorkspaceId(workspace.id);
              window.location.reload();
            }}
            onOpenAccountSettings={() => setAccountOpen(true)}
            onSignOut={signOut}
          />
        </div>
      </aside>
      <main className="management-main">{children(dictionary, locale)}</main>
      <AccountSettingsDialog
        open={accountOpen}
        onClose={() => setAccountOpen(false)}
        session={session}
        workspace={activeWorkspace}
        labels={{
          title: dictionary.accountAndSecurity,
          description: dictionary.accountDescription,
          tabProfile: dictionary.accountTabProfile,
          tabSession: dictionary.accountTabSession,
          email: dictionary.accountEmail,
          displayName: dictionary.accountDisplayName,
          workspace: dictionary.accountWorkspace,
          role: dictionary.accountRole,
          sessionProtected: dictionary.accountSessionProtected,
          saved: dictionary.accountSaved,
          saveError: dictionary.accountSaveError,
          nameRequired: dictionary.accountNameRequired,
          save: dictionary.save,
          cancel: dictionary.cancel,
          owner: dictionary.accessOwner,
          admin: dictionary.accessAdmin,
          member: dictionary.accessMember,
          guest: dictionary.accessGuest,
        }}
        onSaved={(name) => {
          setSession((current) =>
            current ? { ...current, user: { ...current.user, name } } : current,
          );
        }}
      />
    </div>
  );
}
