"use client";

import { ArrowRight, FileText, Hash, Plus, Search } from "lucide-react";
import { useMemo, useState } from "react";
import type { DocumentSummary } from "@haloai/contracts";
import type { DemoRoom, WorkspaceViewProps } from "./types";

type DocumentFilter = "all" | "active" | "archived";

export function WorkspaceDocumentsView({
  dictionary,
  documents,
  rooms,
  durable,
  onCreateDocument,
  onOpenDocument,
  onNotify,
  canCreateDocument,
}: WorkspaceViewProps & {
  documents: readonly DocumentSummary[];
  rooms: readonly DemoRoom[];
  durable: boolean;
  onCreateDocument: () => void;
  onOpenDocument: (roomId: string) => void;
  onNotify: (message: string) => void;
  canCreateDocument: boolean;
}) {
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<DocumentFilter>("all");
  const demoDocuments = useMemo(
    () => [
      {
        id: "proposal",
        title: dictionary.documentProposal,
        room: dictionary.roomLaunch,
        owner: dictionary.messageLead,
        status: "active" as const,
        roomId: "launch",
      },
      {
        id: "research",
        title: dictionary.documentResearch,
        room: dictionary.roomResearch,
        owner: dictionary.documentResearchOwner,
        status: "active" as const,
        roomId: "research",
      },
      {
        id: "brand",
        title: dictionary.documentBrand,
        room: dictionary.roomWebsite,
        owner: "Andy",
        status: "archived" as const,
        roomId: "website",
      },
    ],
    [dictionary],
  );
  const storedRows = documents.map((document) => ({
    id: document.id,
    title: document.title,
    room: rooms.find((room) => room.id === document.roomId)?.name ?? dictionary.noRoom,
    owner: document.ownerDisplayName,
    status: document.status,
    roomId: document.roomId,
  }));
  const rows = durable ? storedRows : [...demoDocuments, ...storedRows];
  const visibleRows = rows.filter(
    (row) =>
      row.title.toLocaleLowerCase().includes(query.trim().toLocaleLowerCase()) &&
      (filter === "all" || row.status === filter),
  );

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
          <option value="active">{dictionary.draft}</option>
          <option value="archived">{dictionary.approved}</option>
        </select>
        <button
          type="button"
          className="primary-button"
          onClick={onCreateDocument}
          disabled={!canCreateDocument}
        >
          <Plus size={16} />
          {dictionary.newDocument}
        </button>
      </div>
      <section className="workspace-block document-directory">
        {visibleRows.map((document) => (
          <article key={document.id}>
            <span className="document-row-icon">
              <FileText size={19} />
            </span>
            <div className="document-row-main">
              <strong>{document.title}</strong>
              <small>
                <Hash size={12} /> {document.room}
              </small>
            </div>
            <div className="document-row-owner">
              <small>{dictionary.documentOwner}</small>
              <strong>{document.owner}</strong>
            </div>
            <div className="document-row-state">
              <span
                className={`status-pill is-${document.status === "active" ? "draft" : "approved"}`}
              >
                {document.status === "active" ? dictionary.draft : dictionary.approved}
              </span>
            </div>
            <button
              type="button"
              onClick={() =>
                document.roomId
                  ? onOpenDocument(document.roomId)
                  : onNotify(dictionary.metadataOnlyNotice)
              }
            >
              {dictionary.openDocument}
              <ArrowRight size={15} />
            </button>
          </article>
        ))}
        {visibleRows.length === 0 ? (
          <p className="document-empty-copy">{dictionary.noDocuments}</p>
        ) : null}
      </section>
    </div>
  );
}
