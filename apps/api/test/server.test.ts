import { afterEach, describe, expect, it } from "vitest";
import type { FastifyInstance } from "fastify";
import { createServer } from "../src/server";

let app: FastifyInstance | undefined;

const testConfig = {
  NODE_ENV: "test" as const,
  HOST: "127.0.0.1",
  PORT: 3100,
  LOG_LEVEL: "silent" as const,
  WEB_ORIGIN: "http://localhost:3000",
  AUTH_BASE_URL: "http://localhost:3100",
  AUTH_SECRET: "haloai-test-auth-secret-that-is-long-enough",
  DATABASE_URL: "postgresql://haloai_app:test@localhost:5432/haloai_test",
  AUTH_DATABASE_URL: "postgresql://haloai_auth:test@localhost:5432/haloai_test",
  EXPOSE_DEVELOPMENT_INVITE_TOKENS: false,
};

afterEach(async () => {
  await app?.close();
  app = undefined;
});

describe("API 服务边界", () => {
  it("提供无缓存的就绪检查", async () => {
    app = await createServer(testConfig);
    const response = await app.inject({ method: "GET", url: "/health/ready" });
    expect(response.statusCode).toBe(200);
    expect(response.headers["cache-control"]).toBe("no-store");
    expect(response.json()).toEqual({ status: "ready", checks: { api: "ok" } });
  });

  it("SSE 按 Last-Event-ID 只补发后续事件", async () => {
    app = await createServer(testConfig);
    const response = await app.inject({
      method: "GET",
      url: "/v1/demo/runs/run-1/events",
      headers: { "last-event-id": "2" },
    });
    expect(response.statusCode).toBe(200);
    expect(response.headers["content-type"]).toContain("text/event-stream");
    expect(response.body).not.toContain("id: 1\n");
    expect(response.body).toContain("id: 3\n");
    expect(response.body).toContain("id: 4\n");
  });
});
