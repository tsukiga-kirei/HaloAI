import { describe, expect, it } from "vitest";
import { resolveApiOrigin } from "./api-origin";

describe("API 源站地址", () => {
  it("未配置时使用本地默认端口", () => {
    expect(resolveApiOrigin({})).toBe("http://127.0.0.1:3100");
  });

  it("未写 AUTH_BASE_URL 时由监听地址推导", () => {
    expect(resolveApiOrigin({ API_HOST: "127.0.0.2", API_PORT: "3101" })).toBe(
      "http://127.0.0.2:3101",
    );
  });

  it("绑定全部接口时仍使用回环地址作为公开源站", () => {
    expect(resolveApiOrigin({ API_HOST: "0.0.0.0", API_PORT: "3100" })).toBe(
      "http://127.0.0.1:3100",
    );
  });

  it("显式 AUTH_BASE_URL 优先于监听地址", () => {
    expect(
      resolveApiOrigin({
        API_HOST: "127.0.0.2",
        API_PORT: "3101",
        AUTH_BASE_URL: "https://api.halo.example",
      }),
    ).toBe("https://api.halo.example");
  });

  it("容器内部 API 地址优先于公开认证地址", () => {
    expect(
      resolveApiOrigin({
        INTERNAL_API_ORIGIN: "http://api:3100",
        AUTH_BASE_URL: "https://halo.example",
      }),
    ).toBe("http://api:3100");
  });
});
