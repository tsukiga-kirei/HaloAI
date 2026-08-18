import { describe, expect, it } from "vitest";
import { resolveSystemAdminAccess } from "./system-admin-access";

describe("系统后台访问", () => {
  it("未登录与无平台授权都拒绝", () => {
    expect(resolveSystemAdminAccess({ responseStatus: 401 })).toMatchObject({
      allowed: false,
      reason: "authentication_required",
    });
    expect(resolveSystemAdminAccess({ responseStatus: 403 })).toMatchObject({
      allowed: false,
      reason: "permission_denied",
    });
  });

  it("只接受平台访问 API 的成功决定", () => {
    expect(resolveSystemAdminAccess({ responseStatus: 200 })).toEqual({
      allowed: true,
      reason: "authorized",
    });
    expect(resolveSystemAdminAccess({ responseStatus: 503 }).allowed).toBe(false);
  });
});
