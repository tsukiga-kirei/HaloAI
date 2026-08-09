import { describe, expect, it } from "vitest";
import { DemoModelAdapter, ModelGateway, UnknownModelProviderError } from "../src";

describe("模型网关", () => {
  it("拒绝未注册的供应商", () => {
    const gateway = new ModelGateway([]);
    expect(() =>
      gateway.stream({
        requestId: "request-1",
        workspaceId: "workspace-1",
        runId: "run-1",
        model: { provider: "missing", model: "unknown" },
        locale: "zh-CN",
        context: [],
        maxOutputTokens: 100,
      }),
    ).toThrow(UnknownModelProviderError);
  });

  it("通过内部事件协议流式返回，而不暴露供应商对象", async () => {
    const gateway = new ModelGateway([new DemoModelAdapter()]);
    const events = [];
    for await (const event of gateway.stream({
      requestId: "request-1",
      workspaceId: "workspace-1",
      runId: "run-1",
      model: { provider: "demo", model: "local" },
      locale: "zh-CN",
      context: [],
      maxOutputTokens: 100,
    })) {
      events.push(event.type);
    }
    expect(events).toEqual(["text.delta", "usage", "completed"]);
  });
});
