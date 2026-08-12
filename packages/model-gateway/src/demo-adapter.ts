import type { ModelAdapter, ModelRequest, ModelStreamEvent } from "./types";

export class DemoModelAdapter implements ModelAdapter {
  readonly provider = "demo";

  async *stream(request: ModelRequest): AsyncIterable<ModelStreamEvent> {
    if (request.signal?.aborted === true) {
      yield { type: "failed", code: "REQUEST_ABORTED", retryable: false };
      return;
    }

    const response =
      request.locale === "zh-CN"
        ? "这是确定性的本地模型网关演示。"
        : "This is a deterministic local model gateway demo.";
    yield { type: "text.delta", delta: response };
    yield {
      type: "usage",
      inputTokens: request.context.reduce(
        (total, item) => total + Math.ceil(item.content.length / 3),
        0,
      ),
      outputTokens: Math.ceil(response.length / 3),
      costMicros: 0,
    };
    yield { type: "completed", finishReason: "stop" };
  }
}
