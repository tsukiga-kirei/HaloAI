import { describe, expect, it } from "vitest";
import { createSessionPolicy } from "../src/session-policy";

describe("会话策略", () => {
  it("关闭滑动续期时把 updateAge 置为 0", () => {
    const policy = createSessionPolicy({
      sessionExpiresInSeconds: 604_800,
      sessionUpdateAgeSeconds: 86_400,
      slidingRenewal: true,
    });
    expect(policy.updateAge).toBe(86_400);
    policy.replace({
      sessionExpiresInSeconds: 86_400,
      sessionUpdateAgeSeconds: 3_600,
      slidingRenewal: false,
    });
    expect(policy.expiresIn).toBe(86_400);
    expect(policy.updateAge).toBe(0);
  });
});
