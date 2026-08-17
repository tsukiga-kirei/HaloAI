import { Hash, Plus, ShieldCheck, X } from "lucide-react";
import type { FormEventHandler } from "react";
import type { ProjectSummary } from "@haloai/contracts";
import type { WorkspaceViewProps } from "./types";

interface RoomDialogProps extends WorkspaceViewProps {
  onClose: () => void;
  onSubmit: FormEventHandler<HTMLFormElement>;
  projects: readonly ProjectSummary[];
}

export function RoomDialog({ dictionary, projects, onClose, onSubmit }: RoomDialogProps) {
  return (
    <div className="dialog-backdrop" role="presentation" onMouseDown={onClose}>
      <section
        className="member-dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="create-room-title"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <div className="dialog-heading">
          <div>
            <span className="dialog-icon">
              <Hash size={18} />
            </span>
            <div>
              <h2 id="create-room-title">{dictionary.createRoomTitle}</h2>
              <p>{dictionary.createRoomSubtitle}</p>
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
            {dictionary.selectProject}
            <select name="projectId" required>
              {projects.map((project) => (
                <option key={project.id} value={project.id}>
                  {project.name}
                </option>
              ))}
            </select>
          </label>
          <label>
            {dictionary.roomName}
            <input
              name="name"
              required
              maxLength={48}
              autoFocus
              placeholder={dictionary.roomNamePlaceholder}
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
          <label>
            {dictionary.roomVisibility}
            <select name="visibility" defaultValue="private">
              <option value="private">{dictionary.privateRoom}</option>
              <option value="workspace">{dictionary.workspaceRoom}</option>
            </select>
          </label>
          <label>
            {dictionary.roomGoal}
            <textarea
              name="goal"
              required
              maxLength={240}
              placeholder={dictionary.roomGoalPlaceholder}
            />
          </label>
          <p className="security-note">
            <ShieldCheck size={15} />
            {dictionary.teammateSubtitle}
          </p>
          <div className="dialog-actions">
            <button type="button" className="secondary-button" onClick={onClose}>
              <X size={16} />
              {dictionary.cancel}
            </button>
            <button type="submit" className="primary-button">
              <Plus size={16} />
              {dictionary.createRoomTitle}
            </button>
          </div>
        </form>
      </section>
    </div>
  );
}
