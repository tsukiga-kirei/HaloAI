import type { ModelAdapter, ModelRequest, ModelStreamEvent } from "./types";

export class UnknownModelProviderError extends Error {
  constructor(provider: string) {
    super(`No model adapter registered for provider: ${provider}`);
    this.name = "UnknownModelProviderError";
  }
}

/**
 * 领域层只认识 HaloAI 自己的模型端口。供应商 SDK 被限制在 Adapter 内，因而换模型不会改变
 * Actor、AgentVersion、Run、消息或权限数据结构，也不会让 SDK 类型渗透到数据库契约。
 */
export class ModelGateway {
  private readonly adapters: ReadonlyMap<string, ModelAdapter>;

  constructor(adapters: readonly ModelAdapter[]) {
    this.adapters = new Map(adapters.map((adapter) => [adapter.provider, adapter]));
    if (this.adapters.size !== adapters.length) {
      throw new Error("Model adapter provider names must be unique");
    }
  }

  stream(request: ModelRequest): AsyncIterable<ModelStreamEvent> {
    const adapter = this.adapters.get(request.model.provider);
    if (adapter === undefined) throw new UnknownModelProviderError(request.model.provider);
    return adapter.stream(request);
  }
}
