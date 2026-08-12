import { describe, expect, it } from "vitest";
import { AgentRunEventSchema, AgentRunSchema } from "../src";

const createdAt = "2026-08-09T10:00:00.000Z";
const startedAt = "2026-08-09T10:00:01.000Z";
const finishedAt = "2026-08-09T10:00:10.000Z";

const limits = {
  maxInputTokens: 32_000,
  maxOutputTokens: 4_000,
  maxSteps: 24,
  maxToolCalls: 10,
  maxParticipants: 8,
  maxDurationMs: 120_000,
  maxCostMicros: 2_000_000,
};

const usage = {
  inputTokens: 1_000,
  cachedInputTokens: 200,
  outputTokens: 300,
  toolCalls: 1,
  durationMs: 9_000,
};

const completedRun = {
  id: "run_0000000001",
  workspaceId: "workspace_00001",
  roomId: "room_000000001",
  agentActorId: "actor_agent_001",
  delegatedByActorId: "actor_human_001",
  delegatedByActorKind: "human",
  agentProfileVersionId: "profile_version_01",
  authorizationSnapshotId: "auth_snapshot_001",
  status: "completed",
  limits,
  usage,
  stateVersion: 4,
  attempt: 1,
  lastSequence: 5,
  createdAt,
  startedAt,
  finishedAt,
};

const eventBase = {
  eventId: "event_000000001",
  streamId: "stream_00000001",
  workspaceId: "workspace_00001",
  roomId: "room_000000001",
  runId: "run_0000000001",
  sequence: 2,
  payloadVersion: 1,
  occurredAt: startedAt,
};

describe("AgentRun 快照", () => {
  it("接受带委托、角色版本与授权快照的完整终态", () => {
    const parsed = AgentRunSchema.parse(completedRun);

    expect(parsed.status).toBe("completed");
    expect(parsed.authorizationSnapshotId).toBe("auth_snapshot_001");
  });

  it("拒绝 AI 自我委托与缺少完成时间的终态", () => {
    expect(
      AgentRunSchema.safeParse({
        ...completedRun,
        delegatedByActorId: completedRun.agentActorId,
      }).success,
    ).toBe(false);

    const { finishedAt: _finishedAt, ...withoutFinish } = completedRun;
    expect(AgentRunSchema.safeParse(withoutFinish).success).toBe(false);
  });

  it("拒绝缓存输入量超过总输入量", () => {
    expect(
      AgentRunSchema.safeParse({
        ...completedRun,
        usage: { ...usage, cachedInputTokens: usage.inputTokens + 1 },
      }).success,
    ).toBe(false);
  });

  it("拒绝缺少任一硬预算维度", () => {
    const { maxCostMicros: _maxCostMicros, ...incompleteLimits } = limits;

    expect(
      AgentRunSchema.safeParse({
        ...completedRun,
        limits: incompleteLimits,
      }).success,
    ).toBe(false);
  });
});

describe("AgentRun 事件信封", () => {
  it("依靠 type 判别增量事件，并暴露 runId 与 sequence 恢复游标", () => {
    const event = AgentRunEventSchema.parse({
      ...eventBase,
      type: "run.text.delta",
      payload: {
        status: "running",
        partId: "part_00000001",
        delta: "Outline",
      },
    });

    expect(event.runId).toBe("run_0000000001");
    expect(event.sequence).toBe(2);
    if (event.type === "run.text.delta") {
      expect(event.payload.delta).toBe("Outline");
    } else {
      throw new Error("事件判别结果不符合输入类型");
    }
  });

  it("拒绝事件类型与 payload 状态不一致", () => {
    expect(
      AgentRunEventSchema.safeParse({
        ...eventBase,
        type: "run.completed",
        payload: {
          status: "running",
          partId: "part_00000001",
          delta: "not a completion",
        },
      }).success,
    ).toBe(false);
  });

  it("拒绝零 sequence 与缺失 runId 的事件", () => {
    const validEvent = {
      ...eventBase,
      type: "run.queued",
      payload: { status: "queued" },
    };

    expect(AgentRunEventSchema.safeParse({ ...validEvent, sequence: 0 }).success).toBe(false);
    const { runId: _runId, ...withoutRunId } = validEvent;
    expect(AgentRunEventSchema.safeParse(withoutRunId).success).toBe(false);
  });

  it("接受具有最终用量的完成事件", () => {
    expect(
      AgentRunEventSchema.safeParse({
        ...eventBase,
        sequence: 5,
        occurredAt: finishedAt,
        type: "run.completed",
        payload: {
          status: "completed",
          finishedAt,
          finalMessageId: "message_000001",
          usage,
        },
      }).success,
    ).toBe(true);
  });

  it("把过期作为独立终态事件判别", () => {
    const event = AgentRunEventSchema.parse({
      ...eventBase,
      sequence: 6,
      occurredAt: finishedAt,
      type: "run.expired",
      payload: {
        status: "expired",
        finishedAt,
        reasonCode: "approval_timeout",
      },
    });

    expect(event.type).toBe("run.expired");
  });
});
