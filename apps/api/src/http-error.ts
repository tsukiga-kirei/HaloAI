import type { ApiErrorCode } from "@haloai/contracts";

/**
 * HTTP 状态只由稳定错误码推导。响应文案走国际化 key，禁止把内部异常文本交给浏览器。
 */
const statusByCode: Readonly<Record<ApiErrorCode, number>> = {
  authentication_required: 401,
  permission_denied: 403,
  resource_not_found: 404,
  validation_failed: 422,
  conflict: 409,
  idempotency_conflict: 409,
  replay_expired: 409,
  payload_too_large: 413,
  rate_limited: 429,
  internal_error: 500,
  service_unavailable: 503,
  workspace_slug_conflict: 409,
  membership_required: 403,
  last_owner_required: 409,
  invitation_invalid: 404,
  delegation_denied: 403,
};

export class HttpError extends Error {
  readonly status: number;

  constructor(
    readonly code: ApiErrorCode,
    readonly messageKey: string,
  ) {
    super(messageKey);
    this.name = "HttpError";
    this.status = statusByCode[code];
  }
}
