import type { FastifyReply, FastifyRequest } from "fastify";
import { diagnosticFields, diagnosticRequestPath, safeErrorFields } from "@haloai/logger";
import { ZodError } from "zod";
import { PersistenceError } from "@haloai/db";
import { HttpError } from "./http-error";

interface SafeErrorBody {
  error: {
    code: string;
    messageKey: string;
    requestId: string;
    details?: ReadonlyArray<{ path: string; code: string }>;
  };
}

/**
 * API 永远返回稳定错误码和国际化 key，不把内部异常文本当作用户文案。异常原文仅进入
 * 受控服务端日志，避免 SQL、路径、供应商响应或敏感参数通过错误页泄露给浏览器。
 */
export function handleError(error: Error, request: FastifyRequest, reply: FastifyReply): void {
  const requestContext = diagnosticFields({
    requestId: request.id,
    method: request.method,
    path: diagnosticRequestPath(request.url),
  });

  if (error instanceof HttpError) {
    if (error.status >= 500) {
      request.log.error({ ...requestContext, errorCode: error.code }, "请求处理失败");
    }
    reply.status(error.status).send({
      error: { code: error.code, messageKey: error.messageKey, requestId: request.id },
    });
    return;
  }

  if (error instanceof PersistenceError) {
    const mapped = mapPersistenceError(error);
    if (mapped.status >= 500) {
      request.log.error({ ...requestContext, errorCode: mapped.code }, "请求处理失败");
    }
    reply.status(mapped.status).send({
      error: { code: mapped.code, messageKey: mapped.messageKey, requestId: request.id },
    });
    return;
  }
  if (error instanceof ZodError) {
    const body: SafeErrorBody = {
      error: {
        code: "VALIDATION_FAILED",
        messageKey: "errors.validationFailed",
        requestId: request.id,
        details: error.issues.map((issue) => ({
          path: issue.path.join("."),
          code: issue.code,
        })),
      },
    };
    reply.status(400).send(body);
    return;
  }

  request.log.error({ ...requestContext, ...safeErrorFields(error) }, "请求处理失败");
  const body: SafeErrorBody = {
    error: {
      code: "INTERNAL_ERROR",
      messageKey: "errors.internal",
      requestId: request.id,
    },
  };
  reply.status(500).send(body);
}

function mapPersistenceError(error: PersistenceError): HttpError {
  switch (error.code) {
    case "access_denied":
      return new HttpError("permission_denied", "errors.permissionDenied");
    case "not_found":
      return new HttpError("resource_not_found", "errors.resourceNotFound");
    case "conflict":
      return new HttpError("workspace_slug_conflict", "errors.workspaceSlugConflict");
    case "last_owner_required":
      return new HttpError("last_owner_required", "errors.lastOwnerRequired");
    case "invitation_invalid":
      return new HttpError("invitation_invalid", "errors.invitationInvalid");
    case "delegation_denied":
      return new HttpError("delegation_denied", "errors.delegationDenied");
    case "invalid_context":
    case "invalid_input":
      return new HttpError("validation_failed", "errors.validationFailed");
  }
}
