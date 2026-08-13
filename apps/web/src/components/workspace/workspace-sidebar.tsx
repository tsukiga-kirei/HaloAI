import type { AuthenticatedUser, WorkspaceSummary } from "@haloai/contracts";
import {
  Bell,
  Check,
  ChevronDown,
  Hash,
  Inbox,
  FileText,
  LayoutDashboard,
  LogOut,
  MoreHorizontal,
  Plus,
  Search,
  Settings2,
} from "lucide-react";
import type { Route } from "next";
import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { Avatar, HaloMark, SidebarSection } from "./primitives";
import type { DemoRoom, WorkspaceSection, WorkspaceViewProps } from "./types";

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
    <aside className="workspace-sidebar" aria-label={dictionary.rooms}>
      <div className="brand-row">
        <Link className="brand" href={"/app" as Route} aria-label="HaloAI">
          <HaloMark />
          <span className="brand-copy">
            <strong>HaloAI</strong>
            <small>{dictionary.brandTagline}</small>
          </span>
        </Link>
        <Link
          className="icon-button"
          aria-label={dictionary.settings}
          href={"/admin/overview" as Route}
        >
          <Settings2 size={17} />
        </Link>
      </div>

      <div className="workspace-switcher-wrap">
        <button
          type="button"
          className="workspace-switcher"
          aria-expanded={workspaceMenuOpen}
          onClick={() => {
            if (workspaces.length === 0) onNotify(dictionary.workspacePreview);
            else setWorkspaceMenuOpen((current) => !current);
          }}
        >
          <span className="workspace-avatar">{workspaceInitial}</span>
          <span>
            <small>{dictionary.workspace}</small>
            <strong>{workspaceName}</strong>
          </span>
          <ChevronDown size={15} aria-hidden="true" />
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
        <button
          type="button"
          className={`nav-item ${activeSection === "overview" ? "is-active" : ""}`}
          aria-pressed={activeSection === "overview"}
          onClick={() => onSectionSelect("overview")}
        >
          <LayoutDashboard size={18} />
          <span>{dictionary.overview}</span>
        </button>
        <button
          type="button"
          className={`nav-item ${activeSection === "inbox" ? "is-active" : ""}`}
          aria-pressed={activeSection === "inbox"}
          onClick={() => onSectionSelect("inbox")}
        >
          <Inbox size={18} />
          <span>{dictionary.inbox}</span>
          <span className="nav-count">4</span>
        </button>
        <button
          type="button"
          className={`nav-item ${activeSection === "documents" ? "is-active" : ""}`}
          aria-pressed={activeSection === "documents"}
          onClick={() => onSectionSelect("documents")}
        >
          <FileText size={18} />
          <span>{dictionary.documents}</span>
        </button>
        <button
          type="button"
          className={`nav-item ${activeSection === "activity" ? "is-active" : ""}`}
          aria-pressed={activeSection === "activity"}
          onClick={() => onSectionSelect("activity")}
        >
          <Bell size={18} />
          <span>{dictionary.activity}</span>
        </button>
      </nav>

      <div className="sidebar-scroll">
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
      </div>

      <div className="sidebar-footer">
        <button
          type="button"
          className="profile-button"
          aria-expanded={profileMenuOpen}
          onClick={() => {
            if (onSignOut) setProfileMenuOpen((current) => !current);
            else onNotify(dictionary.profilePreview);
          }}
        >
          <Avatar initials={profileInitials} color="ink" size="small" />
          <span>
            <strong>{profileName}</strong>
            <small>{identity?.email ?? dictionary.roleProductLead}</small>
          </span>
          <MoreHorizontal size={17} />
        </button>
        {profileMenuOpen && onSignOut ? (
          <div className="profile-menu">
            <button type="button" onClick={onSignOut}>
              <LogOut size={16} /> {dictionary.signOut}
            </button>
          </div>
        ) : null}
      </div>
    </aside>
  );
}
