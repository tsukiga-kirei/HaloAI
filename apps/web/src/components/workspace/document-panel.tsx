import {
  Check,
  FileText,
  Link2,
  MessageCircleMore,
  MoreHorizontal,
  WandSparkles,
  X,
} from "lucide-react";
import { Avatar } from "./primitives";
import type { DocumentTab, WorkspaceViewProps } from "./types";

interface DocumentPanelProps extends WorkspaceViewProps {
  tab: DocumentTab;
  dirty: boolean;
  suggestionApplied: boolean;
  onTabChange: (tab: DocumentTab) => void;
  onDirtyChange: (dirty: boolean) => void;
  onApplySuggestion: () => void;
  onCloseMobile: () => void;
}

export function DocumentPanel({
  dictionary,
  tab,
  dirty,
  suggestionApplied,
  onTabChange,
  onDirtyChange,
  onApplySuggestion,
  onCloseMobile,
}: DocumentPanelProps) {
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
            <strong>{dictionary.documentSubtitle}</strong>
          </div>
        </div>
        <div className="document-actions">
          <span className={`save-state ${dirty ? "is-dirty" : ""}`}>
            <i /> {dirty ? dictionary.editing : dictionary.saved}
          </span>
          <button
            type="button"
            className="secondary-button"
            onClick={() => onDirtyChange(false)}
            disabled={!dirty}
          >
            {dictionary.save}
          </button>
          <button type="button" className="icon-button" aria-label={dictionary.moreActions}>
            <MoreHorizontal size={18} />
          </button>
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
            {documentTab === "activity" ? <span>3</span> : null}
          </button>
        ))}
      </div>

      {tab === "document" ? (
        <div className="document-scroll">
          <article className="document-canvas">
            <div className="document-kicker">
              <span className="draft-pill">{dictionary.draft}</span>
              <div className="doc-collaborators">
                <Avatar initials="ML" color="coral" size="small" />
                <Avatar initials="M" color="cyan" ai size="small" />
              </div>
            </div>
            <h2 contentEditable suppressContentEditableWarning onInput={() => onDirtyChange(true)}>
              {dictionary.docHeading}
            </h2>
            <p
              className="document-lede"
              contentEditable
              suppressContentEditableWarning
              onInput={() => onDirtyChange(true)}
            >
              {dictionary.docIntro}
            </p>

            <div className="document-divider" />

            <section className="document-section">
              <span className="section-number">01</span>
              <h3 contentEditable suppressContentEditableWarning onInput={() => onDirtyChange(true)}>
                {dictionary.docSectionOne}
              </h3>
              <p contentEditable suppressContentEditableWarning onInput={() => onDirtyChange(true)}>
                {dictionary.docSectionOneBody}
              </p>
            </section>

            <section className="document-section">
              <span className="section-number">02</span>
              <h3 contentEditable suppressContentEditableWarning onInput={() => onDirtyChange(true)}>
                {dictionary.docSectionTwo}
              </h3>
              <p contentEditable suppressContentEditableWarning onInput={() => onDirtyChange(true)}>
                {dictionary.docSectionTwoBody}
              </p>
            </section>

            <aside className={`ai-suggestion ${suggestionApplied ? "is-applied" : ""}`}>
              <div className="suggestion-heading">
                <span>
                  <WandSparkles size={15} /> {dictionary.aiSuggestion}
                </span>
                <span className="suggestion-author">
                  <Avatar initials="M" color="cyan" ai size="small" /> Muse
                </span>
              </div>
              <p>{dictionary.suggestionText}</p>
              <button type="button" onClick={onApplySuggestion} disabled={suggestionApplied}>
                <Check size={14} />
                {suggestionApplied ? dictionary.applied : dictionary.applySuggestion}
              </button>
            </aside>

            <section className="document-sources">
              <h3>{dictionary.sources}</h3>
              <a href="#source-interviews">
                <Link2 size={14} /> {dictionary.sourceOne}
              </a>
              <a href="#source-model">
                <Link2 size={14} /> {dictionary.sourceTwo}
              </a>
            </section>
          </article>
        </div>
      ) : (
        <div className="document-empty-state">
          {tab === "activity" ? <MessageCircleMore size={32} /> : <FileText size={32} />}
          <strong>{dictionary[tab]}</strong>
          <p>{tab === "activity" ? dictionary.suggestionText : dictionary.draft}</p>
        </div>
      )}
    </aside>
  );
}
