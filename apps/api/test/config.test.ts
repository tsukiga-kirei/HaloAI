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
      AUTH_BASE_URL: "http://127.0.0.2:3101",
    });
  });

  it("未写 AUTH_BASE_URL 时由 API 监听地址推导公开源站", () => {
    expect(readConfig({ NODE_ENV: "test", API_PORT: "3108" }).AUTH_BASE_URL).toBe(
      "http://127.0.0.1:3108",
    );
  });

  it("显式 AUTH_BASE_URL 优先于监听地址", () => {
    expect(
      readConfig({
        NODE_ENV: "test",
        API_HOST: "127.0.0.2",
        API_PORT: "3101",
        AUTH_BASE_URL: "https://api.halo.example",
      }).AUTH_BASE_URL,
    ).toBe("https://api.halo.example");
  });

  it("拒绝带路径的来源，防止部署者误把 URL 当成 Origin", () => {
    expect(() =>
      readConfig({
        NODE_ENV: "test",
        API_WEB_ORIGIN: "https://halo.example/callback",
      }),
    ).toThrow();
  });

  it("暴露真实会话时长并拒绝晚于到期时间的续期配置", () => {
    expect(
      readConfig({
        NODE_ENV: "test",
        AUTH_SESSION_EXPIRES_IN_SECONDS: "7200",
        AUTH_SESSION_UPDATE_AGE_SECONDS: "900",
      }),
    ).toMatchObject({
      AUTH_SESSION_EXPIRES_IN_SECONDS: 7200,
      AUTH_SESSION_UPDATE_AGE_SECONDS: 900,
    });
    expect(() =>
      readConfig({
        NODE_ENV: "test",
        AUTH_SESSION_EXPIRES_IN_SECONDS: "3600",
        AUTH_SESSION_UPDATE_AGE_SECONDS: "3600",
      }),
    ).toThrow();
  });

  it("生产环境拒绝本地模型密钥加密主密钥", () => {
    expect(() =>
      readConfig({
        NODE_ENV: "production",
        BETTER_AUTH_SECRET: "a-production-auth-secret-that-is-long-enough",
      }),
    ).toThrow();
  });
});
