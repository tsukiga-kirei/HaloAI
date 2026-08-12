import { describe, expect, it } from "vitest";
import { resolveWorkspaceAdminAccess } from "./workspace-admin-access";

describe("工作空间后台访问", () => {
  it("生产环境在真实认证接入前默认拒绝", () => {
    expect(
      resolveWorkspaceAdminAccess({ section: "overview", environment: "production" }),
    ).toMatchObject({ allowed: false, reason: "authentication_required" });
  });

  it("开发环境 Owner 可以进入所有工作空间后台分区", () => {
    for (const section of [
      "overview",
      "members",
      "agents",
      "integrations",
      "security",
      "audit",
    ] as const) {
      expect(
        resolveWorkspaceAdminAccess({ section, environment: "development", previewRole: "owner" })
          .allowed,
      ).toBe(true);
    }
  });

  it("普通成员不能通过直接路由进入管理总览", () => {
    expect(
      resolveWorkspaceAdminAccess({
        section: "overview",
        environment: "development",
        previewRole: "member",
      }),
    ).toMatchObject({ allowed: false, reason: "capability_missing" });
  });
});
