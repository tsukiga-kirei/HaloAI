import { describe, expect, it } from "vitest";
import {
  ActorSchema,
  MentionSchema,
  MessageSchema,
  RoomSchema,
  WorkspaceSchema,
} from "../src";

const createdAt = "2026-08-09T10:00:00.000Z";
const humanActorId = "actor_human_001";
const agentActorId = "actor_agent_001";
const workspaceId = "workspace_00001";
const roomId = "room_000000001";

describe("协作主体与空间", () => {
  it("解析人类、工作空间与包含创建者的房间", () => {
    expect(
      ActorSchema.safeParse({
        id: humanActorId,
        workspaceId,
        kind: "human",
        displayName: "Lin",
        handle: "lin.work",
        status: "active",
        createdAt,
      }).success,
    ).toBe(true);

    expect(
      WorkspaceSchema.safeParse({
        id: workspaceId,
        name: "Halo Team",
        slug: "halo-team",
        defaultLocale: "zh-CN",
        createdByActorId: humanActorId,
        createdAt,
      }).success,
    ).toBe(true);

    expect(
      RoomSchema.safeParse({
        id: roomId,
        workspaceId,
        name: "Launch brief",
        goal: "Produce an approved launch brief.",
        mode: "facilitated",
        status: "active",
        participantActorIds: [humanActorId, agentActorId],
        createdByActorId: humanActorId,
        createdAt,
      }).success,
    ).toBe(true);
  });

  it("拒绝把成员邀请状态混入 Actor 生命周期", () => {
    expect(
      ActorSchema.safeParse({
        id: agentActorId,
        workspaceId,
        kind: "agent",
        displayName: "Planner",
        handle: "planner.ai",
        status: "invited",
        createdAt,
      }).success,
    ).toBe(false);
  });

  it("拒绝重复参与者以及不在参与者列表中的创建者", () => {
    const baseRoom = {
      id: roomId,
      workspaceId,
      name: "Launch brief",
      goal: "Produce an approved launch brief.",
      mode: "facilitated",
      status: "active",
      createdByActorId: humanActorId,
      createdAt,
    };

    expect(
      RoomSchema.safeParse({
        ...baseRoom,
        participantActorIds: [humanActorId, humanActorId],
      }).success,
    ).toBe(false);
    expect(
      RoomSchema.safeParse({
        ...baseRoom,
        participantActorIds: [agentActorId],
      }).success,
    ).toBe(false);
  });
});

describe("消息与提及", () => {
  const agentMessage = {
    id: "message_000001",
    workspaceId,
    roomId,
    roomSequence: 3,
    actorId: agentActorId,
    actorType: "agent",
    clientMutationId: "mutation_000001",
    agentRunId: "run_0000000001",
    parts: [{ type: "text", text: "I propose a revised outline.", format: "markdown" }],
    status: "sent",
    createdAt,
  };

  it("要求 AI 消息绑定运行，并保留已判别的内容 part", () => {
    const parsed = MessageSchema.parse(agentMessage);

    expect(parsed.agentRunId).toBe("run_0000000001");
    expect(parsed.parts[0]?.type).toBe("text");
  });

  it("拒绝没有运行链路的 AI 消息以及由人类伪造的系统事件", () => {
    const { agentRunId: _agentRunId, ...withoutRun } = agentMessage;
    expect(MessageSchema.safeParse(withoutRun).success).toBe(false);

    expect(
      MessageSchema.safeParse({
        ...agentMessage,
        actorId: humanActorId,
        actorType: "human",
        agentRunId: undefined,
        parts: [{ type: "system_event", eventKey: "room.member_joined" }],
      }).success,
    ).toBe(false);
  });

  it("拒绝缺少删除时间的已删除消息", () => {
    expect(
      MessageSchema.safeParse({ ...agentMessage, status: "deleted" }).success,
    ).toBe(false);
  });

  it("只允许提及 AI 时使用 invoke 意图", () => {
    const mention = {
      id: "mention_000001",
      workspaceId,
      roomId,
      messageId: "message_000001",
      targetActorId: agentActorId,
      targetActorKind: "agent",
      intent: "invoke",
      createdAt,
    };

    expect(MentionSchema.safeParse(mention).success).toBe(true);
    expect(
      MentionSchema.safeParse({
        ...mention,
        targetActorId: humanActorId,
        targetActorKind: "human",
      }).success,
    ).toBe(false);
  });
});
