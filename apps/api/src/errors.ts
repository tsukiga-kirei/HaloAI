import type { FastifyReply, FastifyRequest } from "fastify";
import { ZodError } from "zod";

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

  request.log.error({ error }, "请求处理失败");
  const body: SafeErrorBody = {
    error: {
      code: "INTERNAL_ERROR",
      messageKey: "errors.internal",
      requestId: request.id,
    },
  };
  reply.status(500).send(body);
}
