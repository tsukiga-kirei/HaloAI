import { z } from "zod";
import { WorkspaceMemberSchema } from "./authentication";

const UuidSchema = z.uuid();

export const WorkspaceDepartmentSchema = z
  .object({
    id: UuidSchema,
    parentId: UuidSchema.nullable(),
    name: z.string().min(1).max(200),
    code: z.string().min(1).max(64),
    description: z.string().max(500),
    managerActorId: UuidSchema.nullable(),
    managerName: z.string().min(1).max(120).nullable(),
    status: z.enum(["active", "disabled"]),
    sortOrder: z.number().int(),
    memberCount: z.number().int().min(0),
  })
  .strict();

export const WorkspaceOrganizationOverviewSchema = z
  .object({
    workspace: z
      .object({ id: UuidSchema, name: z.string().min(1), slug: z.string().min(1) })
      .strict(),
    departments: z.array(WorkspaceDepartmentSchema),
    members: z.array(WorkspaceMemberSchema),
  })
  .strict();

export const SaveWorkspaceDepartmentInputSchema = z
  .object({
    name: z.string().trim().min(1).max(200),
    code: z
      .string()
      .trim()
      .toLowerCase()
      .min(1)
      .max(64)
      .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
    description: z.string().trim().max(500).default(""),
    parentId: UuidSchema.nullable().default(null),
    managerActorId: UuidSchema.nullable().default(null),
    status: z.enum(["active", "disabled"]).default("active"),
    sortOrder: z.number().int().min(-10_000).max(10_000).default(0),
  })
  .strict();

export const UpdateWorkspaceMemberOrganizationInputSchema = z
  .object({
    departmentId: UuidSchema.nullable(),
    jobTitle: z.string().trim().max(120),
  })
  .strict();

export type WorkspaceDepartment = z.infer<typeof WorkspaceDepartmentSchema>;
export type WorkspaceOrganizationOverview = z.infer<typeof WorkspaceOrganizationOverviewSchema>;
export type SaveWorkspaceDepartmentInput = z.infer<typeof SaveWorkspaceDepartmentInputSchema>;
export type UpdateWorkspaceMemberOrganizationInput = z.infer<
  typeof UpdateWorkspaceMemberOrganizationInputSchema
>;
