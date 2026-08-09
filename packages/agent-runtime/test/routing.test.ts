import { describe, expect, it } from "vitest";
import type { Actor, AgentProfile, AgentVersion } from "@haloai/core";
import { canTransitionRun, routeTurn, type RoutableAgent } from "../src";

function agent(id: string, coordinator = false): RoutableAgent {
  const actor: Actor = {
    id,
    workspaceId: "workspace-1",
    kind: "agent",
    displayName: id,
    handle: id,
    status: "active",
    createdAt: "2026-08-09T00:00:00.000Z",
  };
  const profile: AgentProfile = {
    id: `profile-${id}`,
    workspaceId: "workspace-1",
    actorId: id,
    name: id,
    summary: "",
    ownerActorId: "human-1",
    status: "active",
    currentVersionId: `version-${id}`,
    createdAt: "2026-08-09T00:00:00.000Z",
  };
  const version: AgentVersion = {
    id: `version-${id}`,
    workspaceId: "workspace-1",
    profileId: profile.id,
    version: 1,
    responsibility: "协助项目",
    nonResponsibilities: [],
    instructions: "",
    expertise: [],
    modelPolicy: { provider: "demo", model: "demo" },
    allowedToolIds: [],
    grantedCapabilities: new Set(["room.read", "room.message.create"]),
    memoryScopes: ["turn", "project"],
    initiative: coordinator ? "coordinator_invited" : "mentioned_only",
    coordinator,
    budget: {
      maxInputTokens: 1_000,
      maxOutputTokens: 1_000,
      maxToolCalls: 0,
      maxSteps: 4,
      maxParticipants: 2,
      maxDurationMs: 5_000,
      maxCostMicros: 0,
    },
    requiresApprovalFor: new Set(),
    policyVersion: "demo-v1",
    contentDigest: `digest-${id}`,
    publishedAt: "2026-08-09T00:00:00.000Z",
  };
  return { actor, profile, version };
}

const agents = [agent("halo", true), agent("nova"), agent("muse")];

describe("对话路由", () => {
  it("mention 模式只调用已持久化提及关系中的 Agent", () => {
    expect(
      routeTurn({
        mode: "mention",
        agents,
        mentionedActorIds: ["nova"],
        participantLimit: 3,
      }),
    ).toEqual({ selectedAgentIds: ["nova"], reason: "mentioned" });
  });

  it("mention 模式没有提及时保持安静", () => {
    expect(
      routeTurn({ mode: "mention", agents, mentionedActorIds: [], participantLimit: 3 }),
    ).toEqual({ selectedAgentIds: [], reason: "none" });
  });

  it("协调模式把首轮交给显式协调员", () => {
    expect(
      routeTurn({ mode: "facilitated", agents, mentionedActorIds: [], participantLimit: 2 }),
    ).toEqual({ selectedAgentIds: ["halo"], reason: "coordinator" });
  });
});

describe("Run 状态机", () => {
  it("允许等待审批后通过新队列租约恢复", () => {
    expect(canTransitionRun("waiting_approval", "queued")).toEqual({
      allowed: true,
      reason: "allowed",
    });
  });

  it("禁止已完成 Run 原地复活", () => {
    expect(canTransitionRun("completed", "queued")).toEqual({
      allowed: false,
      reason: "terminal_state",
    });
  });
});
