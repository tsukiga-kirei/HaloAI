import {
  Bell,
  ChevronDown,
  Hash,
  Inbox,
  MoreHorizontal,
  Search,
  Settings2,
} from "lucide-react";
import { demoRooms } from "./demo-data";
import { Avatar, HaloMark, SidebarSection } from "./primitives";
import type { WorkspaceViewProps } from "./types";

export function WorkspaceSidebar({
  dictionary,
  onOpenChat,
}: WorkspaceViewProps & { onOpenChat: () => void }) {
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
        <button className="icon-button" type="button" aria-label={dictionary.settings}>
          <Settings2 size={17} />
        </button>
      </div>

      <button type="button" className="workspace-switcher">
        <span className="workspace-avatar">N</span>
        <span>
          <small>{dictionary.workspace}</small>
          <strong>HaloAI Pilot</strong>
        </span>
        <ChevronDown size={15} aria-hidden="true" />
      </button>

      <label className="sidebar-search">
        <Search size={16} aria-hidden="true" />
        <input type="search" placeholder={dictionary.searchPlaceholder} />
        <kbd>⌘K</kbd>
      </label>

      <nav className="primary-nav">
        <button type="button" className="nav-item">
          <Inbox size={18} />
          <span>{dictionary.inbox}</span>
          <span className="nav-count">4</span>
        </button>
        <button type="button" className="nav-item">
          <Bell size={18} />
          <span>{dictionary.activity}</span>
        </button>
      </nav>

      <div className="sidebar-scroll">
        <SidebarSection title={dictionary.projectRooms} actionLabel={dictionary.newRoom}>
          <div className="room-list">
            {demoRooms.map((room) => (
              <button
                type="button"
                className={`room-item ${room.active === true ? "is-active" : ""}`}
                key={room.id}
                onClick={onOpenChat}
              >
                <Hash size={16} />
                <span>{dictionary[room.key]}</span>
                {room.unread > 0 ? <span className="room-unread">{room.unread}</span> : null}
              </button>
            ))}
          </div>
        </SidebarSection>

        <SidebarSection title={dictionary.directMessages} actionLabel={dictionary.invite}>
          <button type="button" className="dm-item">
            <Avatar initials="ML" color="coral" size="small" />
            <span>{dictionary.dmMina}</span>
            <i className="presence-dot" aria-label={dictionary.online} />
          </button>
          <button type="button" className="dm-item">
            <Avatar initials="H" color="halo" ai size="small" />
            <span>{dictionary.dmHalo}</span>
            <i className="presence-dot" aria-label={dictionary.online} />
          </button>
        </SidebarSection>
      </div>

      <div className="sidebar-footer">
        <button type="button" className="profile-button">
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
