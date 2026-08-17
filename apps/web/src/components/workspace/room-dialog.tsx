"use client";

import { Hash, Plus, X } from "lucide-react";
import { type FormEventHandler, useState } from "react";
import type { ProjectSummary } from "@haloai/contracts";
import { HaloDialog } from "@/components/ui/halo-dialog";
import { HaloSelect } from "@/components/ui/halo-select";
import type { WorkspaceViewProps } from "./types";

interface RoomDialogProps extends WorkspaceViewProps {
  onClose: () => void;
  onSubmit: FormEventHandler<HTMLFormElement>;
  projects: readonly ProjectSummary[];
}

export function RoomDialog({ dictionary, projects, onClose, onSubmit }: RoomDialogProps) {
  const [projectId, setProjectId] = useState(projects[0]?.id ?? "");
  const [visibility, setVisibility] = useState("private");

  return (
    <HaloDialog
      open
      title={dictionary.createRoomTitle}
      description={dictionary.createRoomSubtitle}
      icon={<Hash size={18} />}
      onClose={onClose}
      closeLabel={dictionary.cancel}
    >
      <form onSubmit={onSubmit}>
        <label>
          {dictionary.selectProject}
          <HaloSelect
            name="projectId"
            value={projectId}
            onValueChange={setProjectId}
            ariaLabel={dictionary.selectProject}
            options={projects.map((project) => ({ value: project.id, label: project.name }))}
          />
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
          <HaloSelect
            name="visibility"
            value={visibility}
            onValueChange={setVisibility}
            ariaLabel={dictionary.roomVisibility}
            options={[
              { value: "private", label: dictionary.privateRoom },
              { value: "workspace", label: dictionary.workspaceRoom },
            ]}
          />
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
    </HaloDialog>
  );
}
