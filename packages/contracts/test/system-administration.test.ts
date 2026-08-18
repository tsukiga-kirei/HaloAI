import { describe, expect, it } from "vitest";
import { SaveSystemModelInputSchema, SystemModelSchema, SystemPageQuerySchema } from "../src";

describe("系统管理契约", () => {
  it("限制服务端分页范围", () => {
    expect(SystemPageQuerySchema.parse({}).pageSize).toBe(10);
    expect(SystemPageQuerySchema.safeParse({ page: 0, pageSize: 10 }).success).toBe(false);
    expect(SystemPageQuerySchema.safeParse({ page: 1, pageSize: 101 }).success).toBe(false);
  });

  it("支持四种模型协议并把空基础地址归一化", () => {
    const input = SaveSystemModelInputSchema.parse({
      name: "Halo primary",
      provider: "OpenAI",
      apiFormat: "openai_responses",
      remoteModelId: "gpt-primary",
      baseUrl: "",
      contextWindow: null,
      status: "active",
    });

    expect(input.baseUrl).toBeNull();
  });

  it("模型响应不接受任何密钥提示或密文材料", () => {
    const publicModel = {
      id: "0198f595-b467-7ff0-b3d8-3d9ed962ba60",
      name: "Halo primary",
      provider: "OpenAI",
      apiFormat: "openai_responses",
      remoteModelId: "gpt-primary",
      baseUrl: null,
      contextWindow: null,
      status: "active",
      secretConfigured: true,
      allocations: [],
      createdAt: "2026-08-18T00:00:00.000Z",
      updatedAt: "2026-08-18T00:00:00.000Z",
    };

    expect(SystemModelSchema.safeParse(publicModel).success).toBe(true);
    expect(SystemModelSchema.safeParse({ ...publicModel, secretHint: "cret" }).success).toBe(false);
  });
});
