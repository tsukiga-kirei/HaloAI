import { z } from "zod";

const UuidSchema = z.uuid();
const OptionalTextSchema = z.string().trim().max(2_000).default("");

export const ProjectRoleSchema = z.enum(["lead", "contributor", "reviewer", "observer"]);
export const ProjectStatusSchema = z.enum(["active", "completed", "archived"]);
export const RoomLifecycleStatusSchema = z.enum(["active", "waiting", "completed", "archived"]);
export const RoomVisibilitySchema = z.enum(["workspace", "private"]);
export const DocumentLifecycleStatusSchema = z.enum(["active", "archived"]);

export const CreateProjectInputSchema = z
  .object({
    name: z.string().trim().min(1).max(200),
    description: OptionalTextSchema,
    goal: OptionalTextSchema,
    expectedArtifact: OptionalTextSchema,
    completionCriteria: OptionalTextSchema,
  })
  .strict();

export const ProjectSummarySchema = z
  .object({
    id: UuidSchema,
    workspaceId: UuidSchema,
    name: z.string().min(1).max(200),
    description: z.string(),
    goal: z.string(),
    expectedArtifact: z.string(),
    completionCriteria: z.string(),
    status: ProjectStatusSchema,
    currentActorRole: ProjectRoleSchema.nullable(),
    createdAt: z.iso.datetime({ offset: true }),
    updatedAt: z.iso.datetime({ offset: true }),
  })
  .strict();

export const AddProjectMemberInputSchema = z
  .object({ actorId: UuidSchema, role: ProjectRoleSchema.default("contributor") })
  .strict();

export const ProjectMemberSchema = z
  .object({
    id: UuidSchema,
    actorId: UuidSchema,
    displayName: z.string().min(1).max(120),
    role: ProjectRoleSchema,
    status: z.enum(["active", "suspended", "left"]),
    joinedAt: z.iso.datetime({ offset: true }),
  })
  .strict();

export const CreateRoomInputSchema = z
  .object({
    name: z.string().trim().min(1).max(200),
    goal: OptionalTextSchema,
    expectedArtifact: OptionalTextSchema,
    completionCriteria: OptionalTextSchema,
    visibility: RoomVisibilitySchema.default("private"),
  })
  .strict();

export const RoomSummarySchema = z
  .object({
    id: UuidSchema,
    workspaceId: UuidSchema,
    projectId: UuidSchema,
    name: z.string().min(1).max(200),
    goal: z.string(),
    expectedArtifact: z.string(),
    completionCriteria: z.string(),
    visibility: RoomVisibilitySchema,
    status: RoomLifecycleStatusSchema,
    collaborationMode: z.enum(["mention", "facilitated", "workflow", "roundtable"]),
    participantCount: z.number().int().nonnegative(),
    createdAt: z.iso.datetime({ offset: true }),
    updatedAt: z.iso.datetime({ offset: true }),
  })
  .strict();

export const AddRoomMemberInputSchema = z.object({ actorId: UuidSchema }).strict();

export const CreateDocumentInputSchema = z
  .object({
    title: z.string().trim().min(1).max(300),
    roomId: UuidSchema.optional(),
  })
  .strict();

export const UpdateDocumentInputSchema = z
  .object({
    title: z.string().trim().min(1).max(300).optional(),
    status: DocumentLifecycleStatusSchema.optional(),
  })
  .strict()
  .refine((input) => input.title !== undefined || input.status !== undefined, {
    message: "at least one document field is required",
  });

export const DocumentSummarySchema = z
  .object({
    id: UuidSchema,
    workspaceId: UuidSchema,
    projectId: UuidSchema,
    roomId: UuidSchema.nullable(),
    ownerActorId: UuidSchema,
    ownerDisplayName: z.string().min(1).max(120),
    title: z.string().min(1).max(300),
    status: DocumentLifecycleStatusSchema,
    createdAt: z.iso.datetime({ offset: true }),
    updatedAt: z.iso.datetime({ offset: true }),
  })
  .strict();

export const CollaborationActorSchema = z
  .object({
    id: UuidSchema,
    workspaceId: UuidSchema,
    kind: z.enum(["human", "agent", "system"]),
    displayName: z.string().min(1).max(120),
    handle: z.string().min(1).max(128),
    status: z.enum(["active", "suspended", "archived"]),
  })
  .strict();

export const StoredMessagePartSchema = z
  .object({
    type: z.literal("text"),
    data: z.object({ text: z.string().min(1).max(65_536) }).passthrough(),
  })
  .passthrough();

export const RoomMessageSummarySchema = z
  .object({
    id: UuidSchema,
    workspaceId: UuidSchema,
    roomId: UuidSchema,
    authorActorId: UuidSchema,
    sequence: z.number().int().positive(),
    parts: z.array(StoredMessagePartSchema).min(1).max(50),
    createdAt: z.iso.datetime({ offset: true }),
  })
  .strict();

export const AppendRoomMessageInputSchema = z
  .object({
    content: z.string().trim().min(1).max(65_536),
    clientMutationId: UuidSchema,
  })
  .strict();

export const WorkspaceCollaborationSnapshotSchema = z
  .object({
    projects: z.array(ProjectSummarySchema).max(500),
    rooms: z.array(RoomSummarySchema).max(2_000),
    documents: z.array(DocumentSummarySchema).max(5_000),
    participants: z.array(CollaborationActorSchema).max(256),
    messages: z.array(RoomMessageSummarySchema).max(5_000),
  })
  .strict();

export const ProjectCreatedResponseSchema = z.object({ project: ProjectSummarySchema }).strict();
export const RoomCreatedResponseSchema = z.object({ room: RoomSummarySchema }).strict();
export const DocumentCreatedResponseSchema = z.object({ document: DocumentSummarySchema }).strict();
export const RoomMessageCreatedResponseSchema = z
  .object({ message: RoomMessageSummarySchema })
  .strict();

export type ProjectRole = z.infer<typeof ProjectRoleSchema>;
export type ProjectSummary = z.infer<typeof ProjectSummarySchema>;
export type ProjectMember = z.infer<typeof ProjectMemberSchema>;
export type CreateProjectInput = z.infer<typeof CreateProjectInputSchema>;
export type AddProjectMemberInput = z.infer<typeof AddProjectMemberInputSchema>;
export type RoomSummary = z.infer<typeof RoomSummarySchema>;
export type CreateRoomInput = z.infer<typeof CreateRoomInputSchema>;
export type AddRoomMemberInput = z.infer<typeof AddRoomMemberInputSchema>;
export type DocumentSummary = z.infer<typeof DocumentSummarySchema>;
export type CreateDocumentInput = z.infer<typeof CreateDocumentInputSchema>;
export type UpdateDocumentInput = z.infer<typeof UpdateDocumentInputSchema>;
export type WorkspaceCollaborationSnapshot = z.infer<typeof WorkspaceCollaborationSnapshotSchema>;
export type CollaborationActor = z.infer<typeof CollaborationActorSchema>;
export type RoomMessageSummary = z.infer<typeof RoomMessageSummarySchema>;
export type AppendRoomMessageInput = z.infer<typeof AppendRoomMessageInputSchema>;
