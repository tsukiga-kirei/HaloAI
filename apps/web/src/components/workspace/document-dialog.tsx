import { FilePlus2, Plus, ShieldCheck, X } from "lucide-react";
import { type FormEventHandler, useState } from "react";
import type { ProjectSummary } from "@haloai/contracts";
import type { DemoRoom, WorkspaceViewProps } from "./types";

interface DocumentDialogProps extends WorkspaceViewProps {
  projects: readonly ProjectSummary[];
  rooms: readonly DemoRoom[];
  onClose: () => void;
  onSubmit: FormEventHandler<HTMLFormElement>;
}

export function DocumentDialog({
  dictionary,
  projects,
  rooms,
  onClose,
  onSubmit,
}: DocumentDialogProps) {
  const [selectedProjectId, setSelectedProjectId] = useState(projects[0]?.id ?? "");
  const projectRooms = rooms.filter((room) => room.projectId === selectedProjectId);
  return (
    <div className="dialog-backdrop" role="presentation" onMouseDown={onClose}>
      <section
        className="member-dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="create-document-title"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <div className="dialog-heading">
          <div>
            <span className="dialog-icon">
              <FilePlus2 size={18} />
            </span>
            <div>
              <h2 id="create-document-title">{dictionary.createDocumentTitle}</h2>
              <p>{dictionary.createDocumentSubtitle}</p>
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
            {dictionary.documentTitle}
            <input
              name="title"
              required
              maxLength={300}
              autoFocus
              placeholder={dictionary.documentTitlePlaceholder}
            />
          </label>
          <label>
            {dictionary.selectProject}
            <select
              name="projectId"
              required
              value={selectedProjectId}
              onChange={(event) => setSelectedProjectId(event.target.value)}
            >
              {projects.map((project) => (
                <option key={project.id} value={project.id}>
                  {project.name}
                </option>
              ))}
            </select>
          </label>
          <label>
            {dictionary.optionalRoom}
            <select name="roomId">
              <option value="">{dictionary.noRoom}</option>
              {projectRooms.map((room) => (
                <option key={room.id} value={room.id}>
                  {room.name ?? room.id}
                </option>
              ))}
            </select>
          </label>
          <p className="security-note">
            <ShieldCheck size={15} />
            {dictionary.metadataOnlyNotice}
          </p>
          <div className="dialog-actions">
            <button type="button" className="secondary-button" onClick={onClose}>
              <X size={16} />
              {dictionary.cancel}
            </button>
            <button type="submit" className="primary-button">
              <Plus size={16} />
              {dictionary.createDocumentTitle}
            </button>
          </div>
        </form>
      </section>
    </div>
  );
}
