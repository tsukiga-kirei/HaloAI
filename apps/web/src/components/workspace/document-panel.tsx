import { FileText, MessageCircleMore, X } from "lucide-react";
import type { DocumentTab, WorkspaceViewProps } from "./types";

interface DocumentPanelProps extends WorkspaceViewProps {
  tab: DocumentTab;
  onTabChange: (tab: DocumentTab) => void;
  onCloseMobile: () => void;
}

export function DocumentPanel({ dictionary, tab, onTabChange, onCloseMobile }: DocumentPanelProps) {
  return (
    <aside className="document-panel" aria-label={dictionary.sharedDocument}>
      <header className="document-header">
        <div className="document-title-row">
          <button
            type="button"
            className="icon-button mobile-only"
            aria-label={dictionary.chat}
            onClick={onCloseMobile}
          >
            <X size={19} />
          </button>
          <div className="document-icon">
            <FileText size={18} />
          </div>
          <div>
            <span>{dictionary.sharedDocument}</span>
            <strong>{dictionary.sharedDocument}</strong>
          </div>
        </div>
      </header>

      <div className="document-tabs" role="tablist">
        {(["document", "activity", "versions"] as const).map((documentTab) => (
          <button
            type="button"
            role="tab"
            aria-selected={tab === documentTab}
            className={tab === documentTab ? "is-active" : ""}
            key={documentTab}
            onClick={() => onTabChange(documentTab)}
          >
            {dictionary[documentTab]}
          </button>
        ))}
      </div>

      <div className="document-empty-state" role="tabpanel">
        {tab === "activity" ? <MessageCircleMore size={32} /> : <FileText size={32} />}
        <strong>{tab === "document" ? dictionary.sharedDocument : dictionary[tab]}</strong>
        <p>
          {tab === "document"
            ? dictionary.metadataOnlyNotice
            : tab === "activity"
              ? dictionary.activityDescription
              : dictionary.versionsDescription}
        </p>
      </div>
    </aside>
  );
}
