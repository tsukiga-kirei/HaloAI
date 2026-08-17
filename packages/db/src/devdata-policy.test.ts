import { describe, expect, it } from "vitest";
import { shouldApplyDevdata } from "./devdata-policy";

describe("虚拟数据开关", () => {
  it("仅在 DEMO_MODE=true 时执行本地种子", () => {
    expect(shouldApplyDevdata({ DEMO_MODE: "true" })).toBe(true);
    expect(shouldApplyDevdata({ DEMO_MODE: "false" })).toBe(false);
    expect(shouldApplyDevdata({})).toBe(false);
  });

  it("生产环境禁止打开 DEMO_MODE", () => {
    expect(() => shouldApplyDevdata({ NODE_ENV: "production", DEMO_MODE: "true" })).toThrow(
      /生产环境禁止 DEMO_MODE/,
    );
    expect(shouldApplyDevdata({ NODE_ENV: "production" })).toBe(false);
  });
});
