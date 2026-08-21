import { z } from "zod";
import { LocaleSchema } from "./primitives";

const UuidSchema = z.uuid();

export const WorkspaceRoleSchema = z.enum(["owner", "admin", "member", "guest"]);
export const AssignableWorkspaceRoleSchema = z.enum(["admin", "member", "guest"]);

export const AuthenticatedUserSchema = z
  .object({
    id: UuidSchema,
    name: z.string().trim().min(1).max(120),
    email: z.email().max(320),
    image: z.url().max(2048).nullable().optional(),
    locale: LocaleSchema.default("zh-CN"),
    timeZone: z.string().max(64).default("Asia/Shanghai"),
  })
  .strict();

export const WorkspaceSummarySchema = z
  .object({
    id: UuidSchema,
    slug: z.string().min(2).max(63),
    name: z.string().min(2).max(80),
    actorId: UuidSchema,
    membershipId: UuidSchema,
    role: WorkspaceRoleSchema,
  })
  .strict();

export const SessionContextSchema = z
  .object({
    user: AuthenticatedUserSchema,
    workspaces: z.array(WorkspaceSummarySchema).max(200),
  })
  .strict();

export const CreateWorkspaceInputSchema = z
  .object({
    name: z.string().trim().min(2).max(80),
    slug: z
      .string()
      .trim()
      .toLowerCase()
      .min(2)
      .max(63)
      .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
    locale: LocaleSchema.default("zh-CN"),
    timeZone: z.string().trim().min(1).max(64).default("Asia/Shanghai"),
  })
  .strict();

export const CreateWorkspaceInvitationInputSchema = z
  .object({
    email: z.string().trim().toLowerCase().max(320).pipe(z.email()),
    role: AssignableWorkspaceRoleSchema.default("member"),
    departmentId: UuidSchema.nullable().optional(),
    jobTitle: z.string().trim().max(120).default(""),
  })
  .strict();

export const AcceptWorkspaceInvitationInputSchema = z
  .object({
    token: z
      .string()
      .min(32)
      .max(256)
      .regex(/^[A-Za-z0-9_-]+$/),
  })
  .strict();

export const UpdateWorkspaceMemberRoleInputSchema = z
  .object({ role: WorkspaceRoleSchema })
  .strict();

export const WorkspaceMemberSchema = z
  .object({
    membershipId: UuidSchema,
    actorId: UuidSchema,
    name: z.string().min(1).max(120),
    email: z.email().max(320),
    role: WorkspaceRoleSchema,
    departmentId: UuidSchema.nullable(),
    departmentName: z.string().min(1).max(200).nullable(),
    jobTitle: z.string().max(120),
    status: z.enum(["invited", "active", "suspended", "left"]),
    joinedAt: z.iso.datetime({ offset: true }).nullable(),
  })
  .strict();

export const WorkspaceInvitationCreatedSchema = z
  .object({
    id: UuidSchema,
    workspaceId: UuidSchema,
    email: z.email().max(320),
    role: AssignableWorkspaceRoleSchema,
    departmentId: UuidSchema.nullable(),
    jobTitle: z.string().max(120),
    expiresAt: z.iso.datetime({ offset: true }),
    /** 仅本地开发可返回，生产环境必须通过受控邮件通道投递。 */
    token: z.string().optional(),
  })
  .strict();

export type WorkspaceRole = z.infer<typeof WorkspaceRoleSchema>;
export type AuthenticatedUser = z.infer<typeof AuthenticatedUserSchema>;
export type WorkspaceSummary = z.infer<typeof WorkspaceSummarySchema>;
export type SessionContext = z.infer<typeof SessionContextSchema>;
export type CreateWorkspaceInput = z.infer<typeof CreateWorkspaceInputSchema>;
export type CreateWorkspaceInvitationInput = z.infer<typeof CreateWorkspaceInvitationInputSchema>;
export type AcceptWorkspaceInvitationInput = z.infer<typeof AcceptWorkspaceInvitationInputSchema>;
export type UpdateWorkspaceMemberRoleInput = z.infer<typeof UpdateWorkspaceMemberRoleInputSchema>;
export type WorkspaceMember = z.infer<typeof WorkspaceMemberSchema>;
export type WorkspaceInvitationCreated = z.infer<typeof WorkspaceInvitationCreatedSchema>;
