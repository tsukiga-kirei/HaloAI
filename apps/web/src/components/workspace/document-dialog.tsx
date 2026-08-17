"use client";

import { FilePlus2, Plus, ShieldCheck, X } from "lucide-react";
import { type FormEventHandler, useState } from "react";
import type { ProjectSummary } from "@haloai/contracts";
import { HaloDialog } from "@/components/ui/halo-dialog";
import { HaloSelect } from "@/components/ui/halo-select";
import type { DemoRoom, WorkspaceViewProps } from "./types";

interface DocumentDialogProps extends WorkspaceViewProps {
  projects: readonly ProjectSummary[];
  rooms: readonly DemoRoom[];
  onClose: () => void;
  onSubmit: FormEventHandler<HTMLFormElement>;
}

const NONE_ROOM = "__none__";

export function DocumentDialog({
  dictionary,
  projects,
  rooms,
  onClose,
  onSubmit,
}: DocumentDialogProps) {
  const [selectedProjectId, setSelectedProjectId] = useState(projects[0]?.id ?? "");
  const [selectedRoomId, setSelectedRoomId] = useState(NONE_ROOM);
  const projectRooms = rooms.filter((room) => room.projectId === selectedProjectId);

  return (
    <HaloDialog
      open
      title={dictionary.createDocumentTitle}
      description={dictionary.createDocumentSubtitle}
      icon={<FilePlus2 size={18} />}
      onClose={onClose}
      closeLabel={dictionary.cancel}
    >
      <form
        onSubmit={(event) => {
          const roomField = event.currentTarget.elements.namedItem("roomId");
          if (roomField instanceof HTMLInputElement && roomField.value === NONE_ROOM) {
            roomField.value = "";
          }
          onSubmit(event);
        }}
      >
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
          <HaloSelect
            name="projectId"
            value={selectedProjectId}
            onValueChange={(next) => {
              setSelectedProjectId(next);
              setSelectedRoomId(NONE_ROOM);
            }}
            ariaLabel={dictionary.selectProject}
            options={projects.map((project) => ({ value: project.id, label: project.name }))}
          />
        </label>
        <label>
          {dictionary.optionalRoom}
          <HaloSelect
            name="roomId"
            value={selectedRoomId}
            onValueChange={setSelectedRoomId}
            ariaLabel={dictionary.optionalRoom}
            options={[
              { value: NONE_ROOM, label: dictionary.noRoom },
              ...projectRooms.map((room) => ({
                value: room.id,
                label: room.name ?? room.id,
              })),
            ]}
          />
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
    </HaloDialog>
  );
}
