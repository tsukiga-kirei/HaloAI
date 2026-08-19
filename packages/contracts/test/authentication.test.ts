import { describe, expect, it } from "vitest";
import {
  AcceptWorkspaceInvitationInputSchema,
  CreateWorkspaceInputSchema,
  CreateWorkspaceInvitationInputSchema,
} from "../src/authentication";

describe("认证与工作区契约", () => {
  it("规范化工作区标识与邀请邮箱", () => {
    expect(
      CreateWorkspaceInputSchema.parse({
        name: " 产品团队 ",
        slug: "Product-Team",
      }),
    ).toMatchObject({ name: "产品团队", slug: "product-team" });
    expect(
      CreateWorkspaceInvitationInputSchema.parse({
        email: " Member@Example.COM ",
        departmentId: "00000000-0000-4000-8000-000000000701",
        jobTitle: " 产品经理 ",
      }),
    ).toMatchObject({
      email: "member@example.com",
      role: "member",
      departmentId: "00000000-0000-4000-8000-000000000701",
      jobTitle: "产品经理",
    });
  });

  it("拒绝路径式工作区标识和低熵邀请令牌", () => {
    expect(() =>
      CreateWorkspaceInputSchema.parse({ name: "产品团队", slug: "../other-team" }),
    ).toThrow();
    expect(() => AcceptWorkspaceInvitationInputSchema.parse({ token: "short" })).toThrow();
  });
});
