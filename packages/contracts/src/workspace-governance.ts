import { z } from "zod";
import { LocaleSchema } from "./primitives";
import { PlatformModelApiFormatSchema } from "./system-administration";
import { WorkspaceRoleSchema } from "./authentication";

const UuidSchema = z.uuid();

export const WorkspaceAdminSectionSchema = z.enum([
  "overview",
  "members",
  "agents",
  "integrations",
  "security",
  "audit",
]);

export const WorkspaceAdminAccessQuerySchema = z
  .object({
    section: WorkspaceAdminSectionSchema,
  })
  .strict();

export const WorkspaceAdminAccessResponseSchema = z
  .object({
    allowed: z.literal(true),
    role: WorkspaceRoleSchema,
    workspaceName: z.string().min(1).max(200),
  })
  .strict();

export const AuditOutcomeSchema = z.enum(["succeeded", "failed", "denied", "cancelled"]);
export const PolicyDecisionSchema = z.enum(["allow", "deny", "require_approval", "not_applicable"]);

export const WorkspaceAuditQuerySchema = z
  .object({
    page: z.coerce.number().int().min(1).default(1),
    pageSize: z.coerce.number().int().min(1).max(100).default(20),
    query: z.string().trim().max(120).optional(),
    outcome: AuditOutcomeSchema.optional(),
  })
  .strict();

export const WorkspaceAuditEventSchema = z
  .object({
    id: UuidSchema,
    action: z.string().min(1).max(160),
    resourceType: z.string().min(1).max(96),
    resourceId: z.string().min(1).max(200),
    decision: PolicyDecisionSchema,
    outcome: AuditOutcomeSchema,
    reasonCode: z.string().min(1).max(120).nullable(),
    actorId: UuidSchema.nullable(),
    actorName: z.string().min(1).max(120).nullable(),
    actorHandle: z.string().min(1).max(128).nullable(),
    occurredAt: z.iso.datetime({ offset: true }),
    metadata: z
      .record(z.string(), z.union([z.string(), z.number(), z.boolean(), z.null()]))
      .refine((value) => Object.keys(value).length <= 32),
  })
  .strict();

export const WorkspaceAuditPageSchema = z
  .object({
    items: z.array(WorkspaceAuditEventSchema),
    page: z.number().int().min(1),
    pageSize: z.number().int().min(1).max(100),
    total: z.number().int().min(0),
  })
  .strict();

export const WorkspaceAllocatedModelSchema = z
  .object({
    id: UuidSchema,
    name: z.string().min(1).max(120),
    provider: z.string().min(1).max(120),
    apiFormat: PlatformModelApiFormatSchema,
    remoteModelId: z.string().min(1).max(200),
    contextWindow: z.number().int().positive().nullable(),
    status: z.enum(["active", "disabled"]),
    secretConfigured: z.boolean(),
    allocatedAt: z.iso.datetime({ offset: true }),
  })
  .strict();

export const WorkspaceAllocatedModelListSchema = z
  .object({
    items: z.array(WorkspaceAllocatedModelSchema).max(200),
  })
  .strict();

export const WorkspaceSecuritySnapshotSchema = z
  .object({
    session: z
      .object({
        cookieProtected: z.literal(true),
        expiresInSeconds: z.number().int().min(3_600).max(31_536_000),
        updateAgeSeconds: z.number().int().min(0).max(2_592_000),
        slidingRenewal: z.boolean(),
      })
      .strict(),
    defaultLocale: LocaleSchema,
    highRiskApprovalRequired: z.literal(true),
    rowLevelIsolation: z.literal(true),
    systemBreakGlassRequired: z.literal(true),
  })
  .strict();

export const UpdateWorkspaceMemberStatusInputSchema = z
  .object({
    status: z.enum(["active", "suspended"]),
  })
  .strict();

export const UpdateSessionProfileInputSchema = z
  .object({
    name: z.string().trim().min(1).max(120),
  })
  .strict();

export type WorkspaceAdminSection = z.infer<typeof WorkspaceAdminSectionSchema>;
export type WorkspaceAdminAccessResponse = z.infer<typeof WorkspaceAdminAccessResponseSchema>;
export type AuditOutcome = z.infer<typeof AuditOutcomeSchema>;
export type WorkspaceAuditQuery = z.infer<typeof WorkspaceAuditQuerySchema>;
export type WorkspaceAuditEvent = z.infer<typeof WorkspaceAuditEventSchema>;
export type WorkspaceAuditPage = z.infer<typeof WorkspaceAuditPageSchema>;
export type WorkspaceAllocatedModel = z.infer<typeof WorkspaceAllocatedModelSchema>;
export type WorkspaceAllocatedModelList = z.infer<typeof WorkspaceAllocatedModelListSchema>;
export type WorkspaceSecuritySnapshot = z.infer<typeof WorkspaceSecuritySnapshotSchema>;
export type UpdateWorkspaceMemberStatusInput = z.infer<
  typeof UpdateWorkspaceMemberStatusInputSchema
>;
export type UpdateSessionProfileInput = z.infer<typeof UpdateSessionProfileInputSchema>;
