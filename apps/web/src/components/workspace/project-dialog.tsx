"use client";

import { FolderKanban, Plus, ShieldCheck, X } from "lucide-react";
import type { FormEventHandler } from "react";
import { HaloDialog } from "@/components/ui/halo-dialog";
import type { WorkspaceViewProps } from "./types";

interface ProjectDialogProps extends WorkspaceViewProps {
  onClose: () => void;
  onSubmit: FormEventHandler<HTMLFormElement>;
}

export function ProjectDialog({ dictionary, onClose, onSubmit }: ProjectDialogProps) {
  return (
    <HaloDialog
      open
      title={dictionary.createProjectTitle}
      description={dictionary.createProjectSubtitle}
      icon={<FolderKanban size={18} />}
      onClose={onClose}
      closeLabel={dictionary.cancel}
    >
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
          <textarea name="goal" maxLength={2000} placeholder={dictionary.projectGoalPlaceholder} />
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
    </HaloDialog>
  );
}
