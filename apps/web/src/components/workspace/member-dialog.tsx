"use client";

import { Bot, Plus, ShieldCheck, UserRoundPlus, Users, X } from "lucide-react";
import { type FormEventHandler, useState } from "react";
import { HaloDialog } from "@/components/ui/halo-dialog";
import { HaloSegmented } from "@/components/ui/halo-segmented";
import { HaloSelect } from "@/components/ui/halo-select";
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
  const [model, setModel] = useState("workspace-default");

  return (
    <HaloDialog
      open
      title={dictionary.addTeammate}
      icon={<UserRoundPlus size={20} />}
      onClose={onClose}
      closeLabel={dictionary.cancel}
    >
      <HaloSegmented
        fill
        ariaLabel={dictionary.addTeammate}
        value={kind}
        onChange={onKindChange}
        items={[
          { value: "human", label: dictionary.human, icon: Users },
          { value: "agent", label: dictionary.aiTeammate, icon: Bot },
        ]}
      />
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
              <HaloSelect
                name="model"
                value={model}
                onValueChange={setModel}
                ariaLabel={dictionary.model}
                options={[
                  { value: "workspace-default", label: dictionary.modelWorkspaceDefault },
                  { value: "openai-compatible", label: dictionary.modelOpenAICompatible },
                  { value: "local", label: dictionary.modelLocalPrivate },
                ]}
              />
            </label>
            <label>
              <span>{dictionary.instructions}</span>
              <textarea
                name="instructions"
                rows={4}
                placeholder={dictionary.instructionsPlaceholder}
              />
            </label>
          </>
        ) : null}
        <div className="security-note">
          <ShieldCheck size={16} /> {dictionary.privacyNote}
        </div>
        <div className="dialog-actions">
          <button type="button" className="secondary-button" onClick={onClose}>
            <X size={16} /> {dictionary.cancel}
          </button>
          <button type="submit" className="primary-button">
            <Plus size={16} /> {dictionary.create}
          </button>
        </div>
      </form>
    </HaloDialog>
  );
}
