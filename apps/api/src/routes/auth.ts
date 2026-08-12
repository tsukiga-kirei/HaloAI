import type { FastifyInstance } from "fastify";
import { fromNodeHeaders } from "better-auth/node";
import type { ApiConfig } from "../config";
import type { HaloAuth } from "../auth";

function requestBody(request: { method: string; body?: unknown }): BodyInit | undefined {
  if (request.method === "GET" || request.method === "HEAD" || request.body === undefined) {
    return undefined;
  }
  return typeof request.body === "string" ? request.body : JSON.stringify(request.body);
}

/**
 * Fastify 只负责传输适配，注册、登录、登出和会话轮换全部交给认证组件。
 * Set-Cookie 必须作为多值头逐个转发，不能用逗号合并，否则部分代理会破坏 Cookie 属性。
 */
export async function registerAuthRoutes(
  app: FastifyInstance,
  auth: HaloAuth,
  config: ApiConfig,
): Promise<void> {
  app.route({
    method: ["GET", "POST"],
    url: "/api/auth/*",
    config: { rateLimit: { max: 30, timeWindow: "1 minute" } },
    async handler(request, reply) {
      const headers = fromNodeHeaders(request.headers);
      const url = new URL(request.raw.url ?? request.url, config.AUTH_BASE_URL);
      const body = requestBody(request);
      const response = await auth.handler(
        new Request(url, {
          method: request.method,
          headers,
          ...(body === undefined ? {} : { body }),
        }),
      );

      const responseHeaders = response.headers as Headers & { getSetCookie?: () => string[] };
      const cookies = responseHeaders.getSetCookie?.() ?? [];
      response.headers.forEach((value, key) => {
        if (key.toLowerCase() !== "set-cookie" && key.toLowerCase() !== "content-length") {
          reply.header(key, value);
        }
      });
      if (cookies.length > 0) {
        reply.header("set-cookie", cookies);
      }
      reply.status(response.status);
      const responseBody = Buffer.from(await response.arrayBuffer());
      const hidesToken =
        url.pathname.endsWith("/sign-in/email") || url.pathname.endsWith("/sign-up/email");
      if (hidesToken && response.headers.get("content-type")?.includes("application/json")) {
        const payload = JSON.parse(responseBody.toString("utf8")) as Record<string, unknown>;
        delete payload.token;
        return reply.send(payload);
      }
      return reply.send(responseBody.byteLength > 0 ? responseBody : null);
    },
  });
}
