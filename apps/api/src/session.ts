import type { FastifyRequest } from "fastify";
import { fromNodeHeaders } from "better-auth/node";
import type { HaloAuth } from "./auth";
import { HttpError } from "./http-error";

/**
 * 只接受认证组件签发的会话 Cookie。请求体、查询参数和客户端保存的 workspaceId 都不是登录证据。
 */
export async function requireSession(auth: HaloAuth, request: FastifyRequest) {
  const session = await auth.api.getSession({ headers: fromNodeHeaders(request.headers) });
  if (!session) {
    throw new HttpError("authentication_required", "errors.authenticationRequired");
  }
  return session;
}

export type VerifiedSession = Awaited<ReturnType<typeof requireSession>>;
