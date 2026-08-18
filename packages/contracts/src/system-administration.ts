import { z } from "zod";
import { LocaleSchema } from "./primitives";

const UuidSchema = z.uuid();

export const SystemPageQuerySchema = z
  .object({
    page: z.coerce.number().int().min(1).default(1),
    pageSize: z.coerce.number().int().min(1).max(100).default(10),
    query: z.string().trim().max(120).optional(),
  })
  .strict();

export const SystemAccessResponseSchema = z.object({ allowed: z.literal(true) }).strict();

export const SystemOverviewSchema = z
  .object({
    tenantTotal: z.number().int().min(0),
    activeTenantTotal: z.number().int().min(0),
    modelTotal: z.number().int().min(0),
    activeModelTotal: z.number().int().min(0),
  })
  .strict();

export const SystemTenantSchema = z
  .object({
    id: UuidSchema,
    slug: z.string().min(1).max(128),
    name: z.string().min(1).max(200),
    status: z.enum(["active", "suspended", "archived"]),
    defaultLocale: LocaleSchema,
    timeZone: z.string().min(1).max(64),
    memberCount: z.number().int().min(0),
    createdAt: z.iso.datetime({ offset: true }),
  })
  .strict();

export const SystemTenantPageSchema = z
  .object({
    items: z.array(SystemTenantSchema),
    page: z.number().int().min(1),
    pageSize: z.number().int().min(1).max(100),
    total: z.number().int().min(0),
  })
  .strict();

export const UpdateSystemTenantInputSchema = z
  .object({
    status: z.enum(["active", "suspended", "archived"]),
    defaultLocale: LocaleSchema,
    timeZone: z.string().trim().min(1).max(64),
  })
  .strict();

export const PlatformModelApiFormatSchema = z.enum([
  "openai_chat_completions",
  "openai_responses",
  "anthropic_messages",
  "google_generate_content",
]);

export const SystemModelAllocationSchema = z
  .object({
    id: UuidSchema,
    workspaceId: UuidSchema,
    workspaceName: z.string().min(1).max(200),
    status: z.enum(["active", "revoked"]),
  })
  .strict();

export const SystemModelSchema = z
  .object({
    id: UuidSchema,
    name: z.string().min(1).max(120),
    provider: z.string().min(1).max(120),
    apiFormat: PlatformModelApiFormatSchema,
    remoteModelId: z.string().min(1).max(200),
    baseUrl: z.url().nullable(),
    contextWindow: z.number().int().positive().nullable(),
    status: z.enum(["active", "disabled"]),
    secretConfigured: z.boolean(),
    allocations: z.array(SystemModelAllocationSchema),
    createdAt: z.iso.datetime({ offset: true }),
    updatedAt: z.iso.datetime({ offset: true }),
  })
  .strict();

export const SystemModelPageSchema = z
  .object({
    items: z.array(SystemModelSchema),
    page: z.number().int().min(1),
    pageSize: z.number().int().min(1).max(100),
    total: z.number().int().min(0),
  })
  .strict();

export const SaveSystemModelInputSchema = z
  .object({
    name: z.string().trim().min(2).max(120),
    provider: z.string().trim().min(2).max(120),
    apiFormat: PlatformModelApiFormatSchema,
    remoteModelId: z.string().trim().min(1).max(200),
    baseUrl: z.union([z.url(), z.literal("")]).transform((value) => value || null),
    contextWindow: z.number().int().positive().max(10_000_000).nullable(),
    status: z.enum(["active", "disabled"]),
    apiKey: z.string().trim().min(8).max(4096).optional(),
  })
  .strict();

export const SetSystemModelAllocationInputSchema = z
  .object({ workspaceId: UuidSchema, enabled: z.boolean() })
  .strict();

export const SystemSettingsSchema = z
  .object({
    defaultLocale: LocaleSchema,
    authentication: z
      .object({
        mode: z.literal("database_session"),
        sessionExpiresInSeconds: z.number().int().positive(),
        sessionUpdateAgeSeconds: z.number().int().positive(),
        slidingRenewal: z.boolean(),
      })
      .strict(),
  })
  .strict();

export const UpdateSystemSettingsInputSchema = z.object({ defaultLocale: LocaleSchema }).strict();

export type SystemPageQuery = z.infer<typeof SystemPageQuerySchema>;
export type SystemOverview = z.infer<typeof SystemOverviewSchema>;
export type SystemTenant = z.infer<typeof SystemTenantSchema>;
export type SystemTenantPage = z.infer<typeof SystemTenantPageSchema>;
export type UpdateSystemTenantInput = z.infer<typeof UpdateSystemTenantInputSchema>;
export type PlatformModelApiFormat = z.infer<typeof PlatformModelApiFormatSchema>;
export type SystemModel = z.infer<typeof SystemModelSchema>;
export type SystemModelPage = z.infer<typeof SystemModelPageSchema>;
export type SaveSystemModelInput = z.infer<typeof SaveSystemModelInputSchema>;
export type SystemSettings = z.infer<typeof SystemSettingsSchema>;
