import { describe, expect, it } from "vitest";
import { webOriginAllowlist } from "../src/web-origins";

describe("浏览器 Origin 白名单", () => {
  it("为本地回环地址补充 localhost 与 127.0.0.1 互认", () => {
    expect(webOriginAllowlist("http://127.0.0.1:3000")).toEqual([
      "http://127.0.0.1:3000",
      "http://localhost:3000",
    ]);
    expect(webOriginAllowlist("http://localhost:3000")).toEqual([
      "http://localhost:3000",
      "http://127.0.0.1:3000",
    ]);
  });

  it("生产主机名不得自动扩展", () => {
    expect(webOriginAllowlist("https://app.haloai.example")).toEqual([
      "https://app.haloai.example",
    ]);
  });
});
