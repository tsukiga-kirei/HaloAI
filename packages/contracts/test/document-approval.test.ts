import { describe, expect, it } from "vitest";
import { ApprovalSchema, DocumentProposalSchema } from "../src";

const createdAt = "2026-08-09T10:00:00.000Z";
const reviewedAt = "2026-08-09T10:05:00.000Z";
const expiresAt = "2026-08-09T11:00:00.000Z";
const digest = "a".repeat(64);

const operations = [
  {
    kind: "suggest_title",
    operationId: "operation_000001",
    title: "Launch plan",
  },
  {
    kind: "insert_comment",
    operationId: "operation_000002",
    targetNodeId: "node_000000001",
    body: "Please verify the launch date.",
  },
];

const pendingProposal = {
  id: "proposal_000001",
  workspaceId: "workspace_00001",
  documentId: "document_000001",
  baseVersionId: "doc_version_0001",
  agentId: "actor_agent_001",
  agentProfileVersionId: "profile_version_01",
  delegatedByActorId: "actor_human_001",
  delegatedByActorKind: "human",
  runId: "run_0000000001",
  status: "pending_review",
  operations,
  rationale: "Improve clarity and request verification of one uncertain fact.",
  citations: [],
  createdAt,
  expiresAt,
};

const pendingApproval = {
  id: "approval_000001",
  workspaceId: "workspace_00001",
  action: "document_proposal.apply",
  targetType: "document_proposal",
  targetId: "proposal_000001",
  parameterDigest: digest,
  parameterSummary: { operationCount: 2 },
  summaryKey: "approvals.document_proposal_apply",
  requestedByActorId: "actor_agent_001",
  requestedByActorKind: "agent",
  delegatedByActorId: "actor_human_001",
  delegatedByActorKind: "human",
  runId: "run_0000000001",
  runStateVersion: 7,
  agentProfileVersionId: "profile_version_01",
  authorizationSnapshotId: "auth_snapshot_001",
  status: "pending",
  createdAt,
  expiresAt,
};

describe("文档提案", () => {
  it("接受绑定文档基线、AgentRun 与角色版本的待审提案", () => {
    const parsed = DocumentProposalSchema.parse(pendingProposal);

    expect(parsed.status).toBe("pending_review");
    expect(parsed.acceptedOperationIds).toEqual([]);
  });

  it("接受由人类选择真子集的部分通过提案", () => {
    expect(
      DocumentProposalSchema.safeParse({
        ...pendingProposal,
        status: "partially_accepted",
        acceptedOperationIds: ["operation_000001"],
        reviewedBy: {
          actorId: "actor_reviewer_01",
          actorKind: "human",
        },
        reviewedAt,
      }).success,
    ).toBe(true);
  });

  it("拒绝重复操作、未知选择以及由 AI 自己审阅", () => {
    expect(
      DocumentProposalSchema.safeParse({
        ...pendingProposal,
        operations: [operations[0], operations[0]],
      }).success,
    ).toBe(false);

    expect(
      DocumentProposalSchema.safeParse({
        ...pendingProposal,
        status: "partially_accepted",
        acceptedOperationIds: ["operation_unknown_01"],
        reviewedBy: {
          actorId: "actor_reviewer_01",
          actorKind: "human",
        },
        reviewedAt,
      }).success,
    ).toBe(false);

    expect(
      DocumentProposalSchema.safeParse({
        ...pendingProposal,
        status: "accepted",
        acceptedOperationIds: ["operation_000001", "operation_000002"],
        reviewedBy: {
          actorId: pendingProposal.agentId,
          actorKind: "human",
        },
        reviewedAt,
      }).success,
    ).toBe(false);
  });

  it("拒绝协议未声明的任意文档替换操作", () => {
    expect(
      DocumentProposalSchema.safeParse({
        ...pendingProposal,
        operations: [
          {
            kind: "replace_document",
            operationId: "operation_000003",
            contentMarkdown: "Unreviewed replacement",
          },
        ],
      }).success,
    ).toBe(false);
  });
});

describe("高风险审批", () => {
  it("接受绑定动作、参数摘要哈希与人类委托者的待审请求", () => {
    const parsed = ApprovalSchema.parse(pendingApproval);

    expect(parsed.action).toBe("document_proposal.apply");
    expect(parsed.parameterDigest).toBe(digest);
  });

  it("接受由另一位人类审阅且绑定具体工具的执行审批", () => {
    expect(
      ApprovalSchema.safeParse({
        ...pendingApproval,
        action: "tool.execute",
        targetType: "tool_call",
        targetId: "tool_call_00001",
        toolId: "tool_000000001",
        toolVersion: "2.1.0",
        status: "approved",
        reviewedBy: {
          actorId: "actor_reviewer_01",
          actorKind: "human",
        },
        resolvedAt: reviewedAt,
      }).success,
    ).toBe(true);
  });

  it("拒绝动作与目标不匹配、缺少工具以及请求方自批", () => {
    expect(
      ApprovalSchema.safeParse({
        ...pendingApproval,
        targetType: "payment",
      }).success,
    ).toBe(false);

    expect(
      ApprovalSchema.safeParse({
        ...pendingApproval,
        action: "tool.execute",
        targetType: "tool_call",
      }).success,
    ).toBe(false);

    expect(
      ApprovalSchema.safeParse({
        ...pendingApproval,
        status: "approved",
        reviewedBy: {
          actorId: pendingApproval.requestedByActorId,
          actorKind: "human",
        },
        resolvedAt: reviewedAt,
      }).success,
    ).toBe(false);
  });
});
