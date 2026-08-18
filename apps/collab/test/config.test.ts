import { describe, expect, it } from "vitest";
import { hasCollaborationDemoIdentity, readCollaborationConfig } from "../src/config";

const completeDemoIdentity = {
  DEMO_TOKEN: "haloai-local-collaboration-ticket-000001",
  DEMO_ACTOR_ID: "actor_human_001",
  DEMO_WORKSPACE_ID: "workspace_00001",
  DEMO_DOCUMENT_ID: "document_000001",
  DEMO_ACCESS: "write",
} as const;

describe("协作服务配置", () => {
  it("未配置时使用与 Web 相同的回环来源", () => {
    expect(readCollaborationConfig({}).WEB_ORIGIN).toBe("http://127.0.0.1:3000");
  });

  it("DEMO_MODE 单独打开时不要求协作演示 ticket", () => {
    const config = readCollaborationConfig({ DEMO_MODE: "true" });

    expect(config.DEMO_MODE).toBe(true);
    expect(hasCollaborationDemoIdentity(config)).toBe(false);
  });

  it("完整演示身份不依赖 DEMO_MODE", () => {
    const config = readCollaborationConfig({ ...completeDemoIdentity });

    expect(config.DEMO_MODE).toBe(false);
    expect(hasCollaborationDemoIdentity(config)).toBe(true);
  });

  it("残缺的演示身份必须拒绝", () => {
    expect(() =>
      readCollaborationConfig({
        DEMO_TOKEN: completeDemoIdentity.DEMO_TOKEN,
      }),
    ).toThrow(/complete or entirely absent/u);
  });

  it("生产环境禁止 DEMO_MODE 与演示身份", () => {
    expect(() =>
      readCollaborationConfig({
        NODE_ENV: "production",
        DEMO_MODE: "true",
      }),
    ).toThrow(/DEMO_MODE is forbidden in production/u);

    expect(() =>
      readCollaborationConfig({
        NODE_ENV: "production",
        ...completeDemoIdentity,
      }),
    ).toThrow(/forbidden in production/u);
  });
});
