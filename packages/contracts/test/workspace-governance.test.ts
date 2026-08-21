import { describe, expect, it } from "vitest";
import {
  UpdateSessionProfileInputSchema,
  UpdateWorkspaceMemberStatusInputSchema,
  WorkspaceAllocatedModelSchema,
  WorkspaceAuditEventSchema,
  WorkspaceAuditQuerySchema,
  WorkspaceSecuritySnapshotSchema,
} from "../src/workspace-governance";

describe("工作空间治理契约", () => {
  it("审计查询把页码与空检索规范化，并拒绝未知结果枚举", () => {
    expect(
      WorkspaceAuditQuerySchema.parse({ page: "2", pageSize: "20", query: "  member  " }),
    ).toEqual({
      page: 2,
      pageSize: 20,
      query: "member",
    });
    expect(WorkspaceAuditQuerySchema.safeParse({ outcome: "success" }).success).toBe(false);
  });

  it("审计事件只接受标量摘要，拒绝嵌套对象和密钥字段形状", () => {
    const event = WorkspaceAuditEventSchema.parse({
      id: "00000000-0000-4000-8000-000000000901",
      action: "member.invited",
      resourceType: "invitation",
      resourceId: "00000000-0000-4000-8000-000000000902",
      decision: "allow",
      outcome: "succeeded",
      reasonCode: null,
      actorId: "00000000-0000-4000-8000-000000000201",
      actorName: "Andy",
      actorHandle: "andy",
      occurredAt: "2026-08-21T01:00:00.000Z",
      metadata: { email: "mina@haloai.dev", role: "member" },
    });
    expect(event.metadata).toEqual({ email: "mina@haloai.dev", role: "member" });
    expect(
      WorkspaceAuditEventSchema.safeParse({
        ...event,
        metadata: { nested: { secret: "x" } },
      }).success,
    ).toBe(false);
  });

  it("空间模型列表永不包含密钥，安全快照把高风险边界标为强制", () => {
    expect(
      WorkspaceAllocatedModelSchema.parse({
        id: "00000000-0000-4000-8000-000000000801",
        name: "Pilot Chat",
        provider: "openai",
        apiFormat: "openai_chat_completions",
        remoteModelId: "gpt-4.1-mini",
        contextWindow: 128000,
        status: "active",
        secretConfigured: true,
        allocatedAt: "2026-08-21T01:00:00.000Z",
      }).secretConfigured,
    ).toBe(true);
    expect(
      WorkspaceSecuritySnapshotSchema.parse({
        session: {
          cookieProtected: true,
          expiresInSeconds: 604_800,
          updateAgeSeconds: 86_400,
          slidingRenewal: true,
        },
        defaultLocale: "zh-CN",
        highRiskApprovalRequired: true,
        rowLevelIsolation: true,
        systemBreakGlassRequired: true,
      }).highRiskApprovalRequired,
    ).toBe(true);
  });

  it("成员状态与资料更新拒绝未知值", () => {
    expect(UpdateWorkspaceMemberStatusInputSchema.parse({ status: "suspended" }).status).toBe(
      "suspended",
    );
    expect(UpdateWorkspaceMemberStatusInputSchema.safeParse({ status: "left" }).success).toBe(
      false,
    );
    expect(UpdateSessionProfileInputSchema.parse({ name: " 林岚 " }).name).toBe("林岚");
    expect(UpdateSessionProfileInputSchema.safeParse({ name: "" }).success).toBe(false);
  });
});
