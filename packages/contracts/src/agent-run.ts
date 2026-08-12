import { z } from "zod";
import { ApiErrorSchema } from "./api-error";
import {
  ActorIdSchema,
  AgentProfileVersionIdSchema,
  AgentRunIdSchema,
  ApprovalIdSchema,
  AuthorizationSnapshotIdSchema,
  EventIdSchema,
  ISODateTimeSchema,
  MessageIdSchema,
  PositiveSequenceSchema,
  RoomIdSchema,
  SequenceSchema,
  StreamIdSchema,
  WorkspaceIdSchema,
  isAtOrAfter,
} from "./primitives";

/**
 * 运行状态只描述服务端持久事实。客户端可以发出取消、恢复等命令，但不能直接声明下一状态；
 * 服务端必须使用 stateVersion 做比较并交换，再在同一事务中追加事件。terminal 状态不可回退，
 * 需要重试时创建新的 runId；cancelling 则保留为取消请求与 Worker 确认之间的可观察中间态。
 */
export const AgentRunStatusSchema = z.enum([
  "created",
  "queued",
  "running",
  "waiting_input",
  "waiting_approval",
  "paused",
  "cancelling",
  "completing",
  "completed",
  "cancelled",
  "failed",
  "expired",
]);

/**
 * 运行预算的每个维度都必须显式存在，并由服务端/Worker 作为硬上限执行。
 * 模型提示中的“尽量节省”不是预算控制；缺少任一维度时，恶意或异常输出可能把成本、
 * 时长、循环步数、工具副作用或参与 Agent 数量扩展到调用方没有授权的范围。
 */
export const AgentRunLimitsSchema = z
  .object({
    maxInputTokens: z.number().int().positive().max(10_000_000),
    maxOutputTokens: z.number().int().positive().max(1_000_000),
    maxSteps: z.number().int().positive().max(10_000),
    maxToolCalls: z.number().int().nonnegative().max(1_000),
    maxParticipants: z.number().int().positive().max(64),
    maxDurationMs: z.number().int().positive().max(86_400_000),
    maxCostMicros: z.number().int().nonnegative().max(Number.MAX_SAFE_INTEGER),
  })
  .strict();

export const AgentUsageSchema = z
  .object({
    inputTokens: z.number().int().nonnegative(),
    cachedInputTokens: z.number().int().nonnegative(),
    outputTokens: z.number().int().nonnegative(),
    toolCalls: z.number().int().nonnegative(),
    durationMs: z.number().int().nonnegative(),
    costMicros: z.number().int().nonnegative().optional(),
  })
  .strict()
  .superRefine((usage, context) => {
    /**
     * cachedInputTokens 是 inputTokens 的组成部分，而不是额外 token。
     * 若允许缓存数大于输入数，成本与配额视图会产生无法解释的负值或重复计算。
     */
    if (usage.cachedInputTokens > usage.inputTokens) {
      context.addIssue({
        code: "custom",
        path: ["cachedInputTokens"],
        message: "cached input tokens cannot exceed input tokens",
      });
    }
  });

export const AgentRunSchema = z
  .object({
    id: AgentRunIdSchema,
    workspaceId: WorkspaceIdSchema,
    roomId: RoomIdSchema,
    agentActorId: ActorIdSchema,
    delegatedByActorId: ActorIdSchema,
    delegatedByActorKind: z.literal("human"),
    agentProfileVersionId: AgentProfileVersionIdSchema,
    authorizationSnapshotId: AuthorizationSnapshotIdSchema,
    status: AgentRunStatusSchema,
    limits: AgentRunLimitsSchema,
    usage: AgentUsageSchema.optional(),
    stateVersion: SequenceSchema,
    attempt: z.number().int().nonnegative().max(10_000),
    lastSequence: SequenceSchema,
    createdAt: ISODateTimeSchema,
    startedAt: ISODateTimeSchema.optional(),
    finishedAt: ISODateTimeSchema.optional(),
    failureCode: z
      .string()
      .min(2)
      .max(80)
      .regex(/^[a-z0-9]+(?:_[a-z0-9]+)*$/)
      .optional(),
    cancelReasonCode: z
      .string()
      .min(2)
      .max(80)
      .regex(/^[a-z0-9]+(?:_[a-z0-9]+)*$/)
      .optional(),
  })
  .strict()
  .superRefine((run, context) => {
    if (run.agentActorId === run.delegatedByActorId) {
      context.addIssue({
        code: "custom",
        path: ["delegatedByActorId"],
        message: "an agent run requires a distinct human delegator",
      });
    }

    const requiresStartedAt = new Set<z.infer<typeof AgentRunStatusSchema>>([
      "running",
      "waiting_input",
      "waiting_approval",
      "paused",
      "cancelling",
      "completing",
      "completed",
      "failed",
    ]);
    const terminal = new Set<z.infer<typeof AgentRunStatusSchema>>([
      "completed",
      "cancelled",
      "failed",
      "expired",
    ]);

    if (
      new Set<z.infer<typeof AgentRunStatusSchema>>(["created", "queued"]).has(run.status) &&
      run.startedAt !== undefined
    ) {
      context.addIssue({
        code: "custom",
        path: ["startedAt"],
        message: "created and queued runs cannot have startedAt",
      });
    }

    if (requiresStartedAt.has(run.status) && run.startedAt === undefined) {
      context.addIssue({
        code: "custom",
        path: ["startedAt"],
        message: "this run status requires startedAt",
      });
    }
    if (terminal.has(run.status) && run.finishedAt === undefined) {
      context.addIssue({
        code: "custom",
        path: ["finishedAt"],
        message: "terminal runs require finishedAt",
      });
    }
    if (!terminal.has(run.status) && run.finishedAt !== undefined) {
      context.addIssue({
        code: "custom",
        path: ["finishedAt"],
        message: "non-terminal runs cannot have finishedAt",
      });
    }
    /**
     * 终态快照必须能够独立用于计量与审计。即使运行在调用模型前就取消或过期，
     * 也要写入全零 usage，而不是用字段缺失表达“可能为零”，否则恢复与账单对账无法区分未知值。
     */
    if (terminal.has(run.status) && run.usage === undefined) {
      context.addIssue({
        code: "custom",
        path: ["usage"],
        message: "terminal runs require a final usage record",
      });
    }
    if (run.status === "failed" && run.failureCode === undefined) {
      context.addIssue({
        code: "custom",
        path: ["failureCode"],
        message: "failed runs require failureCode",
      });
    }
    if (run.status !== "failed" && run.failureCode !== undefined) {
      context.addIssue({
        code: "custom",
        path: ["failureCode"],
        message: "only failed runs can have failureCode",
      });
    }
    if (run.status !== "cancelled" && run.cancelReasonCode !== undefined) {
      context.addIssue({
        code: "custom",
        path: ["cancelReasonCode"],
        message: "only cancelled runs can have cancelReasonCode",
      });
    }
    if (run.status === "cancelled" && run.cancelReasonCode === undefined) {
      context.addIssue({
        code: "custom",
        path: ["cancelReasonCode"],
        message: "cancelled runs require a stable cancellation reason",
      });
    }
    if (run.startedAt !== undefined && !isAtOrAfter(run.startedAt, run.createdAt)) {
      context.addIssue({
        code: "custom",
        path: ["startedAt"],
        message: "startedAt must not be before createdAt",
      });
    }
    if (
      run.finishedAt !== undefined &&
      !isAtOrAfter(run.finishedAt, run.startedAt ?? run.createdAt)
    ) {
      context.addIssue({
        code: "custom",
        path: ["finishedAt"],
        message: "finishedAt must not be before run start",
      });
    }
  });

export type AgentRunStatus = z.infer<typeof AgentRunStatusSchema>;
export type AgentRunLimits = z.infer<typeof AgentRunLimitsSchema>;
export type AgentUsage = z.infer<typeof AgentUsageSchema>;
export type AgentRun = z.infer<typeof AgentRunSchema>;

/**
 * 所有运行事件都带同一个 runId 与单调 sequence。客户端只能把连续 sequence
 * 归并为可见状态；eventId 用于追踪，不能代替同一运行内的顺序游标。
 */
const AgentRunEventBaseSchema = z
  .object({
    eventId: EventIdSchema,
    streamId: StreamIdSchema,
    workspaceId: WorkspaceIdSchema,
    roomId: RoomIdSchema,
    runId: AgentRunIdSchema,
    sequence: PositiveSequenceSchema,
    payloadVersion: z.literal(1),
    occurredAt: ISODateTimeSchema,
  })
  .strict();

export const RunQueuedEventSchema = AgentRunEventBaseSchema.extend({
  type: z.literal("run.queued"),
  payload: z.object({ status: z.literal("queued") }).strict(),
}).strict();

export const RunStartedEventSchema = AgentRunEventBaseSchema.extend({
  type: z.literal("run.started"),
  payload: z
    .object({
      status: z.literal("running"),
      startedAt: ISODateTimeSchema,
    })
    .strict(),
}).strict();

export const RunProgressEventSchema = AgentRunEventBaseSchema.extend({
  type: z.literal("run.progress"),
  payload: z
    .object({
      status: z.enum([
        "running",
        "waiting_input",
        "waiting_approval",
        "paused",
        "cancelling",
        "completing",
      ]),
      stage: z.enum([
        "context_loading",
        "model_generation",
        "tool_execution",
        "proposal_preparation",
        "cancellation",
      ]),
      messageKey: z
        .string()
        .min(3)
        .max(160)
        .regex(/^[a-z0-9]+(?:[._-][a-z0-9]+)+$/),
    })
    .strict(),
}).strict();

export const RunTextDeltaEventSchema = AgentRunEventBaseSchema.extend({
  type: z.literal("run.text.delta"),
  payload: z
    .object({
      status: z.literal("running"),
      partId: z
        .string()
        .min(8)
        .max(128)
        .regex(/^[A-Za-z0-9](?:[A-Za-z0-9_-]*[A-Za-z0-9])?$/),
      delta: z.string().min(1).max(8_192),
    })
    .strict(),
}).strict();

export const RunApprovalRequiredEventSchema = AgentRunEventBaseSchema.extend({
  type: z.literal("run.approval.required"),
  payload: z
    .object({
      status: z.literal("waiting_approval"),
      approvalId: ApprovalIdSchema,
    })
    .strict(),
}).strict();

export const RunCompletedEventSchema = AgentRunEventBaseSchema.extend({
  type: z.literal("run.completed"),
  payload: z
    .object({
      status: z.literal("completed"),
      finishedAt: ISODateTimeSchema,
      finalMessageId: MessageIdSchema,
      usage: AgentUsageSchema,
    })
    .strict(),
}).strict();

export const RunCancelledEventSchema = AgentRunEventBaseSchema.extend({
  type: z.literal("run.cancelled"),
  payload: z
    .object({
      status: z.literal("cancelled"),
      finishedAt: ISODateTimeSchema,
      reasonCode: z
        .string()
        .min(2)
        .max(80)
        .regex(/^[a-z0-9]+(?:_[a-z0-9]+)*$/),
    })
    .strict(),
}).strict();

export const RunFailedEventSchema = AgentRunEventBaseSchema.extend({
  type: z.literal("run.failed"),
  payload: z
    .object({
      status: z.literal("failed"),
      finishedAt: ISODateTimeSchema,
      error: ApiErrorSchema,
    })
    .strict(),
}).strict();

export const RunExpiredEventSchema = AgentRunEventBaseSchema.extend({
  type: z.literal("run.expired"),
  payload: z
    .object({
      status: z.literal("expired"),
      finishedAt: ISODateTimeSchema,
      reasonCode: z
        .string()
        .min(2)
        .max(80)
        .regex(/^[a-z0-9]+(?:_[a-z0-9]+)*$/),
    })
    .strict(),
}).strict();

export const AgentRunEventSchema = z.discriminatedUnion("type", [
  RunQueuedEventSchema,
  RunStartedEventSchema,
  RunProgressEventSchema,
  RunTextDeltaEventSchema,
  RunApprovalRequiredEventSchema,
  RunCompletedEventSchema,
  RunCancelledEventSchema,
  RunFailedEventSchema,
  RunExpiredEventSchema,
]);

export type RunQueuedEvent = z.infer<typeof RunQueuedEventSchema>;
export type RunStartedEvent = z.infer<typeof RunStartedEventSchema>;
export type RunProgressEvent = z.infer<typeof RunProgressEventSchema>;
export type RunTextDeltaEvent = z.infer<typeof RunTextDeltaEventSchema>;
export type RunApprovalRequiredEvent = z.infer<typeof RunApprovalRequiredEventSchema>;
export type RunCompletedEvent = z.infer<typeof RunCompletedEventSchema>;
export type RunCancelledEvent = z.infer<typeof RunCancelledEventSchema>;
export type RunFailedEvent = z.infer<typeof RunFailedEventSchema>;
export type RunExpiredEvent = z.infer<typeof RunExpiredEventSchema>;
export type AgentRunEvent = z.infer<typeof AgentRunEventSchema>;
