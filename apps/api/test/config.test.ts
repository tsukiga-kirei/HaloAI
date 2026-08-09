import { describe, expect, it } from "vitest";
import { readConfig } from "../src/config";

describe("API 环境配置", () => {
  it("使用 API_ 前缀并忽略可能与其他进程冲突的通用端口", () => {
    const config = readConfig({
      NODE_ENV: "test",
      HOST: "0.0.0.0",
      PORT: "9999",
      API_HOST: "127.0.0.2",
      API_PORT: "3101",
      API_WEB_ORIGIN: "https://halo.example",
    });

    expect(config).toMatchObject({
      HOST: "127.0.0.2",
      PORT: 3101,
      WEB_ORIGIN: "https://halo.example",
    });
  });

  it("拒绝带路径的来源，防止部署者误把 URL 当成 Origin", () => {
    expect(() =>
      readConfig({
        NODE_ENV: "test",
        API_WEB_ORIGIN: "https://halo.example/callback",
      }),
    ).toThrow();
  });
});
