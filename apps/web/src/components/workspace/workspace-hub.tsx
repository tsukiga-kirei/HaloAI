"use client";

import {
  ArrowRight,
  Bell,
  CheckCircle2,
  Clock3,
  FileCheck2,
  FileText,
  Hash,
  Inbox,
  LayoutDashboard,
  Plus,
  Search,
  UserRound,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { useMemo, useState } from "react";
import type { DemoRoom, WorkspaceSection, WorkspaceViewProps } from "./types";

type InboxFilter = "all" | "mentions" | "approvals" | "invitations";
type DocumentFilter = "all" | "draft" | "review" | "approved";

export function WorkspaceHub({
  dictionary,
  section,
  rooms,
  onSectionChange,
  onCreateRoom,
  onOpenRoom,
  onOpenDocument,
  onNotify,
}: WorkspaceViewProps & {
  section: Exclude<WorkspaceSection, "room">;
  rooms: readonly DemoRoom[];
  onSectionChange: (section: WorkspaceSection) => void;
  onCreateRoom: () => void;
  onOpenRoom: (roomId: string) => void;
  onOpenDocument: (roomId: string) => void;
  onNotify: (message: string) => void;
}) {
  const title =
    section === "overview"
      ? dictionary.workspaceOverviewTitle
      : section === "inbox"
        ? dictionary.inbox
        : section === "documents"
          ? dictionary.documentDirectoryTitle
          : dictionary.activityTitle;
  const subtitle =
    section === "overview"
      ? dictionary.workspaceOverviewSubtitle
      : section === "inbox"
        ? dictionary.inboxSubtitle
        : section === "documents"
          ? dictionary.documentDirectorySubtitle
          : dictionary.activitySubtitle;

  return (
    <main className="workspace-hub" aria-labelledby="workspace-hub-title">
      <header className="workspace-hub-header">
        <div>
          <span className="workspace-hub-eyebrow">{dictionary.workspace}</span>
          <h1 id="workspace-hub-title">{title}</h1>
          <p>{subtitle}</p>
        </div>
        <button
          type="button"
          className="primary-button workspace-hub-create"
          onClick={onCreateRoom}
        >
          <Plus size={17} /> {dictionary.newRoom}
        </button>
      </header>

      <nav className="workspace-hub-tabs" aria-label={dictionary.workspaceOverviewTitle}>
        {(
          [
            ["overview", dictionary.overview, LayoutDashboard],
            ["inbox", dictionary.inbox, Inbox],
            ["documents", dictionary.documents, FileText],
            ["activity", dictionary.activity, Bell],
          ] as const
        ).map(([value, label, Icon]) => (
          <button
            type="button"
            key={value}
            className={section === value ? "is-active" : ""}
            aria-pressed={section === value}
            onClick={() => onSectionChange(value)}
          >
            <Icon size={16} /> {label}
          </button>
        ))}
      </nav>

      <div className="workspace-hub-boundary" role="note">
        <CheckCircle2 size={16} />
        <span>{dictionary.localPreviewBoundary}</span>
      </div>

      {section === "overview" ? (
        <Overview
          dictionary={dictionary}
          rooms={rooms}
          onOpenRoom={onOpenRoom}
          onOpenDocument={onOpenDocument}
          onSectionChange={onSectionChange}
        />
      ) : null}
      {section === "inbox" ? <InboxView dictionary={dictionary} onNotify={onNotify} /> : null}
      {section === "documents" ? (
        <DocumentsView dictionary={dictionary} onOpenDocument={onOpenDocument} />
      ) : null}
      {section === "activity" ? <ActivityView dictionary={dictionary} /> : null}
    </main>
  );
}

function Overview({
  dictionary,
  rooms,
  onOpenRoom,
  onOpenDocument,
  onSectionChange,
}: WorkspaceViewProps & {
  rooms: readonly DemoRoom[];
  onOpenRoom: (roomId: string) => void;
  onOpenDocument: (roomId: string) => void;
  onSectionChange: (section: WorkspaceSection) => void;
}) {
  const roomCards = rooms.slice(0, 3);
  const metrics: Array<{ label: string; value: string; Icon: LucideIcon }> = [
    { label: dictionary.activeRooms, value: String(rooms.length), Icon: Hash },
    { label: dictionary.pendingItems, value: "2", Icon: Clock3 },
    { label: dictionary.sharedDocuments, value: "3", Icon: FileText },
  ];
  return (
    <div className="workspace-hub-body overview-layout">
      <section className="workspace-metrics" aria-label={dictionary.overview}>
        {metrics.map(({ label, value, Icon }) => (
          <article className="workspace-metric" key={label}>
            <span>
              <Icon size={17} />
            </span>
            <div>
              <strong>{value}</strong>
              <small>{label}</small>
            </div>
          </article>
        ))}
      </section>

      <section className="workspace-block workspace-recent-rooms">
        <div className="workspace-block-heading">
          <div>
            <span>{dictionary.recentRooms}</span>
            <small>{dictionary.workspaceOverviewSubtitle}</small>
          </div>
        </div>
        <div className="recent-room-grid">
          {roomCards.map((room, index) => (
            <article className="recent-room-card" key={room.id}>
              <span className={`room-card-symbol room-card-symbol-${index + 1}`}>
                <Hash size={17} />
              </span>
              <div>
                <h2>{room.name ?? (room.nameKey === undefined ? "" : dictionary[room.nameKey])}</h2>
                <p>
                  {room.descriptionKey === undefined
                    ? dictionary.roomDescription
                    : dictionary[room.descriptionKey]}
                </p>
              </div>
              <button type="button" onClick={() => onOpenRoom(room.id)}>
                {dictionary.openRoom} <ArrowRight size={15} />
              </button>
            </article>
          ))}
        </div>
      </section>

      <div className="workspace-overview-split">
        <section className="workspace-block">
          <div className="workspace-block-heading">
            <div>
              <span>{dictionary.actionQueue}</span>
              <small>{dictionary.inboxSubtitle}</small>
            </div>
            <button type="button" onClick={() => onSectionChange("inbox")}>
              {dictionary.viewAll}
            </button>
          </div>
          <div className="compact-list">
            <button type="button" onClick={() => onSectionChange("inbox")}>
              <span className="compact-icon is-approval">
                <FileCheck2 size={17} />
              </span>
              <span>
                <strong>{dictionary.approvalItem}</strong>
                <small>{dictionary.needsReview} · 10:30</small>
              </span>
              <ArrowRight size={16} />
            </button>
            <button type="button" onClick={() => onSectionChange("inbox")}>
              <span className="compact-icon">
                <UserRound size={17} />
              </span>
              <span>
                <strong>{dictionary.mentionItem}</strong>
                <small>{dictionary.unreadStatus} · 09:24</small>
              </span>
              <ArrowRight size={16} />
            </button>
          </div>
        </section>

        <section className="workspace-block">
          <div className="workspace-block-heading">
            <div>
              <span>{dictionary.sharedDocuments}</span>
              <small>{dictionary.documentDirectorySubtitle}</small>
            </div>
            <button type="button" onClick={() => onSectionChange("documents")}>
              {dictionary.viewAll}
            </button>
          </div>
          <div className="compact-list document-compact-list">
            <button type="button" onClick={() => onOpenDocument("launch")}>
              <span className="compact-icon">
                <FileText size={17} />
              </span>
              <span>
                <strong>{dictionary.documentProposal}</strong>
                <small>
                  {dictionary.inReview} · {dictionary.updatedToday}
                </small>
              </span>
              <ArrowRight size={16} />
            </button>
            <button type="button" onClick={() => onOpenDocument("research")}>
              <span className="compact-icon">
                <FileText size={17} />
              </span>
              <span>
                <strong>{dictionary.documentResearch}</strong>
                <small>
                  {dictionary.draft} · {dictionary.updatedYesterday}
                </small>
              </span>
              <ArrowRight size={16} />
            </button>
          </div>
        </section>
      </div>
    </div>
  );
}

function InboxView({
  dictionary,
  onNotify,
}: WorkspaceViewProps & { onNotify: (message: string) => void }) {
  const [filter, setFilter] = useState<InboxFilter>("all");
  const [readIds, setReadIds] = useState<readonly string[]>([]);
  const items = [
    {
      id: "mention",
      type: "mentions" as const,
      label: dictionary.mentionItem,
      meta: `09:24 · ${dictionary.mentions}`,
    },
    {
      id: "approval",
      type: "approvals" as const,
      label: dictionary.approvalItem,
      meta: `08:42 · ${dictionary.approvals}`,
    },
    {
      id: "invitation",
      type: "invitations" as const,
      label: dictionary.invitationItem,
      meta: `${dictionary.updatedYesterday} · ${dictionary.invitations}`,
    },
  ];
  const visibleItems = filter === "all" ? items : items.filter((item) => item.type === filter);
  return (
    <div className="workspace-hub-body">
      <div className="filter-bar" role="group" aria-label={dictionary.inbox}>
        {(
          [
            ["all", dictionary.allItems],
            ["mentions", dictionary.mentions],
            ["approvals", dictionary.approvals],
            ["invitations", dictionary.invitations],
          ] as const
        ).map(([value, label]) => (
          <button
            type="button"
            key={value}
            className={filter === value ? "is-active" : ""}
            onClick={() => setFilter(value)}
          >
            {label}
          </button>
        ))}
      </div>
      <section className="workspace-block inbox-list">
        {visibleItems.map((item) => {
          const isRead = readIds.includes(item.id);
          return (
            <article key={item.id} className={isRead ? "is-read" : ""}>
              <span
                className="inbox-status"
                aria-label={isRead ? dictionary.markedRead : dictionary.unreadStatus}
              />
              <div>
                <strong>{item.label}</strong>
                <small>{item.meta}</small>
              </div>
              <button
                type="button"
                disabled={isRead}
                onClick={() => {
                  setReadIds((current) => [...current, item.id]);
                  onNotify(dictionary.markedRead);
                }}
              >
                {isRead ? dictionary.markedRead : dictionary.markAsRead}
              </button>
            </article>
          );
        })}
      </section>
    </div>
  );
}

function DocumentsView({
  dictionary,
  onOpenDocument,
}: WorkspaceViewProps & { onOpenDocument: (roomId: string) => void }) {
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<DocumentFilter>("all");
  const docs = useMemo(
    () => [
      {
        id: "proposal",
        title: dictionary.documentProposal,
        room: dictionary.roomLaunch,
        owner: dictionary.messageLead,
        status: "review" as const,
        statusLabel: dictionary.inReview,
        updated: dictionary.updatedToday,
        roomId: "launch",
      },
      {
        id: "research",
        title: dictionary.documentResearch,
        room: dictionary.roomResearch,
        owner: dictionary.documentResearchOwner,
        status: "draft" as const,
        statusLabel: dictionary.draft,
        updated: dictionary.updatedYesterday,
        roomId: "research",
      },
      {
        id: "brand",
        title: dictionary.documentBrand,
        room: dictionary.roomWebsite,
        owner: "Andy",
        status: "approved" as const,
        statusLabel: dictionary.approved,
        updated: dictionary.updatedYesterday,
        roomId: "website",
      },
    ],
    [dictionary],
  );
  const visibleDocs = docs.filter((doc) => {
    const matchesQuery = doc.title.toLocaleLowerCase().includes(query.trim().toLocaleLowerCase());
    return matchesQuery && (filter === "all" || doc.status === filter);
  });
  return (
    <div className="workspace-hub-body">
      <div className="document-toolbar">
        <label>
          <Search size={16} />
          <input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder={dictionary.searchDocuments}
          />
        </label>
        <select
          value={filter}
          onChange={(event) => setFilter(event.target.value as DocumentFilter)}
          aria-label={dictionary.allStatuses}
        >
          <option value="all">{dictionary.allStatuses}</option>
          <option value="draft">{dictionary.draft}</option>
          <option value="review">{dictionary.inReview}</option>
          <option value="approved">{dictionary.approved}</option>
        </select>
      </div>
      <section className="workspace-block document-directory">
        {visibleDocs.map((doc) => (
          <article key={doc.id}>
            <span className="document-row-icon">
              <FileText size={19} />
            </span>
            <div className="document-row-main">
              <strong>{doc.title}</strong>
              <small>
                <Hash size={12} /> {doc.room}
              </small>
            </div>
            <div className="document-row-owner">
              <small>{dictionary.documentOwner}</small>
              <strong>{doc.owner}</strong>
            </div>
            <div className="document-row-state">
              <span className={`status-pill is-${doc.status}`}>{doc.statusLabel}</span>
              <small>{doc.updated}</small>
            </div>
            <button type="button" onClick={() => onOpenDocument(doc.roomId)}>
              {dictionary.openDocument}
              <ArrowRight size={15} />
            </button>
          </article>
        ))}
      </section>
    </div>
  );
}

function ActivityView({ dictionary }: WorkspaceViewProps) {
  const events: Array<{ label: string; time: string; Icon: LucideIcon }> = [
    { label: dictionary.activityItemOne, time: "10:12", Icon: FileText },
    { label: dictionary.activityItemTwo, time: "09:48", Icon: FileCheck2 },
    { label: dictionary.activityItemThree, time: dictionary.updatedYesterday, Icon: Hash },
  ];
  return (
    <div className="workspace-hub-body activity-view">
      <div className="workspace-hub-boundary is-neutral" role="note">
        <UserRound size={16} />
        <span>{dictionary.activityHumanNote}</span>
      </div>
      <section className="workspace-block activity-timeline">
        {events.map(({ label, time, Icon }) => (
          <article key={label}>
            <span>
              <Icon size={17} />
            </span>
            <div>
              <strong>{label}</strong>
              <small>{time}</small>
            </div>
          </article>
        ))}
      </section>
    </div>
  );
}
