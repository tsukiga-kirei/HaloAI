import type { AuthenticatedUser, WorkspaceSummary } from "@haloai/contracts";
import { Bell, Inbox, FileText, LayoutDashboard, PanelLeft, Search } from "lucide-react";
import type { Locale } from "@/lib/i18n";
import type { Route } from "next";
import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { AccountMenu } from "@/components/account-menu";
import { AccountSettingsDialog } from "@/components/account-settings-dialog";
import { HaloMark, RoomGlyph, SidebarSection } from "./primitives";
import type { PortalKey } from "@/lib/portals";
import type { DemoRoom, Theme, WorkspaceSection, WorkspaceViewProps } from "./types";
import { SidebarTooltip } from "@/components/ui/sidebar-tooltip";

export function WorkspaceSidebar({
  dictionary,
  rooms,
  activeRoomId,
  onRoomSelect,
  onCreateRoom,
  onOpenMemberDialog,
  identity,
  workspaces,
  activeWorkspace,
  onWorkspaceChange,
  onSignOut,
  activeSection,
  onSectionSelect,
  locale,
  theme,
  portal,
  onToggleLocale,
  onToggleTheme,
  collapsed,
  onToggleCollapsed,
}: WorkspaceViewProps & {
  rooms: readonly DemoRoom[];
  activeRoomId: string;
  onRoomSelect: (roomId: string) => void;
  onCreateRoom: () => void;
  onOpenMemberDialog: () => void;
  identity?: AuthenticatedUser | undefined;
  workspaces: readonly WorkspaceSummary[];
  activeWorkspace?: WorkspaceSummary | undefined;
  onWorkspaceChange?: ((workspace: WorkspaceSummary) => void) | undefined;
  onSignOut?: (() => void) | undefined;
  activeSection: WorkspaceSection;
  onSectionSelect: (section: WorkspaceSection) => void;
  locale: Locale;
  theme: Theme;
  portal: PortalKey;
  onToggleLocale: () => void;
  onToggleTheme: () => void;
  collapsed: boolean;
  onToggleCollapsed: () => void;
}) {
  const [query, setQuery] = useState("");
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const [accountOpen, setAccountOpen] = useState(false);
  const searchRef = useRef<HTMLInputElement>(null);
  const normalizedQuery = query.trim().toLocaleLowerCase();
  const visibleRooms = useMemo(
    () =>
      rooms.filter((room) => {
        const name = room.name ?? (room.nameKey === undefined ? "" : dictionary[room.nameKey]);
        return normalizedQuery.length === 0 || name.toLocaleLowerCase().includes(normalizedQuery);
      }),
    [dictionary, normalizedQuery, rooms],
  );
  const profileName = identity?.name ?? "HaloAI";
  const profileInitials =
    profileName
      .split(/\s+/u)
      .map((part) => part.slice(0, 1))
      .join("")
      .slice(0, 2)
      .toLocaleUpperCase() || "AY";

  function displayRoomName(room: DemoRoom): string {
    return room.name ?? (room.nameKey === undefined ? "" : dictionary[room.nameKey]);
  }

  useEffect(() => {
    const focusSearch = (event: globalThis.KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLocaleLowerCase() === "k") {
        event.preventDefault();
        searchRef.current?.focus();
      }
    };
    window.addEventListener("keydown", focusSearch);
    return () => window.removeEventListener("keydown", focusSearch);
  }, []);

  return (
    <aside
      className={`workspace-sidebar ${collapsed ? "is-collapsed" : ""}`}
      aria-label={dictionary.rooms}
    >
      <div className="brand-row">
        {collapsed ? (
          <button
            type="button"
            className="sidebar-compact-brand"
            aria-label={dictionary.expandSidebar}
            onClick={onToggleCollapsed}
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
              onClick={onToggleCollapsed}
            >
              <PanelLeft size={16} />
            </button>
          </>
        )}
      </div>

      <label className="sidebar-search">
        <Search size={16} aria-hidden="true" />
        <input
          ref={searchRef}
          type="search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder={dictionary.searchPlaceholder}
        />
        <kbd>⌘K</kbd>
      </label>

      <nav className="primary-nav">
        {(
          [
            ["overview", dictionary.overview, LayoutDashboard],
            ["inbox", dictionary.inbox, Inbox],
            ["documents", dictionary.documents, FileText],
            ["activity", dictionary.activity, Bell],
          ] as const
        ).map(([section, label, Icon]) => (
          <SidebarTooltip key={section} enabled={collapsed} label={label}>
            <button
              type="button"
              className={`nav-item ${activeSection === section ? "is-active" : ""}`}
              aria-label={label}
              aria-pressed={activeSection === section}
              title={label}
              onClick={() => onSectionSelect(section)}
            >
              <Icon size={18} />
              <span className="sidebar-label">{label}</span>
            </button>
          </SidebarTooltip>
        ))}
      </nav>

      <div className="sidebar-scroll">
        <SidebarSection
          title={dictionary.projectRooms}
          actionLabel={dictionary.newRoom}
          onAction={onCreateRoom}
        >
          <div className="room-list">
            {visibleRooms.map((room) => {
              const name = displayRoomName(room);
              return (
                <SidebarTooltip key={room.id} enabled={collapsed} label={name}>
                  <button
                    type="button"
                    className={`room-item ${activeSection === "room" && room.id === activeRoomId ? "is-active" : ""}`}
                    aria-label={name}
                    title={name}
                    aria-pressed={activeSection === "room" && room.id === activeRoomId}
                    onClick={() => onRoomSelect(room.id)}
                  >
                    <span className="room-glyph-wrap">
                      <RoomGlyph id={room.id} name={name} />
                      {room.unread > 0 ? <i className="room-unread-dot" /> : null}
                    </span>
                    <span className="sidebar-label">{name}</span>
                    {room.unread > 0 ? <span className="room-unread">{room.unread}</span> : null}
                  </button>
                </SidebarTooltip>
              );
            })}
          </div>
        </SidebarSection>
        <SidebarSection
          className="is-direct-messages"
          title={dictionary.directMessages}
          actionLabel={dictionary.invite}
          onAction={onOpenMemberDialog}
        >
          {normalizedQuery.length === 0 ? (
            <p className="sidebar-empty">{dictionary.noDirectMessages}</p>
          ) : null}
        </SidebarSection>
        {visibleRooms.length === 0 ? (
          <p className="sidebar-empty">{dictionary.noSearchResults}</p>
        ) : null}
      </div>

      <div className="sidebar-footer">
        <AccountMenu
          open={profileMenuOpen}
          name={profileName}
          detail={identity?.email ?? dictionary.roleProductLead}
          initials={profileInitials}
          locale={locale}
          theme={theme}
          portal={portal}
          collapsed={collapsed}
          workspaces={workspaces}
          activeWorkspaceId={activeWorkspace?.id}
          labels={{
            personalSettings: dictionary.personalSettings,
            language: dictionary.language,
            theme: dictionary.theme,
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
          onOpenChange={setProfileMenuOpen}
          onToggleLocale={onToggleLocale}
          onToggleTheme={onToggleTheme}
          onWorkspaceChange={onWorkspaceChange}
          onOpenAccountSettings={() => setAccountOpen(true)}
          onSignOut={onSignOut}
        />
      </div>
      <AccountSettingsDialog
        open={accountOpen}
        onClose={() => setAccountOpen(false)}
        session={identity ? { user: identity, workspaces: [...workspaces] } : null}
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
          save: dictionary.accountSave,
          cancel: dictionary.cancel,
          owner: dictionary.accessOwner,
          admin: dictionary.accessAdmin,
          member: dictionary.accessMember,
          guest: dictionary.accessGuest,
        }}
      />
    </aside>
  );
}
