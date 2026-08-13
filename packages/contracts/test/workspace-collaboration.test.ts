import { describe, expect, it } from "vitest";
import {
  AddProjectMemberInputSchema,
  CreateDocumentInputSchema,
  CreateProjectInputSchema,
  CreateRoomInputSchema,
  ProjectCreatedResponseSchema,
} from "../src";

describe("非 AI 协作 HTTP 契约", () => {
  it("只接受明确的项目、房间与文档输入字段", () => {
    expect(CreateProjectInputSchema.parse({ name: "Alpha" }).name).toBe("Alpha");
    expect(CreateRoomInputSchema.parse({ name: "Launch" }).visibility).toBe("private");
    expect(CreateDocumentInputSchema.safeParse({ title: "Brief" }).success).toBe(true);
    expect(
      CreateRoomInputSchema.safeParse({ name: "Launch", workspaceId: crypto.randomUUID() }).success,
    ).toBe(false);
  });

  it("拒绝客户端注入成员以外的项目角色字段", () => {
    const actorId = crypto.randomUUID();
    expect(AddProjectMemberInputSchema.safeParse({ actorId, role: "reviewer" }).success).toBe(true);
    expect(
      AddProjectMemberInputSchema.safeParse({
        actorId,
        role: "lead",
        workspaceId: crypto.randomUUID(),
      }).success,
    ).toBe(false);
  });

  it("对创建响应保留稳定的资源包装结构", () => {
    expect(() =>
      ProjectCreatedResponseSchema.parse({
        project: {
          id: crypto.randomUUID(),
          workspaceId: crypto.randomUUID(),
          name: "Alpha",
          description: "",
          goal: "",
          expectedArtifact: "",
          completionCriteria: "",
          status: "active",
          currentActorRole: "lead",
          createdAt: "2026-08-13T08:00:00.000Z",
          updatedAt: "2026-08-13T08:00:00.000Z",
        },
      }),
    ).not.toThrow();
  });
});
