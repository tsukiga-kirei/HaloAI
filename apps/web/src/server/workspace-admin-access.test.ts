import { describe, expect, it } from "vitest";
import { resolveWorkspaceAdminAccess } from "./workspace-admin-access";

describe("工作空间后台访问", () => {
  it("未登录与无能力都拒绝，不再提供开发环境预览 Owner", () => {
    expect(resolveWorkspaceAdminAccess({ responseStatus: 401 })).toMatchObject({
      allowed: false,
      reason: "authentication_required",
    });
    expect(resolveWorkspaceAdminAccess({ responseStatus: 403 })).toMatchObject({
      allowed: false,
      reason: "permission_denied",
    });
  });

  it("只接受工作空间访问 API 的成功决定", () => {
    expect(
      resolveWorkspaceAdminAccess({
        responseStatus: 200,
        role: "owner",
        workspaceName: "HaloAI Alpha",
      }),
    ).toEqual({
      allowed: true,
      reason: "authorized",
      role: "owner",
      workspaceName: "HaloAI Alpha",
    });
    expect(resolveWorkspaceAdminAccess({ responseStatus: 503 }).allowed).toBe(false);
  });
});
