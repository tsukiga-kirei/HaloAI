import type { Id, Locale } from "@haloai/core";

export interface ModelReference {
  provider: string;
  model: string;
}

export type ContextTrust = "system_policy" | "user_authored" | "untrusted_external";

/**
 * 每段上下文都携带来源和可信度，防止附件、网页或工具结果被误拼进系统策略区。
 * `authorizedByDecisionId` 指向已记录的权限结论，不等于内容本身可信。
 */
export interface ModelContextItem {
  id: Id;
  kind: "instruction" | "message" | "document_fragment" | "memory" | "tool_result";
  trust: ContextTrust;
  content: string;
  sourceId?: Id;
  authorizedByDecisionId: Id;
}

export interface ModelRequest {
  requestId: Id;
  workspaceId: Id;
  runId: Id;
  model: ModelReference;
  locale: Locale;
  context: readonly ModelContextItem[];
  maxOutputTokens: number;
  temperature?: number;
  signal?: AbortSignal;
}

export type ModelStreamEvent =
  | { type: "text.delta"; delta: string }
  | { type: "usage"; inputTokens: number; outputTokens: number; costMicros?: number }
  | { type: "completed"; finishReason: "stop" | "length" | "content_filter" }
  | {
      type: "failed";
      code: "PROVIDER_UNAVAILABLE" | "RATE_LIMITED" | "REQUEST_ABORTED" | "INVALID_RESPONSE";
      retryable: boolean;
    };

export interface ModelAdapter {
  readonly provider: string;
  stream(request: ModelRequest): AsyncIterable<ModelStreamEvent>;
}
