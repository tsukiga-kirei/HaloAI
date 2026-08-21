"use client";

import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import type { WorkspaceSummary } from "@haloai/contracts";
import {
  Building2,
  Check,
  ChevronRight,
  ChevronsUpDown,
  Languages,
  LayoutDashboard,
  LogOut,
  Moon,
  Settings2,
  Shield,
  Sun,
  UserRound,
} from "lucide-react";
import type { Route } from "next";
import { useRouter } from "next/navigation";
import { persistPortal, portalPath, clearClientPortalSession, type PortalKey } from "@/lib/portals";
import type { Locale } from "@/lib/i18n";
import type { Theme } from "@/components/workspace/types";
import { notify } from "@/components/toast-host";
import { animateOverlayIn } from "@/lib/motion";

const roles: Array<{
  key: PortalKey;
  icon: typeof LayoutDashboard;
}> = [
  { key: "member", icon: LayoutDashboard },
  { key: "workspace_admin", icon: Settings2 },
  { key: "system_admin", icon: Shield },
];

/**
 * 账户菜单使用 Radix 二级子菜单弹出层，角色选项不再挤在同一列里缩进。
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
  onOpenChange,
  onToggleLocale,
  onToggleTheme,
  onWorkspaceChange,
  onOpenAccountSettings,
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
    emptyWorkspaceList: string;
    roleMember: string;
    roleWorkspaceAdmin: string;
    roleSystemAdmin: string;
    switchedToRole: string;
    signOut: string;
    accountAndSecurity: string;
  };
  onOpenChange: (open: boolean) => void;
  onToggleLocale: () => void;
  onToggleTheme: () => void;
  onWorkspaceChange?: ((workspace: WorkspaceSummary) => void) | undefined;
  onOpenAccountSettings?: (() => void) | undefined;
  onSignOut?: (() => void) | undefined;
}) {
  const router = useRouter();
  const roleLabel = {
    member: labels.roleMember,
    workspace_admin: labels.roleWorkspaceAdmin,
    system_admin: labels.roleSystemAdmin,
  } as const;

  function switchPortal(next: PortalKey): void {
    persistPortal(next);
    onOpenChange(false);
    notify(labels.switchedToRole.replace("{role}", roleLabel[next]));
    router.push(portalPath(next) as Route);
  }

  return (
    <div className={`account-menu ${collapsed ? "is-collapsed" : ""}`}>
      <DropdownMenu.Root open={open} onOpenChange={onOpenChange} modal={false}>
        <DropdownMenu.Trigger asChild>
          <button
            type="button"
            className="account-trigger"
            aria-label={labels.personalSettings}
            title={collapsed ? labels.personalSettings : undefined}
          >
            <span className="account-avatar">{initials}</span>
            <span className="account-meta sidebar-label">
              <strong>{name}</strong>
              <small>{roleLabel[portal]}</small>
            </span>
            <ChevronsUpDown size={14} aria-hidden="true" />
          </button>
        </DropdownMenu.Trigger>
        <DropdownMenu.Portal>
          <DropdownMenu.Content
            className="halo-menu-content is-account"
            side="top"
            align={collapsed ? "start" : "start"}
            sideOffset={8}
            collisionPadding={12}
            ref={(node) => {
              if (node) animateOverlayIn(node);
            }}
          >
            <div className="halo-menu-label">
              <strong>{name}</strong>
              <small>{detail}</small>
            </div>
            {onOpenAccountSettings ? (
              <DropdownMenu.Item
                className="halo-menu-item"
                onSelect={() => {
                  onOpenChange(false);
                  onOpenAccountSettings();
                }}
              >
                <UserRound size={16} />
                {labels.accountAndSecurity}
              </DropdownMenu.Item>
            ) : null}
            <DropdownMenu.Item
              className="halo-menu-item"
              onSelect={(event) => {
                event.preventDefault();
                onToggleLocale();
              }}
            >
              <Languages size={16} />
              {labels.language}
              <small>{locale === "zh-CN" ? "中" : "EN"}</small>
            </DropdownMenu.Item>
            <DropdownMenu.Item
              className="halo-menu-item"
              onSelect={(event) => {
                event.preventDefault();
                onToggleTheme();
              }}
            >
              {theme === "light" ? <Moon size={16} /> : <Sun size={16} />}
              {labels.theme}
              <small>{theme === "light" ? labels.lightTheme : labels.darkTheme}</small>
            </DropdownMenu.Item>
            {/* 单空间选择已在登录页完成；个人设置只在多个工作区时提供切换。 */}
            {workspaces.length > 1 ? (
              <DropdownMenu.Sub>
                <DropdownMenu.SubTrigger className="halo-menu-item">
                  <Building2 size={16} />
                  {labels.switchWorkspace}
                  <ChevronRight size={14} className="halo-menu-trailing" />
                </DropdownMenu.SubTrigger>
                <DropdownMenu.Portal>
                  <DropdownMenu.SubContent
                    className="halo-menu-sub is-account"
                    align="end"
                    sideOffset={8}
                    collisionPadding={16}
                    ref={(node) => {
                      if (node) animateOverlayIn(node);
                    }}
                  >
                    {workspaces.map((workspace) => (
                      <DropdownMenu.Item
                        className="halo-menu-item"
                        key={workspace.id}
                        onSelect={() => {
                          onWorkspaceChange?.(workspace);
                          onOpenChange(false);
                        }}
                      >
                        <Building2 size={14} />
                        {workspace.name}
                        {workspace.id === activeWorkspaceId ? (
                          <Check size={14} className="halo-menu-trailing" />
                        ) : null}
                      </DropdownMenu.Item>
                    ))}
                  </DropdownMenu.SubContent>
                </DropdownMenu.Portal>
              </DropdownMenu.Sub>
            ) : null}
            <DropdownMenu.Sub>
              <DropdownMenu.SubTrigger className="halo-menu-item">
                <Settings2 size={16} />
                {labels.switchRole}
                <ChevronRight size={14} className="halo-menu-trailing" />
              </DropdownMenu.SubTrigger>
              <DropdownMenu.Portal>
                <DropdownMenu.SubContent
                  className="halo-menu-sub is-account"
                  align="end"
                  sideOffset={8}
                  collisionPadding={16}
                  ref={(node) => {
                    if (node) animateOverlayIn(node);
                  }}
                >
                  <DropdownMenu.RadioGroup
                    value={portal}
                    onValueChange={(next) => switchPortal(next as PortalKey)}
                  >
                    {roles.map((role) => {
                      const Icon = role.icon;
                      return (
                        <DropdownMenu.RadioItem
                          className="halo-menu-radio"
                          key={role.key}
                          value={role.key}
                          disabled={role.key === portal}
                        >
                          <Icon size={14} />
                          {roleLabel[role.key]}
                          <span className="halo-menu-indicator halo-menu-trailing">
                            <DropdownMenu.ItemIndicator>
                              <Check size={14} />
                            </DropdownMenu.ItemIndicator>
                          </span>
                        </DropdownMenu.RadioItem>
                      );
                    })}
                  </DropdownMenu.RadioGroup>
                </DropdownMenu.SubContent>
              </DropdownMenu.Portal>
            </DropdownMenu.Sub>
            <DropdownMenu.Separator className="halo-menu-separator" />
            <DropdownMenu.Item
              className="halo-menu-item is-danger"
              onSelect={() => {
                onOpenChange(false);
                if (onSignOut) {
                  onSignOut();
                  return;
                }
                clearClientPortalSession();
                router.replace("/login" as Route);
                router.refresh();
              }}
            >
              <LogOut size={16} />
              {labels.signOut}
            </DropdownMenu.Item>
          </DropdownMenu.Content>
        </DropdownMenu.Portal>
      </DropdownMenu.Root>
    </div>
  );
}
