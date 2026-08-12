import { describe, expect, it } from "vitest";
import { ActorIdSchema, ApiErrorSchema, ISODateTimeSchema } from "../src";

describe("基础跨边界值", () => {
  it("接受不透明 ID 与带时区的 ISO 时间", () => {
    expect(ActorIdSchema.parse("actor_human_001")).toBe("actor_human_001");
    expect(ISODateTimeSchema.parse("2026-08-09T10:15:30.000Z")).toBe("2026-08-09T10:15:30.000Z");
    expect(ISODateTimeSchema.parse("2026-08-09T18:15:30+08:00")).toBe("2026-08-09T18:15:30+08:00");
  });

  it("拒绝过短、含路径字符的 ID 与无时区时间", () => {
    expect(ActorIdSchema.safeParse("short").success).toBe(false);
    expect(ActorIdSchema.safeParse("actor/../../admin").success).toBe(false);
    expect(ISODateTimeSchema.safeParse("2026-08-09T10:15:30").success).toBe(false);
  });
});

describe("稳定 API 错误", () => {
  it("解析可国际化、可安全重试的限流错误", () => {
    const parsed = ApiErrorSchema.parse({
      code: "rate_limited",
      status: 429,
      messageKey: "errors.rate_limited",
      params: { limit: 20, scope: "workspace" },
      requestId: "request_000001",
      retryable: true,
      retryAfterMs: 2_000,
    });

    expect(parsed.code).toBe("rate_limited");
    expect(parsed.retryAfterMs).toBe(2_000);
  });

  it("拒绝错误码与 HTTP 状态不一致", () => {
    expect(
      ApiErrorSchema.safeParse({
        code: "permission_denied",
        status: 500,
        messageKey: "errors.permission_denied",
        requestId: "request_000001",
        retryable: false,
      }).success,
    ).toBe(false);
  });

  it("要求校验错误包含字段问题，并阻止不可重试错误携带重试时间", () => {
    expect(
      ApiErrorSchema.safeParse({
        code: "validation_failed",
        status: 422,
        messageKey: "errors.validation_failed",
        requestId: "request_000001",
        retryable: false,
      }).success,
    ).toBe(false);

    expect(
      ApiErrorSchema.safeParse({
        code: "service_unavailable",
        status: 503,
        messageKey: "errors.service_unavailable",
        requestId: "request_000001",
        retryable: false,
        retryAfterMs: 1_000,
      }).success,
    ).toBe(false);
  });

  it("拒绝把堆栈等未知内部字段泄露给客户端", () => {
    expect(
      ApiErrorSchema.safeParse({
        code: "internal_error",
        status: 500,
        messageKey: "errors.internal_error",
        requestId: "request_000001",
        retryable: false,
        stack: "database password and internal stack",
      }).success,
    ).toBe(false);
  });
});
