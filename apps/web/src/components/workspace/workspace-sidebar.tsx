import type { AuthenticatedUser, WorkspaceSummary } from "@haloai/contracts";
import {
  Bell,
  Check,
  ChevronDown,
  Hash,
  Inbox,
  FileText,
  LayoutDashboard,
  PanelLeft,
  Plus,
  Search,
  Settings2,
} from "lucide-react";
import type { Locale } from "@/lib/i18n";
import type { Route } from "next";
import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { AccountMenu } from "@/components/account-menu";
import { Avatar, HaloMark, SidebarSection } from "./primitives";
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
  onToggleLocale: () => void;
  onToggleTheme: () => void;
  collapsed: boolean;
  onToggleCollapsed: () => void;
}) {
  const [query, setQuery] = useState("");
  const [workspaceMenuOpen, setWorkspaceMenuOpen] = useState(false);
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
  const workspaceName = activeWorkspace?.name ?? "HaloAI Pilot";
  const workspaceInitial = workspaceName.trim().slice(0, 1).toLocaleUpperCase() || "H";
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
        <Link className="brand" href={"/app" as Route} aria-label="HaloAI">
          <HaloMark compact={collapsed} />
          {collapsed ? null : (
            <span className="brand-copy">
              <strong>HaloAI</strong>
            </span>
          )}
        </Link>
        <button
          type="button"
          className="icon-button"
          aria-label={collapsed ? dictionary.expandSidebar : dictionary.collapseSidebar}
          onClick={onToggleCollapsed}
        >
          <PanelLeft size={16} />
        </button>
      </div>

      <div className="workspace-switcher-wrap">
        <button
          type="button"
          className="workspace-switcher"
          aria-label={dictionary.switchWorkspace}
          aria-expanded={workspaceMenuOpen}
          title={workspaceName}
          onClick={() => {
            setProfileMenuOpen(false);
            if (workspaces.length === 0) onNotify(dictionary.workspacePreview);
            else setWorkspaceMenuOpen((current) => !current);
          }}
        >
          <span className="workspace-avatar">{workspaceInitial}</span>
          {collapsed ? null : (
            <>
              <span>
                <small>{dictionary.workspace}</small>
                <strong>{workspaceName}</strong>
              </span>
              <ChevronDown size={15} aria-hidden="true" />
            </>
          )}
        </button>
        {workspaceMenuOpen ? (
          <div className="workspace-menu" role="menu">
            <span className="workspace-menu-label">{dictionary.switchWorkspace}</span>
            {workspaces.map((workspace) => (
              <button
                key={workspace.id}
                type="button"
                role="menuitem"
                onClick={() => {
                  onWorkspaceChange?.(workspace);
                  setWorkspaceMenuOpen(false);
                }}
              >
                <span className="workspace-mini-avatar">
                  {workspace.name.slice(0, 1).toLocaleUpperCase()}
                </span>
                <span>
                  <strong>{workspace.name}</strong>
                  <small>{workspace.role}</small>
                </span>
                {workspace.id === activeWorkspace?.id ? <Check size={15} /> : null}
              </button>
            ))}
            <Link href={"/onboarding" as Route} className="workspace-menu-create" role="menuitem">
              <Plus size={15} /> {dictionary.createWorkspace}
            </Link>
          </div>
        ) : null}
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
                aria-label={room.name ?? (room.nameKey === undefined ? "" : dictionary[room.nameKey])}
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
        <Link
          className="icon-button sidebar-admin-link"
          aria-label={dictionary.settings}
          href={"/admin/overview" as Route}
        >
          <Settings2 size={16} />
        </Link>
        <AccountMenu
          open={profileMenuOpen}
          name={profileName}
          detail={identity?.email ?? dictionary.roleProductLead}
          initials={profileInitials}
          locale={locale}
          theme={theme}
          collapsed={collapsed}
          labels={{
            personalSettings: dictionary.personalSettings,
            language: dictionary.language,
            theme: dictionary.theme,
            lightTheme: dictionary.lightTheme,
            darkTheme: dictionary.darkTheme,
            switchRole: dictionary.switchRole,
            signOut: dictionary.signOut,
          }}
          onToggle={() => {
            setWorkspaceMenuOpen(false);
            setProfileMenuOpen((current) => !current);
          }}
          onClose={() => setProfileMenuOpen(false)}
          onToggleLocale={onToggleLocale}
          onToggleTheme={onToggleTheme}
          onSwitchRole={() => onNotify(dictionary.switchRolePreview)}
          onSignOut={onSignOut}
        />
      </div>
    </aside>
  );
}
