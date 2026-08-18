import { mkdtempSync, readFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { createServiceLogger, safeErrorFields } from "../src/index";

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
      headers: { authorization: "[REDACTED]" },
      msg: "测试日志",
    });
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
});
