import { mkdtempSync, readFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { describe, expect, it } from "vitest";
import {
  createServiceLogger,
  diagnosticFields,
  diagnosticRequestPath,
  safeErrorFields,
} from "../src/index";

describe("service logger", () => {
  it("writes JSON locally and redacts known secret fields", () => {
    const directory = mkdtempSync(path.join(tmpdir(), "haloai-logger-"));
    const logger = createServiceLogger({
      service: "test-service",
      environment: "test",
      level: "info",
      logDirectory: directory,
      writeToStdout: false,
    });

    logger.info(
      {
        requestId: "request-1",
        password: "plain-password",
        api_key: "sk-live-secret",
        headers: { authorization: "Bearer secret-token" },
      },
      "测试日志",
    );

    const record = JSON.parse(readFileSync(path.join(directory, "test-service.log"), "utf8"));
    expect(record).toMatchObject({
      service: "test-service",
      environment: "test",
      requestId: "request-1",
      password: "[REDACTED]",
      api_key: "[REDACTED]",
      headers: { authorization: "[REDACTED]" },
      msg: "测试日志",
    });
    expect(record).toHaveProperty("time");
    expect(record).toHaveProperty("level");
  });

  it("does not serialize exception message or stack through err", () => {
    const directory = mkdtempSync(path.join(tmpdir(), "haloai-logger-"));
    const logger = createServiceLogger({
      service: "test-service",
      environment: "test",
      level: "error",
      logDirectory: directory,
      writeToStdout: false,
    });
    const error = Object.assign(new Error("postgresql://user:password@database/tenant"), {
      code: "CONNECTION_FAILED",
    });
    logger.error({ err: error }, "连接失败");

    const record = JSON.parse(readFileSync(path.join(directory, "test-service.log"), "utf8"));
    expect(record.err).toEqual({ errorName: "Error", errorCode: "CONNECTION_FAILED" });
    expect(JSON.stringify(record)).not.toContain("postgresql://");
    expect(JSON.stringify(record)).not.toContain("password@database");
  });

  it("keeps only stable error identity fields", () => {
    const error = Object.assign(new Error("postgresql://user:password@database/tenant"), {
      code: "CONNECTION_FAILED",
    });
    expect(safeErrorFields(error)).toEqual({
      errorName: "Error",
      errorCode: "CONNECTION_FAILED",
    });
  });

  it("strips query strings from diagnostic paths", () => {
    expect(diagnosticRequestPath("/v1/session?token=secret")).toBe("/v1/session");
    expect(
      diagnosticFields({
        requestId: "req-1",
        method: "GET",
        path: "/v1/workspaces/abc/audit?query=secret",
        workspaceId: "workspace-1",
      }),
    ).toEqual({
      requestId: "req-1",
      method: "GET",
      path: "/v1/workspaces/abc/audit",
      workspaceId: "workspace-1",
    });
  });
});
