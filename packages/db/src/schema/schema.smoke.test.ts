import { getTableName } from "drizzle-orm";
import { describe, expect, it } from "vitest";

import {
  actors,
  agentProfiles,
  agentRuns,
  agentVersions,
  approvals,
  auditEvents,
  capabilities,
  contextManifests,
  documentProposals,
  documentVersions,
  documents,
  humanActors,
  mentions,
  messageRevisions,
  messages,
  outboxEvents,
  projects,
  proposalOperations,
  roleCapabilityGrants,
  rooms,
  runEvents,
  runSteps,
  toolCalls,
  usageLedgerEntries,
  users,
  workspaceMemberships,
  workspaces,
  yjsSnapshots,
  yjsUpdates,
} from "./index";

describe("database schema exports", () => {
  it("exports every required domain aggregate with a unique SQL table name", () => {
    const requiredTables = [
      users,
      workspaces,
      actors,
      humanActors,
      workspaceMemberships,
      capabilities,
      roleCapabilityGrants,
      projects,
      rooms,
      messages,
      messageRevisions,
      mentions,
      agentProfiles,
      agentVersions,
      agentRuns,
      runEvents,
      runSteps,
      toolCalls,
      contextManifests,
      documents,
      yjsUpdates,
      yjsSnapshots,
      documentVersions,
      documentProposals,
      proposalOperations,
      approvals,
      auditEvents,
      usageLedgerEntries,
      outboxEvents,
    ];
    const names = requiredTables.map((table) => getTableName(table));

    expect(names).toHaveLength(29);
    expect(new Set(names).size).toBe(names.length);
  });
});
