import { FolderKanban, Plus, ShieldCheck, X } from "lucide-react";
import type { FormEventHandler } from "react";
import type { WorkspaceViewProps } from "./types";

interface ProjectDialogProps extends WorkspaceViewProps {
  onClose: () => void;
  onSubmit: FormEventHandler<HTMLFormElement>;
}

export function ProjectDialog({ dictionary, onClose, onSubmit }: ProjectDialogProps) {
  return (
    <div className="dialog-backdrop" role="presentation" onMouseDown={onClose}>
      <section
        className="member-dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="create-project-title"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <div className="dialog-heading">
          <div>
            <span className="dialog-icon">
              <FolderKanban size={18} />
            </span>
            <div>
              <h2 id="create-project-title">{dictionary.createProjectTitle}</h2>
              <p>{dictionary.createProjectSubtitle}</p>
            </div>
          </div>
          <button
            type="button"
            className="icon-button"
            onClick={onClose}
            aria-label={dictionary.cancel}
          >
            <X size={18} />
          </button>
        </div>
        <form onSubmit={onSubmit}>
          <label>
            {dictionary.projectName}
            <input
              name="name"
              required
              maxLength={200}
              autoFocus
              placeholder={dictionary.projectNamePlaceholder}
            />
          </label>
          <label>
            {dictionary.projectGoal}
            <textarea
              name="goal"
              maxLength={2000}
              placeholder={dictionary.projectGoalPlaceholder}
            />
          </label>
          <label>
            {dictionary.expectedArtifact}
            <input
              name="expectedArtifact"
              maxLength={2000}
              placeholder={dictionary.expectedArtifactPlaceholder}
            />
          </label>
          <p className="security-note">
            <ShieldCheck size={15} />
            {dictionary.privacyNote}
          </p>
          <div className="dialog-actions">
            <button type="button" className="secondary-button" onClick={onClose}>
              <X size={16} />
              {dictionary.cancel}
            </button>
            <button type="submit" className="primary-button">
              <Plus size={16} />
              {dictionary.createProjectTitle}
            </button>
          </div>
        </form>
      </section>
    </div>
  );
}
