import type { Actor, AgentProfile, AgentVersion, CollaborationMode, Id } from "@haloai/core";

export interface RoutableAgent {
  actor: Actor;
  profile: AgentProfile;
  version: AgentVersion;
}

export interface RouteTurnInput {
  mode: CollaborationMode;
  agents: readonly RoutableAgent[];
  mentionedActorIds: readonly Id[];
  participantLimit: number;
}

export interface RouteTurnResult {
  selectedAgentIds: Id[];
  reason: "mentioned" | "coordinator" | "roundtable" | "none";
}

/**
 * 路由只消费消息保存时生成的 Mention 关系，绝不在 Worker 中重新解析 `@name` 字符串。
 * 否则改名、同名、转义文本和历史消息重放都会让同一条消息触发不同的 Agent。
 */
export function routeTurn(input: RouteTurnInput): RouteTurnResult {
  const limit = Math.max(0, Math.min(input.participantLimit, input.agents.length));
  if (limit === 0) return { selectedAgentIds: [], reason: "none" };

  const activeById = new Map(
    input.agents
      .filter(
        ({ actor, profile }) => actor.status === "active" && profile.status === "active",
      )
      .map((agent) => [agent.actor.id, agent]),
  );
  const mentioned = [...new Set(input.mentionedActorIds)]
    .filter((actorId) => activeById.has(actorId))
    .slice(0, limit);
  if (mentioned.length > 0) {
    return { selectedAgentIds: mentioned, reason: "mentioned" };
  }

  if (input.mode === "mention") return { selectedAgentIds: [], reason: "none" };

  if (input.mode === "facilitated") {
    const coordinator = input.agents.find(
      ({ actor, profile, version }) =>
        actor.status === "active" &&
        profile.status === "active" &&
        version.coordinator &&
        version.initiative === "coordinator_invited",
    );
    return coordinator === undefined
      ? { selectedAgentIds: [], reason: "none" }
      : { selectedAgentIds: [coordinator.actor.id], reason: "coordinator" };
  }

  // Roundtable 必须由房间显式启用，并受参与者上限约束；它不是 Agent 自主递归调用开关。
  return {
    selectedAgentIds: [...activeById.keys()].slice(0, limit),
    reason: "roundtable",
  };
}
