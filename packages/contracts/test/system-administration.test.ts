import { describe, expect, it } from "vitest";
import {
  CreateSystemTenantInputSchema,
  SaveSystemModelInputSchema,
  SystemModelSchema,
  SystemPageQuerySchema,
  UpdateSystemSettingsInputSchema,
} from "../src";

describe("系统管理契约", () => {
  it("校验租户创建和默认管理员邮箱", () => {
    expect(
      CreateSystemTenantInputSchema.parse({
        name: " 产品空间 ",
        slug: "Product-Space",
        defaultLocale: "zh-CN",
        timeZone: "Asia/Shanghai",
        defaultAdministratorEmail: " Owner@Example.com ",
      }),
    ).toMatchObject({
      name: "产品空间",
      slug: "product-space",
      defaultAdministratorEmail: "owner@example.com",
    });
  });

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

  it("系统设置必须同时提交语言与认证策略且续期短于有效期", () => {
    expect(UpdateSystemSettingsInputSchema.safeParse({ defaultLocale: "zh-CN" }).success).toBe(
      false,
    );
    expect(
      UpdateSystemSettingsInputSchema.parse({
        defaultLocale: "en-US",
        authentication: {
          sessionExpiresInSeconds: 604_800,
          sessionUpdateAgeSeconds: 86_400,
          slidingRenewal: true,
        },
      }).defaultLocale,
    ).toBe("en-US");
    expect(
      UpdateSystemSettingsInputSchema.safeParse({
        defaultLocale: "zh-CN",
        authentication: {
          sessionExpiresInSeconds: 86_400,
          sessionUpdateAgeSeconds: 86_400,
          slidingRenewal: true,
        },
      }).success,
    ).toBe(false);
  });
});
