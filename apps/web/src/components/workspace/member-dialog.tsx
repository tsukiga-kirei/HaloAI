import { Bot, Plus, ShieldCheck, UserRoundPlus, Users, X } from "lucide-react";
import type { FormEventHandler, MouseEventHandler } from "react";
import type { WorkspaceViewProps } from "./types";

interface MemberDialogProps extends WorkspaceViewProps {
  kind: "human" | "agent";
  onKindChange: (kind: "human" | "agent") => void;
  onClose: () => void;
  onSubmit: FormEventHandler<HTMLFormElement>;
}

export function MemberDialog({
  dictionary,
  kind,
  onKindChange,
  onClose,
  onSubmit,
}: MemberDialogProps) {
  const closeFromBackdrop: MouseEventHandler<HTMLDivElement> = (event) => {
    if (event.currentTarget === event.target) onClose();
  };

  return (
    <div className="dialog-backdrop" onMouseDown={closeFromBackdrop}>
      <div className="member-dialog" role="dialog" aria-modal="true" aria-labelledby="member-dialog-title">
        <div className="dialog-heading">
          <div>
            <span className="dialog-icon">
              <UserRoundPlus size={20} />
            </span>
            <div>
              <h2 id="member-dialog-title">{dictionary.addTeammate}</h2>
              <p>{dictionary.teammateSubtitle}</p>
            </div>
          </div>
          <button type="button" className="icon-button" onClick={onClose} aria-label={dictionary.cancel}>
            <X size={19} />
          </button>
        </div>

        <div className="member-kind-tabs">
          <button
            type="button"
            className={kind === "human" ? "is-active" : ""}
            onClick={() => onKindChange("human")}
          >
            <Users size={17} /> {dictionary.human}
          </button>
          <button
            type="button"
            className={kind === "agent" ? "is-active" : ""}
            onClick={() => onKindChange("agent")}
          >
            <Bot size={17} /> {dictionary.aiTeammate}
          </button>
        </div>

        <form onSubmit={onSubmit}>
          <label>
            <span>{dictionary.name}</span>
            <input name="name" required autoFocus placeholder={kind === "agent" ? "Atlas" : "Alex"} />
          </label>
          <label>
            <span>{dictionary.role}</span>
            <input name="role" placeholder={dictionary.rolePlaceholder} />
          </label>
          {kind === "agent" ? (
            <>
              <label>
                <span>{dictionary.model}</span>
                <select name="model" defaultValue="workspace-default">
                  <option value="workspace-default">{dictionary.modelWorkspaceDefault}</option>
                  <option value="openai-compatible">{dictionary.modelOpenAICompatible}</option>
                  <option value="local">{dictionary.modelLocalPrivate}</option>
                </select>
              </label>
              <label>
                <span>{dictionary.instructions}</span>
                <textarea name="instructions" rows={4} placeholder={dictionary.instructionsPlaceholder} />
              </label>
            </>
          ) : null}
          <div className="security-note">
            <ShieldCheck size={16} /> {dictionary.privacyNote}
          </div>
          <div className="dialog-actions">
            <button type="button" className="secondary-button" onClick={onClose}>
              {dictionary.cancel}
            </button>
            <button type="submit" className="primary-button">
              <Plus size={16} /> {dictionary.create}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
