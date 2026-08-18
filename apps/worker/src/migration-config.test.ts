import { describe, expect, it } from "vitest";
import { readWorkerMigrationConfig } from "./migration-config";

describe("Worker 迁移配置", () => {
  it("为 Graphile Worker 使用独立管理员连接和固定默认 schema", () => {
    expect(
      readWorkerMigrationConfig({
        DATABASE_ADMIN_URL: "postgresql://admin:secret@localhost:5432/haloai",
        HALOAI_APP_USER: "haloai_app",
      }),
    ).toMatchObject({
      HALOAI_APP_USER: "haloai_app",
      GRAPHILE_WORKER_SCHEMA: "graphile_worker",
      LOG_LEVEL: "info",
    });
  });

  it("拒绝可改变授权 SQL 的角色名或 schema 名", () => {
    expect(() =>
      readWorkerMigrationConfig({
        DATABASE_ADMIN_URL: "postgresql://admin:secret@localhost:5432/haloai",
        HALOAI_APP_USER: "haloai_app; grant all to public",
      }),
    ).toThrow();

    expect(() =>
      readWorkerMigrationConfig({
        DATABASE_ADMIN_URL: "postgresql://admin:secret@localhost:5432/haloai",
        HALOAI_APP_USER: "haloai_app",
        GRAPHILE_WORKER_SCHEMA: "graphile-worker",
      }),
    ).toThrow();
  });
});
