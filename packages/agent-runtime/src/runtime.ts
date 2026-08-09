import type { Actor, AgentProfile, AgentVersion, Id, Locale, Message } from "@haloai/core";

export interface AgentRunContext {
  runId: Id;
  workspaceId: Id;
  projectId: Id;
  roomId: Id;
  delegatedByActorId: Id;
  triggerMessageId: Id;
  agent: Actor;
  profile: AgentProfile;
  version: AgentVersion;
  input: string;
  history: readonly Message[];
  locale: Locale;
  signal?: AbortSignal;
}

interface EventBase {
  runId: Id;
  sequence: number;
  occurredAt: string;
}

export type AgentRuntimeEvent =
  | (EventBase & { type: "run.status"; status: "preparing" | "running" | "streaming" })
  | (EventBase & { type: "message.delta"; delta: string })
  | (EventBase & {
      type: "approval.requested";
      capability: string;
      reason: string;
      argumentDigest: string;
    })
  | (EventBase & {
      type: "run.completed";
      finishReason: "stop" | "length";
      usage: { inputTokens: number; outputTokens: number };
    })
  | (EventBase & {
      type: "run.failed";
      code: "RUN_CANCELLED" | "DEMO_RUNTIME_FAILED";
      retryable: boolean;
    });

export interface AgentRuntime {
  run(context: AgentRunContext): AsyncIterable<AgentRuntimeEvent>;
}

const demoResponses: Record<Locale, string> = {
  "zh-CN":
    "我已把讨论整理为三个可执行部分：明确目标、补齐证据、由负责人确认最终版本。右侧文档中还有一条修改提案，只有在你审阅并采纳后才会进入正文。",
  "en-US":
    "I organized the discussion into three actionable parts: clarify the goal, close the evidence gaps, and have the owner confirm the final version. A document proposal is ready on the right and will enter the text only after your review.",
};

/**
 * 确定性 Demo Runtime 只验证事件协议与界面状态，不伪装成真实 Agent。
 * 正式实现会把每个事件先持久化再推送；这里仍维持严格递增序号，确保前端按同一协议开发。
 */
export class DemoAgentRuntime implements AgentRuntime {
  async *run(context: AgentRunContext): AsyncIterable<AgentRuntimeEvent> {
    let sequence = 0;
    const base = () => ({
      runId: context.runId,
      sequence: ++sequence,
      occurredAt: new Date().toISOString(),
    });

    yield { ...base(), type: "run.status", status: "preparing" };
    yield { ...base(), type: "run.status", status: "running" };
    yield { ...base(), type: "run.status", status: "streaming" };

    const response = demoResponses[context.locale];
    const chunks = response.match(/.{1,8}/gu) ?? [response];
    for (const delta of chunks) {
      if (context.signal?.aborted === true) {
        yield {
          ...base(),
          type: "run.failed",
          code: "RUN_CANCELLED",
          retryable: false,
        };
        return;
      }
      yield { ...base(), type: "message.delta", delta };
    }

    yield {
      ...base(),
      type: "run.completed",
      finishReason: "stop",
      usage: {
        inputTokens: Math.ceil(context.input.length / 3),
        outputTokens: Math.ceil(response.length / 3),
      },
    };
  }
}
