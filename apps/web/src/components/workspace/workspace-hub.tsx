"use client";

import {
  ArrowRight,
  AtSign,
  Check,
  Clock3,
  FileCheck2,
  FileText,
  FolderKanban,
  Hash,
  Inbox,
  Plus,
  UserRound,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { useState } from "react";
import type { DocumentSummary, ProjectSummary } from "@haloai/contracts";
import { HaloSegmented } from "@/components/ui/halo-segmented";
import { HaloMetricCard, type HaloMetricTone } from "@/components/ui/halo-metric-card";
import type { DemoRoom, WorkspaceSection, WorkspaceViewProps } from "./types";
import { WorkspaceDocumentsView } from "./workspace-documents-view";

type InboxFilter = "all" | "mentions" | "approvals" | "invitations";

export function WorkspaceHub({
  dictionary,
  section,
  rooms,
  projects,
  documents,
  durable,
  canCreateProject,
  canCreateArtifact,
  onSectionChange,
  onCreateRoom,
  onCreateProject,
  onCreateDocument,
  onOpenRoom,
  onOpenDocument,
  onNotify,
}: WorkspaceViewProps & {
  section: Exclude<WorkspaceSection, "room">;
  rooms: readonly DemoRoom[];
  projects: readonly ProjectSummary[];
  documents: readonly DocumentSummary[];
  durable: boolean;
  canCreateProject: boolean;
  canCreateArtifact: boolean;
  onSectionChange: (section: WorkspaceSection) => void;
  onCreateRoom: () => void;
  onCreateProject: () => void;
  onCreateDocument: () => void;
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

  return (
    <main className="workspace-hub" aria-labelledby="workspace-hub-title">
      <header className="workspace-hub-header">
        <h1 id="workspace-hub-title">{title}</h1>
        <div className="workspace-hub-actions">
          <button
            type="button"
            className="secondary-button"
            onClick={onCreateProject}
            disabled={!canCreateProject}
          >
            <FolderKanban size={16} /> {dictionary.newProject}
          </button>
          <button
            type="button"
            className="primary-button workspace-hub-create"
            onClick={onCreateRoom}
            disabled={!canCreateArtifact && !canCreateProject}
          >
            <Plus size={16} /> {dictionary.newRoom}
          </button>
        </div>
      </header>

      {section === "overview" ? (
        <Overview
          dictionary={dictionary}
          rooms={rooms}
          projects={projects}
          documents={documents}
          durable={durable}
          onOpenRoom={onOpenRoom}
          onOpenDocument={onOpenDocument}
          onSectionChange={onSectionChange}
        />
      ) : null}
      {section === "inbox" ? <InboxView dictionary={dictionary} onNotify={onNotify} /> : null}
      {section === "documents" ? (
        <WorkspaceDocumentsView
          dictionary={dictionary}
          documents={documents}
          rooms={rooms}
          durable={durable}
          onCreateDocument={onCreateDocument}
          canCreateDocument={canCreateArtifact}
          onOpenDocument={onOpenDocument}
          onNotify={onNotify}
        />
      ) : null}
      {section === "activity" ? <ActivityView dictionary={dictionary} /> : null}
    </main>
  );
}

function Overview({
  dictionary,
  rooms,
  projects,
  documents,
  durable,
  onOpenRoom,
  onOpenDocument,
  onSectionChange,
}: WorkspaceViewProps & {
  rooms: readonly DemoRoom[];
  projects: readonly ProjectSummary[];
  documents: readonly DocumentSummary[];
  durable: boolean;
  onOpenRoom: (roomId: string) => void;
  onOpenDocument: (roomId: string) => void;
  onSectionChange: (section: WorkspaceSection) => void;
}) {
  const roomCards = rooms.slice(0, 3);
  const metrics: Array<{
    label: string;
    value: string;
    Icon: LucideIcon;
    tone: HaloMetricTone;
  }> = [
    {
      label: dictionary.projectRooms,
      value: String(projects.length),
      Icon: FolderKanban,
      tone: "violet",
    },
    { label: dictionary.activeRooms, value: String(rooms.length), Icon: Hash, tone: "blue" },
    { label: dictionary.pendingItems, value: "2", Icon: Clock3, tone: "amber" },
    {
      label: dictionary.sharedDocuments,
      value: String(durable ? documents.length : 3),
      Icon: FileText,
      tone: "mint",
    },
  ];
  return (
    <div className="workspace-hub-body overview-layout">
      <section className="workspace-metrics" aria-label={dictionary.overview}>
        {metrics.map(({ label, value, Icon, tone }) => (
          <HaloMetricCard
            key={label}
            icon={<Icon size={20} />}
            label={label}
            value={value}
            tone={tone}
          />
        ))}
      </section>

      <section className="workspace-block workspace-recent-rooms">
        <div className="workspace-block-heading">
          <span>{dictionary.recentRooms}</span>
        </div>
        <div className="recent-room-grid">
          {roomCards.map((room) => (
            <article className="recent-room-card" key={room.id}>
              <span className="room-card-symbol">
                <Hash size={16} />
              </span>
              <div>
                <h2>{room.name ?? (room.nameKey === undefined ? "" : dictionary[room.nameKey])}</h2>
              </div>
              <button type="button" onClick={() => onOpenRoom(room.id)}>
                {dictionary.openRoom} <ArrowRight size={14} />
              </button>
            </article>
          ))}
        </div>
      </section>

      <div className="workspace-overview-split">
        <section className="workspace-block">
          <div className="workspace-block-heading">
            <span>{dictionary.actionQueue}</span>
            <button type="button" onClick={() => onSectionChange("inbox")}>
              {dictionary.viewAll} <ArrowRight size={14} />
            </button>
          </div>
          <div className="compact-list">
            <button type="button" onClick={() => onSectionChange("inbox")}>
              <span className="compact-icon is-approval">
                <FileCheck2 size={16} />
              </span>
              <span>
                <strong>{dictionary.approvalItem}</strong>
                <small>10:30</small>
              </span>
              <ArrowRight size={16} />
            </button>
            <button type="button" onClick={() => onSectionChange("inbox")}>
              <span className="compact-icon">
                <UserRound size={16} />
              </span>
              <span>
                <strong>{dictionary.mentionItem}</strong>
                <small>09:24</small>
              </span>
              <ArrowRight size={16} />
            </button>
          </div>
        </section>

        <section className="workspace-block">
          <div className="workspace-block-heading">
            <span>{dictionary.sharedDocuments}</span>
            <button type="button" onClick={() => onSectionChange("documents")}>
              {dictionary.viewAll} <ArrowRight size={14} />
            </button>
          </div>
          <div className="compact-list document-compact-list">
            {durable ? (
              documents.slice(0, 2).map((document) => (
                <button
                  type="button"
                  key={document.id}
                  onClick={() => (document.roomId ? onOpenDocument(document.roomId) : undefined)}
                >
                  <span className="compact-icon">
                    <FileText size={16} />
                  </span>
                  <span>
                    <strong>{document.title}</strong>
                    <small>{document.ownerDisplayName}</small>
                  </span>
                  <ArrowRight size={16} />
                </button>
              ))
            ) : (
              <>
                <button type="button" onClick={() => onOpenDocument("launch")}>
                  <span className="compact-icon">
                    <FileText size={16} />
                  </span>
                  <span>
                    <strong>{dictionary.documentProposal}</strong>
                    <small>{dictionary.inReview}</small>
                  </span>
                  <ArrowRight size={16} />
                </button>
                <button type="button" onClick={() => onOpenDocument("research")}>
                  <span className="compact-icon">
                    <FileText size={16} />
                  </span>
                  <span>
                    <strong>{dictionary.documentResearch}</strong>
                    <small>{dictionary.draft}</small>
                  </span>
                  <ArrowRight size={16} />
                </button>
              </>
            )}
            {durable && documents.length === 0 ? (
              <p className="compact-empty">{dictionary.noDocuments}</p>
            ) : null}
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
  const typeLabel = {
    mentions: dictionary.mentions,
    approvals: dictionary.approvals,
    invitations: dictionary.invitations,
  } as const;
  return (
    <div className="workspace-hub-body">
      <HaloSegmented
        ariaLabel={dictionary.inbox}
        value={filter}
        onChange={setFilter}
        items={[
          { value: "all", label: dictionary.allItems, icon: Inbox },
          { value: "mentions", label: dictionary.mentions, icon: AtSign },
          { value: "approvals", label: dictionary.approvals, icon: FileCheck2 },
          { value: "invitations", label: dictionary.invitations, icon: UserRound },
        ]}
      />
      <div className="data-table-wrap">
        <table className="data-table">
          <thead>
            <tr>
              <th>{dictionary.columnContent}</th>
              <th>{dictionary.columnType}</th>
              <th>{dictionary.columnTime}</th>
              <th>{dictionary.columnAction}</th>
            </tr>
          </thead>
          <tbody>
            {visibleItems.map((item) => {
              const isRead = readIds.includes(item.id);
              return (
                <tr key={item.id} className={isRead ? "is-read" : ""}>
                  <td>
                    <strong className={isRead ? "" : "is-unread"}>{item.label}</strong>
                  </td>
                  <td>
                    <span className={`halo-badge is-${item.type}`}>{typeLabel[item.type]}</span>
                  </td>
                  <td>{item.meta.split(" · ")[0]}</td>
                  <td>
                    <button
                      type="button"
                      className="table-action is-ghost"
                      disabled={isRead}
                      onClick={() => {
                        setReadIds((current) => [...current, item.id]);
                        onNotify(dictionary.markedRead);
                      }}
                    >
                      <Check size={14} />
                      {isRead ? dictionary.markedRead : dictionary.markAsRead}
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
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
      <div className="data-table-wrap">
        <table className="data-table">
          <thead>
            <tr>
              <th>{dictionary.columnContent}</th>
              <th>{dictionary.columnTime}</th>
            </tr>
          </thead>
          <tbody>
            {events.map(({ label, time, Icon }) => (
              <tr key={label}>
                <td>
                  <span className="table-title">
                    <Icon size={16} />
                    {label}
                  </span>
                </td>
                <td>{time}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
