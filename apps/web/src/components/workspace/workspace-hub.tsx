"use client";

import {
  ArrowRight,
  AtSign,
  Clock3,
  FileCheck2,
  FileText,
  FolderKanban,
  Hash,
  Inbox,
  Plus,
  ScrollText,
  UserRound,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { useEffect, useState } from "react";
import type {
  DocumentSummary,
  ProjectSummary,
  SessionContext,
  WorkspaceAuditEvent,
} from "@haloai/contracts";
import { WorkspaceAuditPageSchema } from "@haloai/contracts";
import { HaloSegmented } from "@/components/ui/halo-segmented";
import { HaloEmptyState } from "@/components/ui/halo-empty-state";
import { HaloMetricCard, type HaloMetricTone } from "@/components/ui/halo-metric-card";
import { resolveActiveWorkspace } from "@/lib/active-workspace";
import { apiFetch, ApiClientError } from "@/lib/api-client";
import { formatRelativeTime } from "@/lib/format-relative-time";
import { useShellPreferences } from "@/lib/shell-preferences";
import type { DemoRoom, WorkspaceSection, WorkspaceViewProps } from "./types";
import { WorkspaceDocumentsView } from "./workspace-documents-view";

type InboxFilter = "all" | "mentions" | "approvals" | "invitations";

export function WorkspaceHub({
  dictionary,
  section,
  rooms,
  projects,
  documents,
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
          onOpenRoom={onOpenRoom}
          onOpenDocument={onOpenDocument}
          onSectionChange={onSectionChange}
        />
      ) : null}
      {section === "inbox" ? <InboxView dictionary={dictionary} /> : null}
      {section === "documents" ? (
        <WorkspaceDocumentsView
          dictionary={dictionary}
          documents={documents}
          rooms={rooms}
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
  onOpenRoom,
  onOpenDocument,
  onSectionChange,
}: WorkspaceViewProps & {
  rooms: readonly DemoRoom[];
  projects: readonly ProjectSummary[];
  documents: readonly DocumentSummary[];
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
    { label: dictionary.pendingItems, value: "0", Icon: Clock3, tone: "amber" },
    {
      label: dictionary.sharedDocuments,
      value: String(documents.length),
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
            <p className="compact-empty">{dictionary.emptyInbox}</p>
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
            {documents.slice(0, 2).map((document) => (
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
            ))}
            {documents.length === 0 ? (
              <p className="compact-empty">{dictionary.noDocuments}</p>
            ) : null}
          </div>
        </section>
      </div>
    </div>
  );
}

function InboxView({ dictionary }: WorkspaceViewProps) {
  const [filter, setFilter] = useState<InboxFilter>("all");
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
      <HaloEmptyState icon={<Inbox size={22} />} title={dictionary.emptyInbox} />
    </div>
  );
}

function ActivityView({ dictionary }: WorkspaceViewProps) {
  const { locale } = useShellPreferences();
  const [events, setEvents] = useState<WorkspaceAuditEvent[] | null>(null);
  const [forbidden, setForbidden] = useState(false);

  useEffect(() => {
    let cancelled = false;
    async function load(): Promise<void> {
      try {
        const session = await apiFetch<SessionContext>("/v1/session");
        const workspace = resolveActiveWorkspace(session);
        if (!workspace) {
          if (!cancelled) setEvents([]);
          return;
        }
        const payload = await apiFetch<unknown>(
          `/v1/workspaces/${workspace.id}/audit?page=1&pageSize=20`,
        );
        if (!cancelled) setEvents(WorkspaceAuditPageSchema.parse(payload).items);
      } catch (caught) {
        if (!cancelled) {
          setForbidden(caught instanceof ApiClientError && caught.status === 403);
          setEvents([]);
        }
      }
    }
    void load();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="workspace-hub-body activity-view">
      {events === null ? (
        <p className="halo-loading-copy">{dictionary.loadingActivity}</p>
      ) : events.length === 0 ? (
        <HaloEmptyState
          icon={<ScrollText size={22} />}
          title={dictionary.emptyActivity}
          description={
            forbidden ? dictionary.activityAdminOnly : dictionary.emptyActivityDescription
          }
        />
      ) : (
        <ul className="workspace-activity-list">
          {events.map((event) => (
            <li key={event.id}>
              <code>{event.action}</code>
              <span>{event.actorName ?? event.resourceType}</span>
              <small>{formatRelativeTime(event.occurredAt, locale)}</small>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
