"use client";

import { ArrowRight, FileText, Plus, Search } from "lucide-react";
import { useState } from "react";
import type { DocumentSummary } from "@haloai/contracts";
import { HaloSelect } from "@/components/ui/halo-select";
import type { DemoRoom, WorkspaceViewProps } from "./types";

type DocumentFilter = "all" | "active" | "archived";

export function WorkspaceDocumentsView({
  dictionary,
  documents,
  rooms,
  onCreateDocument,
  onOpenDocument,
  onNotify,
  canCreateDocument,
}: WorkspaceViewProps & {
  documents: readonly DocumentSummary[];
  rooms: readonly DemoRoom[];
  onCreateDocument: () => void;
  onOpenDocument: (roomId: string) => void;
  onNotify: (message: string) => void;
  canCreateDocument: boolean;
}) {
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<DocumentFilter>("all");
  const rows = documents.map((document) => ({
    id: document.id,
    title: document.title,
    room: rooms.find((room) => room.id === document.roomId)?.name ?? dictionary.noRoom,
    owner: document.ownerDisplayName,
    status: document.status,
    roomId: document.roomId,
  }));
  const visibleRows = rows.filter(
    (row) =>
      row.title.toLocaleLowerCase().includes(query.trim().toLocaleLowerCase()) &&
      (filter === "all" || row.status === filter),
  );

  return (
    <div className="workspace-hub-body">
      <div className="document-toolbar">
        <label className="field">
          <Search size={16} />
          <input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder={dictionary.searchDocuments}
            aria-label={dictionary.searchDocuments}
          />
        </label>
        <div className="document-toolbar-actions">
          <HaloSelect
            compact
            value={filter}
            onValueChange={(next) => setFilter(next as DocumentFilter)}
            ariaLabel={dictionary.allStatuses}
            options={[
              { value: "all", label: dictionary.allStatuses },
              { value: "active", label: dictionary.draft },
              { value: "archived", label: dictionary.approved },
            ]}
          />
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
      </div>
      <div className="data-table-wrap">
        <table className="data-table">
          <thead>
            <tr>
              <th>{dictionary.documents}</th>
              <th>{dictionary.rooms}</th>
              <th>{dictionary.documentOwner}</th>
              <th>{dictionary.columnType}</th>
              <th>{dictionary.columnAction}</th>
            </tr>
          </thead>
          <tbody>
            {visibleRows.map((document) => (
              <tr key={document.id}>
                <td>
                  <span className="table-title">
                    <FileText size={16} />
                    {document.title}
                  </span>
                </td>
                <td>{document.room}</td>
                <td>{document.owner}</td>
                <td>
                  <span
                    className={`halo-badge${document.status === "archived" ? " is-approvals" : ""}`}
                  >
                    {document.status === "active" ? dictionary.draft : dictionary.approved}
                  </span>
                </td>
                <td>
                  <button
                    type="button"
                    className="table-action is-ghost"
                    onClick={() =>
                      document.roomId
                        ? onOpenDocument(document.roomId)
                        : onNotify(dictionary.metadataOnlyNotice)
                    }
                  >
                    {dictionary.openDocument} <ArrowRight size={14} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {visibleRows.length === 0 ? (
          <p className="document-empty-copy">{dictionary.noDocuments}</p>
        ) : null}
      </div>
    </div>
  );
}
