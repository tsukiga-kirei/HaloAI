import { Bell, ChevronDown, Hash, Inbox, MoreHorizontal, Search, Settings2 } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { Avatar, HaloMark, SidebarSection } from "./primitives";
import type { DemoRoom, WorkspaceViewProps } from "./types";

export function WorkspaceSidebar({
  dictionary,
  rooms,
  activeRoomId,
  onRoomSelect,
  onCreateRoom,
  onOpenMemberDialog,
  onNotify,
}: WorkspaceViewProps & {
  rooms: readonly DemoRoom[];
  activeRoomId: string;
  onRoomSelect: (roomId: string) => void;
  onCreateRoom: () => void;
  onOpenMemberDialog: () => void;
  onNotify: (message: string) => void;
}) {
  const [query, setQuery] = useState("");
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
        <a className="brand" href="#workspace" aria-label="HaloAI">
          <HaloMark />
          <span className="brand-copy">
            <strong>HaloAI</strong>
            <small>{dictionary.brandTagline}</small>
          </span>
        </a>
        <button
          className="icon-button"
          type="button"
          aria-label={dictionary.settings}
          onClick={() => onNotify(dictionary.settingsPreview)}
        >
          <Settings2 size={17} />
        </button>
      </div>

      <button
        type="button"
        className="workspace-switcher"
        onClick={() => onNotify(dictionary.workspacePreview)}
      >
        <span className="workspace-avatar">N</span>
        <span>
          <small>{dictionary.workspace}</small>
          <strong>HaloAI Pilot</strong>
        </span>
        <ChevronDown size={15} aria-hidden="true" />
      </button>

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
          className="nav-item"
          onClick={() => onNotify(dictionary.inboxPreview)}
        >
          <Inbox size={18} />
          <span>{dictionary.inbox}</span>
          <span className="nav-count">4</span>
        </button>
        <button
          type="button"
          className="nav-item"
          onClick={() => onNotify(dictionary.activityPreview)}
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
                className={`room-item ${room.id === activeRoomId ? "is-active" : ""}`}
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
          onClick={() => onNotify(dictionary.profilePreview)}
        >
          <Avatar initials="AY" color="ink" size="small" />
          <span>
            <strong>Andy</strong>
            <small>{dictionary.roleProductLead}</small>
          </span>
          <MoreHorizontal size={17} />
        </button>
      </div>
    </aside>
  );
}
