import { describe, expect, it } from "vitest";
import { resolveSystemAdminAccess } from "./system-admin-access";

describe("系统后台访问", () => {
  it("生产环境在真实认证接入前默认拒绝", () => {
    expect(resolveSystemAdminAccess({ environment: "production" })).toMatchObject({
      allowed: false,
      reason: "authentication_required",
    });
  });

  it("开发与测试环境允许平台预览壳", () => {
    expect(resolveSystemAdminAccess({ environment: "development" }).allowed).toBe(true);
    expect(resolveSystemAdminAccess({ environment: "test" }).allowed).toBe(true);
  });
});
