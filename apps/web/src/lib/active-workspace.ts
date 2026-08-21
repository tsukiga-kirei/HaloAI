import type { SessionContext, WorkspaceSummary } from "@haloai/contracts";
import { persistWorkspaceId, readStoredWorkspaceId } from "./portals";

export function resolveActiveWorkspace(session: SessionContext): WorkspaceSummary | undefined {
  const remembered = readStoredWorkspaceId();
  return (
    session.workspaces.find((workspace) => workspace.id === remembered) ?? session.workspaces[0]
  );
}

export function rememberActiveWorkspace(workspace: WorkspaceSummary): void {
  persistWorkspaceId(workspace.id);
}
