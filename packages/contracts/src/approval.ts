import { z } from "zod";
import {
  ActorIdSchema,
  AgentProfileVersionIdSchema,
  AgentRunIdSchema,
  ApprovalIdSchema,
  AuthorizationSnapshotIdSchema,
  ISODateTimeSchema,
  JsonScalarSchema,
  SequenceSchema,
  Sha256DigestSchema,
  SourceIdSchema,
  ToolIdSchema,
  WorkspaceIdSchema,
  isAfter,
  isAtOrAfter,
} from "./primitives";

export const ApprovalActionSchema = z.enum([
  "document_proposal.apply",
  "tool.execute",
  "external.write",
  "resource.delete",
  "permission.change",
  "public.publish",
  "payment.execute",
  "sensitive_data.access",
]);

export const ApprovalTargetTypeSchema = z.enum([
  "document_proposal",
  "tool_call",
  "external_action",
  "resource",
  "permission_change",
  "publication",
  "payment",
  "sensitive_data",
]);

export const ApprovalStatusSchema = z.enum([
  "pending",
  "approved",
  "rejected",
  "expired",
  "cancelled",
]);

const targetByAction: Readonly<
  Record<z.infer<typeof ApprovalActionSchema>, z.infer<typeof ApprovalTargetTypeSchema>>
> = {
  "document_proposal.apply": "document_proposal",
  "tool.execute": "tool_call",
  "external.write": "external_action",
  "resource.delete": "resource",
  "permission.change": "permission_change",
  "public.publish": "publication",
  "payment.execute": "payment",
  "sensitive_data.access": "sensitive_data",
};

const HumanReviewerSchema = z
  .object({
    actorId: ActorIdSchema,
    actorKind: z.literal("human"),
  })
  .strict();

const ApprovalParameterSummarySchema = z
  .record(z.string().min(1).max(80), JsonScalarSchema)
  .refine((summary) => Object.keys(summary).length <= 64, {
    message: "approval parameter summary cannot contain more than 64 entries",
  });

/**
 * 审批记录绑定动作、目标与参数摘要哈希，而不是授予未来通用权限。
 * parameterSummary 只保存可向审阅人展示的受限标量；真正执行仍必须使用服务端保存、
 * 与 parameterDigest 对应的不可变参数，并在执行时重新检查当前权限与有效期。
 */
export const ApprovalSchema = z
  .object({
    id: ApprovalIdSchema,
    workspaceId: WorkspaceIdSchema,
    action: ApprovalActionSchema,
    targetType: ApprovalTargetTypeSchema,
    targetId: SourceIdSchema,
    toolId: ToolIdSchema.optional(),
    toolVersion: z
      .string()
      .min(1)
      .max(64)
      .regex(/^[A-Za-z0-9](?:[A-Za-z0-9._+-]*[A-Za-z0-9])?$/)
      .optional(),
    parameterDigest: Sha256DigestSchema,
    parameterSummary: ApprovalParameterSummarySchema,
    summaryKey: z
      .string()
      .min(3)
      .max(160)
      .regex(/^[a-z0-9]+(?:[._-][a-z0-9]+)+$/),
    requestedByActorId: ActorIdSchema,
    requestedByActorKind: z.enum(["human", "agent"]),
    delegatedByActorId: ActorIdSchema,
    delegatedByActorKind: z.literal("human"),
    runId: AgentRunIdSchema.optional(),
    runStateVersion: SequenceSchema.optional(),
    agentProfileVersionId: AgentProfileVersionIdSchema.optional(),
    authorizationSnapshotId: AuthorizationSnapshotIdSchema.optional(),
    status: ApprovalStatusSchema,
    reviewedBy: HumanReviewerSchema.optional(),
    rejectionReason: z.string().trim().min(1).max(4_000).optional(),
    createdAt: ISODateTimeSchema,
    expiresAt: ISODateTimeSchema,
    resolvedAt: ISODateTimeSchema.optional(),
  })
  .strict()
  .superRefine((approval, context) => {
    if (approval.targetType !== targetByAction[approval.action]) {
      context.addIssue({
        code: "custom",
        path: ["targetType"],
        message: "target type does not match approval action",
      });
    }

    /**
     * 会落到工具适配器的动作同时固定 toolId 与 toolVersion；只固定可变工具名称会使一次旧审批
     * 在适配器升级、参数语义改变后继续生效。纯领域动作由受控服务实现，因此不得伪装成工具调用。
     */
    const actionsRequiringTool = new Set<z.infer<typeof ApprovalActionSchema>>([
      "tool.execute",
      "external.write",
      "public.publish",
      "payment.execute",
    ]);
    if (
      actionsRequiringTool.has(approval.action) &&
      (approval.toolId === undefined || approval.toolVersion === undefined)
    ) {
      context.addIssue({
        code: "custom",
        path: ["toolId"],
        message: "this approval action requires a bound tool and version",
      });
    }
    if (
      !actionsRequiringTool.has(approval.action) &&
      (approval.toolId !== undefined || approval.toolVersion !== undefined)
    ) {
      context.addIssue({
        code: "custom",
        path: ["toolId"],
        message: "this approval action cannot bind a tool or tool version",
      });
    }

    /**
     * 人类直接请求时，委托人必须就是本人；AI 请求时委托人必须是另一名人类。
     * 这项约束防止伪造委托链，也确保每次 AI 高风险行为都有可追溯的人类发起者。
     */
    if (
      approval.requestedByActorKind === "human" &&
      approval.requestedByActorId !== approval.delegatedByActorId
    ) {
      context.addIssue({
        code: "custom",
        path: ["delegatedByActorId"],
        message: "human requesters must delegate for themselves",
      });
    }
    if (
      approval.requestedByActorKind === "agent" &&
      approval.requestedByActorId === approval.delegatedByActorId
    ) {
      context.addIssue({
        code: "custom",
        path: ["delegatedByActorId"],
        message: "agent requests require a distinct human delegator",
      });
    }

    /**
     * AI 发起的审批必须固定到原始运行、运行状态版本、不可变 Agent 版本和授权快照。
     * 仅记录一个可变 Agent 显示身份会让后续配置或权限变化复用旧批准；人类直接请求则不应
     * 伪造这些运行字段。真正执行时还必须把这些固定值与当前权限取交集，而不能只相信审批记录。
     */
    const agentBindingValues = [
      approval.runId,
      approval.runStateVersion,
      approval.agentProfileVersionId,
      approval.authorizationSnapshotId,
    ];
    if (
      approval.requestedByActorKind === "agent" &&
      agentBindingValues.some((value) => value === undefined)
    ) {
      context.addIssue({
        code: "custom",
        path: ["runId"],
        message: "agent approval requests require complete immutable run bindings",
      });
    }
    if (
      approval.requestedByActorKind === "human" &&
      agentBindingValues.some((value) => value !== undefined)
    ) {
      context.addIssue({
        code: "custom",
        path: ["runId"],
        message: "human approval requests cannot claim agent run bindings",
      });
    }

    const reviewedStatus = approval.status === "approved" || approval.status === "rejected";
    const terminalStatus = approval.status !== "pending";

    if (reviewedStatus && approval.reviewedBy === undefined) {
      context.addIssue({
        code: "custom",
        path: ["reviewedBy"],
        message: "approved and rejected approvals require a human reviewer",
      });
    }
    if (!reviewedStatus && approval.reviewedBy !== undefined) {
      context.addIssue({
        code: "custom",
        path: ["reviewedBy"],
        message: "this approval state cannot contain reviewer metadata",
      });
    }
    /**
     * 当前契约采用职责分离的安全基线：提出高风险动作的 Actor 不能同时成为审批人。
     * AI 还受到 reviewer 必须为 human 的结构约束；未来若允许某些人类动作自行确认，
     * 应建立明确的低风险确认协议，而不是悄悄放松通用 Approval 的约束。
     */
    if (approval.reviewedBy?.actorId === approval.requestedByActorId) {
      context.addIssue({
        code: "custom",
        path: ["reviewedBy"],
        message: "the requesting actor cannot approve its own action",
      });
    }

    if (terminalStatus && approval.resolvedAt === undefined) {
      context.addIssue({
        code: "custom",
        path: ["resolvedAt"],
        message: "terminal approvals require resolvedAt",
      });
    }
    if (!terminalStatus && approval.resolvedAt !== undefined) {
      context.addIssue({
        code: "custom",
        path: ["resolvedAt"],
        message: "pending approvals cannot have resolvedAt",
      });
    }
    if (approval.status === "rejected" && approval.rejectionReason === undefined) {
      context.addIssue({
        code: "custom",
        path: ["rejectionReason"],
        message: "rejected approvals require a reason",
      });
    }
    if (approval.status !== "rejected" && approval.rejectionReason !== undefined) {
      context.addIssue({
        code: "custom",
        path: ["rejectionReason"],
        message: "only rejected approvals can contain a rejection reason",
      });
    }

    if (!isAfter(approval.expiresAt, approval.createdAt)) {
      context.addIssue({
        code: "custom",
        path: ["expiresAt"],
        message: "expiresAt must be after createdAt",
      });
    }
    if (
      approval.resolvedAt !== undefined &&
      !isAtOrAfter(approval.resolvedAt, approval.createdAt)
    ) {
      context.addIssue({
        code: "custom",
        path: ["resolvedAt"],
        message: "resolvedAt must not be before createdAt",
      });
    }
    if (
      reviewedStatus &&
      approval.resolvedAt !== undefined &&
      !isAfter(approval.expiresAt, approval.resolvedAt)
    ) {
      context.addIssue({
        code: "custom",
        path: ["resolvedAt"],
        message: "approval decisions must happen before expiry",
      });
    }
    if (
      approval.status === "expired" &&
      approval.resolvedAt !== undefined &&
      !isAtOrAfter(approval.resolvedAt, approval.expiresAt)
    ) {
      context.addIssue({
        code: "custom",
        path: ["resolvedAt"],
        message: "expired approvals cannot resolve before their expiry",
      });
    }
  });

export type ApprovalAction = z.infer<typeof ApprovalActionSchema>;
export type ApprovalTargetType = z.infer<typeof ApprovalTargetTypeSchema>;
export type ApprovalStatus = z.infer<typeof ApprovalStatusSchema>;
export type Approval = z.infer<typeof ApprovalSchema>;
