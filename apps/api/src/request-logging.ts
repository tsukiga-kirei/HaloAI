import type { FastifyInstance, FastifyRequest } from "fastify";
import { diagnosticFields, diagnosticRequestPath } from "@haloai/logger";

/**
 * 关闭 Fastify 默认请求日志：它会把 URL 查询串和未审查的 req 对象打进诊断流。
 * 这里只记录方法、路径、状态和耗时；健康检查降为 debug，避免探活刷满 info。
 */
export function registerRequestLogging(app: FastifyInstance): void {
  app.addHook("onRequest", (request, _reply, done) => {
    request.diagnosticStartedAt = Date.now();
    done();
  });

  app.addHook("onResponse", (request, reply, done) => {
    const statusCode = reply.statusCode;
    const path = diagnosticRequestPath(request.url);
    const workspaceId = requestWorkspaceId(request);
    const fields = diagnosticFields({
      requestId: request.id,
      method: request.method,
      path,
      statusCode,
      durationMs: Date.now() - (request.diagnosticStartedAt ?? Date.now()),
      ...(workspaceId ? { workspaceId } : {}),
    });

    if (path.startsWith("/health/")) {
      request.log.debug(fields, "健康检查完成");
    } else if (statusCode < 500) {
      if (statusCode >= 400) {
        request.log.warn(fields, "请求被拒绝");
      } else {
        request.log.info(fields, "请求完成");
      }
    }
    done();
  });
}

function requestWorkspaceId(request: FastifyRequest): string | undefined {
  const params = request.params;
  if (typeof params !== "object" || params === null || !("workspaceId" in params)) {
    return undefined;
  }
  const value = params.workspaceId;
  return typeof value === "string" && value.length === 36 ? value : undefined;
}

declare module "fastify" {
  interface FastifyRequest {
    diagnosticStartedAt?: number;
  }
}
