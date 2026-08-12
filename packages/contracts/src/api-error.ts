import { z } from "zod";
import { JsonScalarSchema, RequestIdSchema } from "./primitives";

export const ApiErrorCodeSchema = z.enum([
  "authentication_required",
  "permission_denied",
  "resource_not_found",
  "validation_failed",
  "conflict",
  "idempotency_conflict",
  "replay_expired",
  "payload_too_large",
  "rate_limited",
  "internal_error",
  "service_unavailable",
  "workspace_slug_conflict",
  "membership_required",
  "last_owner_required",
  "invitation_invalid",
  "delegation_denied",
]);

const statusByCode: Readonly<Record<z.infer<typeof ApiErrorCodeSchema>, number>> = {
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

const ApiErrorParamsSchema = z
  .record(z.string().min(1).max(80), JsonScalarSchema)
  .refine((params) => Object.keys(params).length <= 32, {
    message: "API error params cannot contain more than 32 entries",
  });

export const ApiFieldErrorSchema = z
  .object({
    path: z.array(z.union([z.string().max(128), z.number().int().nonnegative()])).max(16),
    code: z
      .string()
      .min(2)
      .max(80)
      .regex(/^[a-z0-9]+(?:_[a-z0-9]+)*$/),
    messageKey: z
      .string()
      .min(3)
      .max(160)
      .regex(/^[a-z0-9]+(?:[._-][a-z0-9]+)+$/),
  })
  .strict();

/**
 * API 错误只携带稳定 code、国际化 key 和受限标量参数，不允许把异常消息、
 * SQL、堆栈或任意嵌套对象传到客户端。HTTP status 与 code 的固定映射可避免
 * 不同端点对同一种错误给出互相矛盾的缓存、重试和登录行为。
 */
export const ApiErrorSchema = z
  .object({
    code: ApiErrorCodeSchema,
    status: z.number().int().min(400).max(599),
    messageKey: z
      .string()
      .min(3)
      .max(160)
      .regex(/^[a-z0-9]+(?:[._-][a-z0-9]+)+$/),
    params: ApiErrorParamsSchema.default({}),
    fieldErrors: z.array(ApiFieldErrorSchema).min(1).max(100).optional(),
    requestId: RequestIdSchema,
    retryable: z.boolean(),
    retryAfterMs: z.number().int().positive().max(86_400_000).optional(),
  })
  .strict()
  .superRefine((error, context) => {
    if (error.status !== statusByCode[error.code]) {
      context.addIssue({
        code: "custom",
        path: ["status"],
        message: "status does not match stable API error code",
      });
    }

    if (error.code === "rate_limited" && error.retryAfterMs === undefined) {
      context.addIssue({
        code: "custom",
        path: ["retryAfterMs"],
        message: "rate-limited errors require retryAfterMs",
      });
    }
    if (error.retryAfterMs !== undefined && !error.retryable) {
      context.addIssue({
        code: "custom",
        path: ["retryAfterMs"],
        message: "retryAfterMs requires retryable=true",
      });
    }
    if (error.code === "validation_failed" && error.fieldErrors === undefined) {
      context.addIssue({
        code: "custom",
        path: ["fieldErrors"],
        message: "validation errors require fieldErrors",
      });
    }
  });

export type ApiErrorCode = z.infer<typeof ApiErrorCodeSchema>;
export type ApiFieldError = z.infer<typeof ApiFieldErrorSchema>;
export type ApiError = z.infer<typeof ApiErrorSchema>;
