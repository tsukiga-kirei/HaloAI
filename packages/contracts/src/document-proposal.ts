import { z } from "zod";
import {
  ActorIdSchema,
  AgentProfileVersionIdSchema,
  AgentRunIdSchema,
  Base64StateVectorSchema,
  DocumentIdSchema,
  DocumentNodeIdSchema,
  DocumentProposalIdSchema,
  DocumentVersionIdSchema,
  ISODateTimeSchema,
  ProposalOperationIdSchema,
  Sha256DigestSchema,
  SourceIdSchema,
  WorkspaceIdSchema,
  isAfter,
  isAtOrAfter,
} from "./primitives";

const MarkdownContentSchema = z.string().trim().min(1).max(262_144);

export const AppendSectionOperationSchema = z
  .object({
    kind: z.literal("append_section"),
    operationId: ProposalOperationIdSchema,
    afterNodeId: DocumentNodeIdSchema.optional(),
    contentMarkdown: MarkdownContentSchema,
  })
  .strict();

export const ReplaceSectionOperationSchema = z
  .object({
    kind: z.literal("replace_section"),
    operationId: ProposalOperationIdSchema,
    targetNodeId: DocumentNodeIdSchema,
    expectedNodeDigest: Sha256DigestSchema,
    contentMarkdown: MarkdownContentSchema,
  })
  .strict();

export const InsertCommentOperationSchema = z
  .object({
    kind: z.literal("insert_comment"),
    operationId: ProposalOperationIdSchema,
    targetNodeId: DocumentNodeIdSchema,
    body: z.string().trim().min(1).max(32_768),
  })
  .strict();

export const SuggestTitleOperationSchema = z
  .object({
    kind: z.literal("suggest_title"),
    operationId: ProposalOperationIdSchema,
    title: z.string().trim().min(1).max(240),
  })
  .strict();

export const AddSummaryOperationSchema = z
  .object({
    kind: z.literal("add_summary"),
    operationId: ProposalOperationIdSchema,
    targetNodeId: DocumentNodeIdSchema.optional(),
    contentMarkdown: MarkdownContentSchema,
  })
  .strict();

/**
 * AI 可提出的文档操作必须是有限、可比较、可审阅的语义操作。
 * 协议故意不提供任意字符偏移、整份文档替换、可执行内容和权限修改，
 * 防止并发编辑后错位，也防止模型借文档工具扩大权限或隐藏破坏性变化。
 * contentMarkdown 本身仍按不可信内容处理；应用前要经过编辑器 schema 转换，展示时也必须安全渲染，
 * 本协议的结构约束不等价于 HTML 清洗或内容事实核验。
 */
export const DocumentProposalOperationSchema = z.discriminatedUnion("kind", [
  AppendSectionOperationSchema,
  ReplaceSectionOperationSchema,
  InsertCommentOperationSchema,
  SuggestTitleOperationSchema,
  AddSummaryOperationSchema,
]);

export type AppendSectionOperation = z.infer<
  typeof AppendSectionOperationSchema
>;
export type ReplaceSectionOperation = z.infer<
  typeof ReplaceSectionOperationSchema
>;
export type InsertCommentOperation = z.infer<
  typeof InsertCommentOperationSchema
>;
export type SuggestTitleOperation = z.infer<
  typeof SuggestTitleOperationSchema
>;
export type AddSummaryOperation = z.infer<typeof AddSummaryOperationSchema>;
export type DocumentProposalOperation = z.infer<
  typeof DocumentProposalOperationSchema
>;

export const ProposalCitationSchema = z
  .object({
    sourceType: z.enum(["message", "document_version", "attachment"]),
    sourceId: SourceIdSchema,
    label: z.string().trim().min(1).max(255),
    locator: z.string().trim().min(1).max(1_024).optional(),
  })
  .strict();
export type ProposalCitation = z.infer<typeof ProposalCitationSchema>;

export const DocumentProposalStatusSchema = z.enum([
  "draft",
  "pending_review",
  "accepted",
  "partially_accepted",
  "rejected",
  "stale",
  "expired",
  "applying",
  "applied",
  "apply_failed",
]);

const HumanReviewerSchema = z
  .object({
    actorId: ActorIdSchema,
    actorKind: z.literal("human"),
  })
  .strict();

export const DocumentProposalSchema = z
  .object({
    id: DocumentProposalIdSchema,
    workspaceId: WorkspaceIdSchema,
    documentId: DocumentIdSchema,
    baseVersionId: DocumentVersionIdSchema,
    baseStateVector: Base64StateVectorSchema.optional(),
    agentId: ActorIdSchema,
    agentProfileVersionId: AgentProfileVersionIdSchema,
    delegatedByActorId: ActorIdSchema,
    delegatedByActorKind: z.literal("human"),
    runId: AgentRunIdSchema,
    status: DocumentProposalStatusSchema,
    operations: z.array(DocumentProposalOperationSchema).min(1).max(128),
    acceptedOperationIds: z.array(ProposalOperationIdSchema).max(128).default([]),
    rationale: z.string().trim().min(1).max(20_000),
    citations: z.array(ProposalCitationSchema).max(256),
    reviewedBy: HumanReviewerSchema.optional(),
    createdAt: ISODateTimeSchema,
    expiresAt: ISODateTimeSchema.optional(),
    reviewedAt: ISODateTimeSchema.optional(),
    appliedAt: ISODateTimeSchema.optional(),
    failureCode: z
      .string()
      .min(2)
      .max(80)
      .regex(/^[a-z0-9]+(?:_[a-z0-9]+)*$/)
      .optional(),
  })
  .strict()
  .superRefine((proposal, context) => {
    if (proposal.agentId === proposal.delegatedByActorId) {
      context.addIssue({
        code: "custom",
        path: ["delegatedByActorId"],
        message: "an AI proposal requires a distinct human delegator",
      });
    }

    const operationIds = proposal.operations.map(
      (operation) => operation.operationId,
    );
    const operationIdSet = new Set(operationIds);
    if (operationIdSet.size !== operationIds.length) {
      context.addIssue({
        code: "custom",
        path: ["operations"],
        message: "proposal operation IDs must be unique",
      });
    }

    const acceptedIdSet = new Set(proposal.acceptedOperationIds);
    if (acceptedIdSet.size !== proposal.acceptedOperationIds.length) {
      context.addIssue({
        code: "custom",
        path: ["acceptedOperationIds"],
        message: "accepted operation IDs must be unique",
      });
    }
    for (const acceptedId of acceptedIdSet) {
      if (!operationIdSet.has(acceptedId)) {
        context.addIssue({
          code: "custom",
          path: ["acceptedOperationIds"],
          message: "accepted operation must belong to this proposal",
        });
      }
    }

    const reviewedStatuses = new Set<
      z.infer<typeof DocumentProposalStatusSchema>
    >([
      "accepted",
      "partially_accepted",
      "rejected",
      "applying",
      "applied",
      "apply_failed",
    ]);
    const selectedCount = acceptedIdSet.size;
    const operationCount = operationIdSet.size;

    if (reviewedStatuses.has(proposal.status)) {
      if (proposal.reviewedBy === undefined || proposal.reviewedAt === undefined) {
        context.addIssue({
          code: "custom",
          path: ["reviewedBy"],
          message: "reviewed proposal states require a human reviewer and time",
        });
      }
    } else if (
      proposal.reviewedBy !== undefined ||
      proposal.reviewedAt !== undefined
    ) {
      context.addIssue({
        code: "custom",
        path: ["reviewedBy"],
        message: "unreviewed proposal states cannot contain review metadata",
      });
    }

    if (proposal.reviewedBy?.actorId === proposal.agentId) {
      context.addIssue({
        code: "custom",
        path: ["reviewedBy"],
        message: "an agent cannot review its own proposal",
      });
    }

    if (proposal.status === "accepted" && selectedCount !== operationCount) {
      context.addIssue({
        code: "custom",
        path: ["acceptedOperationIds"],
        message: "accepted proposals require every operation",
      });
    }
    if (
      proposal.status === "partially_accepted" &&
      (selectedCount === 0 || selectedCount >= operationCount)
    ) {
      context.addIssue({
        code: "custom",
        path: ["acceptedOperationIds"],
        message: "partially accepted proposals require a proper subset",
      });
    }
    if (
      new Set(["applying", "applied", "apply_failed"]).has(proposal.status) &&
      selectedCount === 0
    ) {
      context.addIssue({
        code: "custom",
        path: ["acceptedOperationIds"],
        message: "application requires at least one accepted operation",
      });
    }
    if (
      new Set(["draft", "pending_review", "rejected", "stale", "expired"]).has(
        proposal.status,
      ) &&
      selectedCount > 0
    ) {
      context.addIssue({
        code: "custom",
        path: ["acceptedOperationIds"],
        message: "this proposal state cannot contain accepted operations",
      });
    }

    if (proposal.status === "applied" && proposal.appliedAt === undefined) {
      context.addIssue({
        code: "custom",
        path: ["appliedAt"],
        message: "applied proposals require appliedAt",
      });
    }
    if (proposal.status !== "applied" && proposal.appliedAt !== undefined) {
      context.addIssue({
        code: "custom",
        path: ["appliedAt"],
        message: "only applied proposals can have appliedAt",
      });
    }
    if (proposal.status === "apply_failed" && proposal.failureCode === undefined) {
      context.addIssue({
        code: "custom",
        path: ["failureCode"],
        message: "apply_failed proposals require failureCode",
      });
    }
    if (proposal.status !== "apply_failed" && proposal.failureCode !== undefined) {
      context.addIssue({
        code: "custom",
        path: ["failureCode"],
        message: "only apply_failed proposals can have failureCode",
      });
    }

    if (
      proposal.expiresAt !== undefined &&
      !isAfter(proposal.expiresAt, proposal.createdAt)
    ) {
      context.addIssue({
        code: "custom",
        path: ["expiresAt"],
        message: "expiresAt must be after createdAt",
      });
    }
    if (proposal.status === "expired" && proposal.expiresAt === undefined) {
      context.addIssue({
        code: "custom",
        path: ["expiresAt"],
        message: "expired proposals require expiresAt",
      });
    }
    if (
      proposal.reviewedAt !== undefined &&
      !isAtOrAfter(proposal.reviewedAt, proposal.createdAt)
    ) {
      context.addIssue({
        code: "custom",
        path: ["reviewedAt"],
        message: "reviewedAt must not be before createdAt",
      });
    }
    if (
      proposal.expiresAt !== undefined &&
      proposal.reviewedAt !== undefined &&
      !isAfter(proposal.expiresAt, proposal.reviewedAt)
    ) {
      context.addIssue({
        code: "custom",
        path: ["reviewedAt"],
        message: "proposal review must happen before expiry",
      });
    }
    if (
      proposal.appliedAt !== undefined &&
      !isAtOrAfter(proposal.appliedAt, proposal.reviewedAt ?? proposal.createdAt)
    ) {
      context.addIssue({
        code: "custom",
        path: ["appliedAt"],
        message: "appliedAt must not be before review",
      });
    }
    if (
      proposal.expiresAt !== undefined &&
      proposal.appliedAt !== undefined &&
      !isAfter(proposal.expiresAt, proposal.appliedAt)
    ) {
      context.addIssue({
        code: "custom",
        path: ["appliedAt"],
        message: "proposal application must happen before expiry",
      });
    }
  });

export type DocumentProposalStatus = z.infer<
  typeof DocumentProposalStatusSchema
>;
export type DocumentProposal = z.infer<typeof DocumentProposalSchema>;
