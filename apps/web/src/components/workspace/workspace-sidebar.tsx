import type { AuthenticatedUser, WorkspaceSummary } from "@haloai/contracts";
import {
  Bell,
  Hash,
  Inbox,
  FileText,
  LayoutDashboard,
  PanelLeft,
  Plus,
  Search,
} from "lucide-react";
import type { Locale } from "@/lib/i18n";
import type { Route } from "next";
import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { AccountMenu } from "@/components/account-menu";
import { Avatar, HaloMark, SidebarSection } from "./primitives";
import type { PortalKey } from "@/lib/portals";
import type { DemoRoom, Theme, WorkspaceSection, WorkspaceViewProps } from "./types";

export function WorkspaceSidebar({
  dictionary,
  rooms,
  activeRoomId,
  onRoomSelect,
  onCreateRoom,
  onOpenMemberDialog,
  onNotify,
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
  onNotify: (message: string) => void;
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
  const directMessages = [
    { id: "mina", label: dictionary.dmMina, initials: "ML", color: "coral", ai: false },
    { id: "halo", label: dictionary.dmHalo, initials: "H", color: "halo", ai: true },
  ].filter(
    (item) =>
      normalizedQuery.length === 0 || item.label.toLocaleLowerCase().includes(normalizedQuery),
  );
  const profileName = identity?.name ?? "Andy";
  const profileInitials =
    profileName
      .split(/\s+/u)
      .map((part) => part.slice(0, 1))
      .join("")
      .slice(0, 2)
      .toLocaleUpperCase() || "AY";

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
              <span className="brand-copy">
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

      {collapsed ? null : (
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
      )}

      <nav className="primary-nav">
        {(
          [
            ["overview", dictionary.overview, LayoutDashboard],
            ["inbox", dictionary.inbox, Inbox],
            ["documents", dictionary.documents, FileText],
            ["activity", dictionary.activity, Bell],
          ] as const
        ).map(([section, label, Icon]) => (
          <button
            type="button"
            key={section}
            className={`nav-item ${activeSection === section ? "is-active" : ""}`}
            aria-label={label}
            aria-pressed={activeSection === section}
            title={label}
            onClick={() => onSectionSelect(section)}
          >
            <Icon size={18} />
            {collapsed ? null : <span>{label}</span>}
            {collapsed || section !== "inbox" ? null : <span className="nav-count">4</span>}
          </button>
        ))}
      </nav>

      <div className="sidebar-scroll">
        {collapsed ? (
          <div className="room-list">
            {visibleRooms.map((room) => (
              <button
                type="button"
                className={`room-item ${activeSection === "room" && room.id === activeRoomId ? "is-active" : ""}`}
                key={room.id}
                aria-label={
                  room.name ?? (room.nameKey === undefined ? "" : dictionary[room.nameKey])
                }
                title={room.name ?? (room.nameKey === undefined ? "" : dictionary[room.nameKey])}
                aria-pressed={room.id === activeRoomId}
                onClick={() => onRoomSelect(room.id)}
              >
                <Hash size={16} />
              </button>
            ))}
          </div>
        ) : (
          <>
            <SidebarSection
              title={dictionary.projectRooms}
              actionLabel={dictionary.newRoom}
              onAction={onCreateRoom}
            >
              <div className="room-list">
                {visibleRooms.map((room) => (
                  <button
                    type="button"
                    className={`room-item ${activeSection === "room" && room.id === activeRoomId ? "is-active" : ""}`}
                    key={room.id}
                    aria-pressed={room.id === activeRoomId}
                    onClick={() => onRoomSelect(room.id)}
                  >
                    <Hash size={16} />
                    <span>
                      {room.name ?? (room.nameKey === undefined ? "" : dictionary[room.nameKey])}
                    </span>
                    {room.unread > 0 ? <span className="room-unread">{room.unread}</span> : null}
                  </button>
                ))}
              </div>
            </SidebarSection>
            <SidebarSection
              title={dictionary.directMessages}
              actionLabel={dictionary.invite}
              onAction={onOpenMemberDialog}
            >
              {directMessages.map((item) => (
                <button
                  type="button"
                  className="dm-item"
                  key={item.id}
                  onClick={() => onNotify(dictionary.directMessagePreview)}
                >
                  <Avatar initials={item.initials} color={item.color} ai={item.ai} size="small" />
                  <span>{item.label}</span>
                  <i className="presence-dot" aria-label={dictionary.online} />
                </button>
              ))}
            </SidebarSection>
            {visibleRooms.length === 0 && directMessages.length === 0 ? (
              <p className="sidebar-empty">{dictionary.noSearchResults}</p>
            ) : null}
          </>
        )}
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
            roleMember: dictionary.roleMember,
            roleWorkspaceAdmin: dictionary.roleWorkspaceAdmin,
            roleSystemAdmin: dictionary.roleSystemAdmin,
            switchedToRole: dictionary.switchedToRole,
            signOut: dictionary.signOut,
          }}
          onToggle={() => setProfileMenuOpen((current) => !current)}
          onClose={() => setProfileMenuOpen(false)}
          onToggleLocale={onToggleLocale}
          onToggleTheme={onToggleTheme}
          onWorkspaceChange={onWorkspaceChange}
          onSignOut={onSignOut}
        />
      </div>
    </aside>
  );
}
