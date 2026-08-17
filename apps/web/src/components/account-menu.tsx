"use client";

import {
  Building2,
  Check,
  ChevronRight,
  Languages,
  LayoutDashboard,
  LogOut,
  Moon,
  Settings2,
  Shield,
  Sun,
} from "lucide-react";
import type { Route } from "next";
import type { WorkspaceSummary } from "@haloai/contracts";
import { useRouter } from "next/navigation";
import { useEffect, useLayoutEffect, useRef, useState, type CSSProperties } from "react";
import { createPortal } from "react-dom";
import type { Locale } from "@/lib/i18n";
import { persistPortal, portalPath, type PortalKey } from "@/lib/portals";
import type { Theme } from "@/components/workspace/types";
import { notify } from "@/components/toast-host";

const roles: Array<{
  key: PortalKey;
  icon: typeof LayoutDashboard;
}> = [
  { key: "member", icon: LayoutDashboard },
  { key: "workspace_admin", icon: Settings2 },
  { key: "system_admin", icon: Shield },
];

/**
 * 语言、主题、工作区和角色只出现在左下角账户菜单。弹出层挂到 body，避免被侧栏裁切。
 */
export function AccountMenu({
  open,
  name,
  detail,
  initials,
  locale,
  theme,
  portal,
  collapsed = false,
  workspaces = [],
  activeWorkspaceId,
  labels,
  onToggle,
  onClose,
  onToggleLocale,
  onToggleTheme,
  onWorkspaceChange,
  onSignOut,
}: {
  open: boolean;
  name: string;
  detail: string;
  initials: string;
  locale: Locale;
  theme: Theme;
  portal: PortalKey;
  collapsed?: boolean;
  workspaces?: readonly WorkspaceSummary[];
  activeWorkspaceId?: string | undefined;
  labels: {
    personalSettings: string;
    language: string;
    theme: string;
    lightTheme: string;
    darkTheme: string;
    switchRole: string;
    switchWorkspace: string;
    roleMember: string;
    roleWorkspaceAdmin: string;
    roleSystemAdmin: string;
    switchedToRole: string;
    signOut: string;
  };
  onToggle: () => void;
  onClose: () => void;
  onToggleLocale: () => void;
  onToggleTheme: () => void;
  onWorkspaceChange?: ((workspace: WorkspaceSummary) => void) | undefined;
  onSignOut?: (() => void) | undefined;
}) {
  const router = useRouter();
  const rootRef = useRef<HTMLDivElement>(null);
  const popoverRef = useRef<HTMLDivElement>(null);
  const [coords, setCoords] = useState<CSSProperties>({});
  const [submenu, setSubmenu] = useState<"role" | "workspace" | null>(null);

  useLayoutEffect(() => {
    if (!open || !rootRef.current) return;
    const rect = rootRef.current.getBoundingClientRect();
    if (collapsed) {
      setCoords({
        position: "fixed",
        left: rect.right + 10,
        bottom: window.innerHeight - rect.bottom,
        zIndex: 240,
      });
      return;
    }
    setCoords({
      position: "fixed",
      left: rect.left,
      bottom: window.innerHeight - rect.top + 8,
      minWidth: Math.max(240, rect.width),
      zIndex: 240,
    });
  }, [collapsed, open]);

  useEffect(() => {
    if (!open) {
      setSubmenu(null);
      return;
    }
    function handlePointer(event: MouseEvent): void {
      const target = event.target as Node;
      if (rootRef.current?.contains(target) || popoverRef.current?.contains(target)) return;
      onClose();
    }
    function handleKey(event: KeyboardEvent): void {
      if (event.key === "Escape") onClose();
    }
    window.addEventListener("mousedown", handlePointer);
    window.addEventListener("keydown", handleKey);
    return () => {
      window.removeEventListener("mousedown", handlePointer);
      window.removeEventListener("keydown", handleKey);
    };
  }, [onClose, open]);

  const roleLabel = {
    member: labels.roleMember,
    workspace_admin: labels.roleWorkspaceAdmin,
    system_admin: labels.roleSystemAdmin,
  } as const;

  function switchPortal(next: PortalKey): void {
    persistPortal(next);
    onClose();
    notify(labels.switchedToRole.replace("{role}", roleLabel[next]));
    router.push(portalPath(next) as Route);
  }

  return (
    <div className={`account-menu ${collapsed ? "is-collapsed" : ""}`} ref={rootRef}>
      <button
        type="button"
        className="profile-button"
        aria-label={labels.personalSettings}
        aria-expanded={open}
        aria-haspopup="menu"
        onClick={onToggle}
      >
        <span className="account-avatar">{initials}</span>
        {collapsed ? null : (
          <span>
            <strong>{name}</strong>
            <small>{roleLabel[portal]}</small>
          </span>
        )}
      </button>
      {open
        ? createPortal(
            <div className="account-popover" role="menu" ref={popoverRef} style={coords}>
              <p className="account-popover-identity">
                <strong>{name}</strong>
                <small>{detail}</small>
              </p>
              <button type="button" role="menuitem" onClick={onToggleLocale}>
                <Languages size={16} />
                {labels.language}
                <small>{locale === "zh-CN" ? "中" : "EN"}</small>
              </button>
              <button type="button" role="menuitem" onClick={onToggleTheme}>
                {theme === "light" ? <Moon size={16} /> : <Sun size={16} />}
                {labels.theme}
                <small>{theme === "light" ? labels.lightTheme : labels.darkTheme}</small>
              </button>
              {workspaces.length > 1 ? (
                <button
                  type="button"
                  role="menuitem"
                  aria-expanded={submenu === "workspace"}
                  onClick={() => setSubmenu((current) => (current === "workspace" ? null : "workspace"))}
                >
                  <Building2 size={16} />
                  {labels.switchWorkspace}
                  <ChevronRight size={14} />
                </button>
              ) : null}
              {submenu === "workspace"
                ? workspaces.map((workspace) => (
                    <button
                      type="button"
                      role="menuitemradio"
                      aria-checked={workspace.id === activeWorkspaceId}
                      className="account-subitem"
                      key={workspace.id}
                      onClick={() => {
                        onWorkspaceChange?.(workspace);
                        onClose();
                      }}
                    >
                      <Building2 size={14} />
                      {workspace.name}
                      {workspace.id === activeWorkspaceId ? <Check size={14} /> : null}
                    </button>
                  ))
                : null}
              <button
                type="button"
                role="menuitem"
                aria-expanded={submenu === "role"}
                onClick={() => setSubmenu((current) => (current === "role" ? null : "role"))}
              >
                <Settings2 size={16} />
                {labels.switchRole}
                <ChevronRight size={14} />
              </button>
              {submenu === "role"
                ? roles.map((role) => {
                    const Icon = role.icon;
                    const active = role.key === portal;
                    return (
                      <button
                        type="button"
                        role="menuitemradio"
                        aria-checked={active}
                        className="account-subitem"
                        key={role.key}
                        disabled={active}
                        onClick={() => switchPortal(role.key)}
                      >
                        <Icon size={14} />
                        {roleLabel[role.key]}
                        {active ? <Check size={14} /> : null}
                      </button>
                    );
                  })
                : null}
              {onSignOut ? (
                <button type="button" role="menuitem" className="is-danger" onClick={onSignOut}>
                  <LogOut size={16} />
                  {labels.signOut}
                </button>
              ) : null}
            </div>,
            document.body,
          )
        : null}
    </div>
  );
}
