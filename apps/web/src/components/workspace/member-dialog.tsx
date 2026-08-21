"use client";

import {
  AssignableWorkspaceRoleSchema,
  WorkspaceAllocatedModelListSchema,
  type WorkspaceAllocatedModel,
  type WorkspaceRole,
} from "@haloai/contracts";
import { Bot, Plus, ShieldCheck, UserRoundPlus, Users, X } from "lucide-react";
import { type FormEventHandler, useEffect, useState } from "react";
import { HaloDialog } from "@/components/ui/halo-dialog";
import { HaloSegmented } from "@/components/ui/halo-segmented";
import { HaloSelect } from "@/components/ui/halo-select";
import { apiFetch } from "@/lib/api-client";
import type { WorkspaceViewProps } from "./types";

interface MemberDialogProps extends WorkspaceViewProps {
  kind: "human" | "agent";
  workspaceId?: string | undefined;
  onKindChange: (kind: "human" | "agent") => void;
  onClose: () => void;
  onSubmit: FormEventHandler<HTMLFormElement>;
}

export function MemberDialog({
  dictionary,
  kind,
  workspaceId,
  onKindChange,
  onClose,
  onSubmit,
}: MemberDialogProps) {
  const [model, setModel] = useState("");
  const [models, setModels] = useState<WorkspaceAllocatedModel[]>([]);
  const [inviteRole, setInviteRole] = useState<Exclude<WorkspaceRole, "owner">>("member");
  const inviteRoles = ["admin", "member", "guest"] as const;

  useEffect(() => {
    if (kind !== "agent" || !workspaceId) return;
    let cancelled = false;
    apiFetch<unknown>(`/v1/workspaces/${workspaceId}/models`)
      .then((payload) => {
        if (cancelled) return;
        const items = WorkspaceAllocatedModelListSchema.parse(payload).items;
        setModels(items);
        setModel((current) => current || items[0]?.id || "");
      })
      .catch(() => {
        if (!cancelled) setModels([]);
      });
    return () => {
      cancelled = true;
    };
  }, [kind, workspaceId]);

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
        {kind === "human" ? (
          <label>
            <span>{dictionary.teammateEmail}</span>
            <input
              name="email"
              type="email"
              required
              autoFocus
              placeholder={dictionary.teammateEmailPlaceholder}
            />
          </label>
        ) : (
          <label>
            <span>{dictionary.name}</span>
            <input name="name" required autoFocus placeholder={dictionary.aiTeammate} />
          </label>
        )}
        {kind === "human" ? (
          <label>
            <span>{dictionary.inviteAccessRole}</span>
            <HaloSelect
              name="role"
              value={inviteRole}
              onValueChange={(value) => setInviteRole(AssignableWorkspaceRoleSchema.parse(value))}
              ariaLabel={dictionary.inviteAccessRole}
              options={inviteRoles.map((role) => ({
                value: role,
                label:
                  role === "admin"
                    ? dictionary.accessAdmin
                    : role === "guest"
                      ? dictionary.accessGuest
                      : dictionary.accessMember,
              }))}
            />
          </label>
        ) : (
          <label>
            <span>{dictionary.role}</span>
            <input name="role" placeholder={dictionary.rolePlaceholder} />
          </label>
        )}
        {kind === "agent" ? (
          <>
            <label>
              <span>{dictionary.model}</span>
              <HaloSelect
                name="model"
                value={model}
                onValueChange={setModel}
                ariaLabel={dictionary.model}
                options={
                  models.length === 0
                    ? [{ value: "", label: dictionary.noAllocatedModels }]
                    : models.map((item) => ({
                        value: item.id,
                        label: `${item.name} · ${item.remoteModelId}`,
                      }))
                }
              />
            </label>
            <p className="security-note">
              <ShieldCheck size={16} /> {dictionary.modelAllocatedOnly}
            </p>
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
