import { z } from "zod";
import {
  ActorIdSchema,
  AgentRunIdSchema,
  ApprovalIdSchema,
  AttachmentIdSchema,
  ClientMutationIdSchema,
  DisplayNameSchema,
  DocumentIdSchema,
  HandleSchema,
  HttpUrlSchema,
  ISODateTimeSchema,
  LocaleSchema,
  MentionIdSchema,
  MessageIdSchema,
  ProjectIdSchema,
  RoomIdSchema,
  SequenceSchema,
  SourceIdSchema,
  ToolIdSchema,
  WorkspaceIdSchema,
  isAtOrAfter,
} from "./primitives";

export const ActorKindSchema = z.enum(["human", "agent", "system"]);
export const ActorStatusSchema = z.enum(["active", "suspended", "archived"]);

/**
 * Actor 只表达可追责的参与主体，不承载人员邀请状态、访问角色或 Agent 人设生命周期。
 * 这些状态属于 Membership、AccessRole 与 AgentProfile；若混入 Actor，调用方很容易把
 * “身份存在”误读成“当前具有访问权”。实际授权仍必须由服务端结合成员关系与资源策略判断。
 */
export const ActorSchema = z
  .object({
    id: ActorIdSchema,
    workspaceId: WorkspaceIdSchema,
    kind: ActorKindSchema,
    displayName: DisplayNameSchema,
    handle: HandleSchema,
    avatarUrl: HttpUrlSchema.optional(),
    status: ActorStatusSchema,
    createdAt: ISODateTimeSchema,
  })
  .strict();

export type ActorKind = z.infer<typeof ActorKindSchema>;
export type ActorStatus = z.infer<typeof ActorStatusSchema>;
export type Actor = z.infer<typeof ActorSchema>;

export const WorkspaceSchema = z
  .object({
    id: WorkspaceIdSchema,
    name: DisplayNameSchema,
    slug: z
      .string()
      .min(2)
      .max(63)
      .regex(/^[a-z0-9](?:[a-z0-9-]*[a-z0-9])?$/),
    defaultLocale: LocaleSchema,
    createdByActorId: ActorIdSchema,
    createdAt: ISODateTimeSchema,
    archivedAt: ISODateTimeSchema.optional(),
  })
  .strict()
  .superRefine((workspace, context) => {
    if (
      workspace.archivedAt !== undefined &&
      !isAtOrAfter(workspace.archivedAt, workspace.createdAt)
    ) {
      context.addIssue({
        code: "custom",
        path: ["archivedAt"],
        message: "archivedAt must not be before createdAt",
      });
    }
  });
export type Workspace = z.infer<typeof WorkspaceSchema>;

export const CollaborationModeSchema = z.enum(["mention", "facilitated", "workflow", "roundtable"]);
export const RoomStatusSchema = z.enum(["active", "waiting", "completed", "archived"]);

export const RoomSchema = z
  .object({
    id: RoomIdSchema,
    workspaceId: WorkspaceIdSchema,
    projectId: ProjectIdSchema,
    name: DisplayNameSchema,
    goal: z.string().trim().min(1).max(2_000),
    expectedArtifact: z.string().trim().max(2_000),
    completionCriteria: z.array(z.string().trim().min(1).max(500)).max(50),
    visibility: z.enum(["workspace", "private"]),
    mode: CollaborationModeSchema,
    status: RoomStatusSchema,
    participantActorIds: z.array(ActorIdSchema).min(1).max(256),
    createdByActorId: ActorIdSchema,
    createdAt: ISODateTimeSchema,
    archivedAt: ISODateTimeSchema.optional(),
  })
  .strict()
  .superRefine((room, context) => {
    const participantIds = new Set(room.participantActorIds);
    if (participantIds.size !== room.participantActorIds.length) {
      context.addIssue({
        code: "custom",
        path: ["participantActorIds"],
        message: "participant actor IDs must be unique",
      });
    }

    /**
     * 房间创建者必须成为参与者，否则创建完成后可能立即无权看到自己创建的房间，
     * 也会使责任归属与实际成员关系脱节。
     */
    if (!participantIds.has(room.createdByActorId)) {
      context.addIssue({
        code: "custom",
        path: ["createdByActorId"],
        message: "room creator must be a participant",
      });
    }

    if (room.status === "archived" && room.archivedAt === undefined) {
      context.addIssue({
        code: "custom",
        path: ["archivedAt"],
        message: "archived rooms require archivedAt",
      });
    }
    if (room.status !== "archived" && room.archivedAt !== undefined) {
      context.addIssue({
        code: "custom",
        path: ["archivedAt"],
        message: "only archived rooms can have archivedAt",
      });
    }
    if (room.archivedAt !== undefined && !isAtOrAfter(room.archivedAt, room.createdAt)) {
      context.addIssue({
        code: "custom",
        path: ["archivedAt"],
        message: "archivedAt must not be before createdAt",
      });
    }
  });

export type CollaborationMode = z.infer<typeof CollaborationModeSchema>;
export type RoomStatus = z.infer<typeof RoomStatusSchema>;
export type Room = z.infer<typeof RoomSchema>;

const TextPartSchema = z
  .object({
    type: z.literal("text"),
    text: z.string().min(1).max(65_536),
    format: z.enum(["plain", "markdown"]),
  })
  .strict();

const DocumentReferencePartSchema = z
  .object({
    type: z.literal("document_ref"),
    documentId: DocumentIdSchema,
    label: z.string().trim().min(1).max(200),
  })
  .strict();

const AttachmentReferencePartSchema = z
  .object({
    type: z.literal("attachment_ref"),
    attachmentId: AttachmentIdSchema,
    label: z.string().trim().min(1).max(255),
  })
  .strict();

const SourceCitationPartSchema = z
  .object({
    type: z.literal("source_citation"),
    sourceType: z.enum(["message", "document_version", "attachment"]),
    sourceId: SourceIdSchema,
    label: z.string().trim().min(1).max(255),
  })
  .strict();

const ToolSummaryPartSchema = z
  .object({
    type: z.literal("tool_summary"),
    toolId: ToolIdSchema,
    status: z.enum(["started", "completed", "failed", "approval_required"]),
    summaryKey: z
      .string()
      .min(3)
      .max(160)
      .regex(/^[a-z0-9]+(?:[._-][a-z0-9]+)+$/),
  })
  .strict();

const ApprovalReferencePartSchema = z
  .object({
    type: z.literal("approval_ref"),
    approvalId: ApprovalIdSchema,
  })
  .strict();

const SystemEventPartSchema = z
  .object({
    type: z.literal("system_event"),
    eventKey: z
      .string()
      .min(3)
      .max(160)
      .regex(/^[a-z0-9]+(?:[._-][a-z0-9]+)+$/),
  })
  .strict();

/**
 * 消息内容只允许已知 part。协议层不接受任意 HTML 或不受约束 JSON，
 * 防止模型输出或上传内容绕过各 part 自己的授权与安全渲染路径。
 * markdown 和所有展示标签仍是不可信文本；前端必须转义或使用经过审查的 sanitizer，
 * 不能因为 schema 已通过就使用危险的 HTML 注入方式渲染。
 */
export const MessagePartSchema = z.discriminatedUnion("type", [
  TextPartSchema,
  DocumentReferencePartSchema,
  AttachmentReferencePartSchema,
  SourceCitationPartSchema,
  ToolSummaryPartSchema,
  ApprovalReferencePartSchema,
  SystemEventPartSchema,
]);
export type MessagePart = z.infer<typeof MessagePartSchema>;

export const MessageStatusSchema = z.enum(["sent", "edited", "deleted"]);

export const MessageSchema = z
  .object({
    id: MessageIdSchema,
    workspaceId: WorkspaceIdSchema,
    roomId: RoomIdSchema,
    roomSequence: SequenceSchema,
    actorId: ActorIdSchema,
    actorType: ActorKindSchema,
    clientMutationId: ClientMutationIdSchema,
    replyToMessageId: MessageIdSchema.optional(),
    threadRootId: MessageIdSchema.optional(),
    agentRunId: AgentRunIdSchema.optional(),
    parts: z.array(MessagePartSchema).min(1).max(50),
    status: MessageStatusSchema,
    createdAt: ISODateTimeSchema,
    editedAt: ISODateTimeSchema.optional(),
    deletedAt: ISODateTimeSchema.optional(),
  })
  .strict()
  .superRefine((message, context) => {
    if (message.replyToMessageId === message.id || message.threadRootId === message.id) {
      context.addIssue({
        code: "custom",
        path: ["replyToMessageId"],
        message: "a message cannot reply to or root itself",
      });
    }

    if (message.actorType === "agent" && message.agentRunId === undefined) {
      context.addIssue({
        code: "custom",
        path: ["agentRunId"],
        message: "agent-authored messages require an agent run",
      });
    }
    if (message.actorType !== "agent" && message.agentRunId !== undefined) {
      context.addIssue({
        code: "custom",
        path: ["agentRunId"],
        message: "only agent-authored messages can reference an agent run",
      });
    }

    const hasSystemPart = message.parts.some((part) => part.type === "system_event");
    if (hasSystemPart !== (message.actorType === "system")) {
      context.addIssue({
        code: "custom",
        path: ["parts"],
        message: "system event parts and system actors must match",
      });
    }

    if (message.status === "deleted" && message.deletedAt === undefined) {
      context.addIssue({
        code: "custom",
        path: ["deletedAt"],
        message: "deleted messages require deletedAt",
      });
    }
    if (message.status !== "deleted" && message.deletedAt !== undefined) {
      context.addIssue({
        code: "custom",
        path: ["deletedAt"],
        message: "only deleted messages can have deletedAt",
      });
    }
    if (message.status === "edited" && message.editedAt === undefined) {
      context.addIssue({
        code: "custom",
        path: ["editedAt"],
        message: "edited messages require editedAt",
      });
    }
    if (message.status === "sent" && message.editedAt !== undefined) {
      context.addIssue({
        code: "custom",
        path: ["editedAt"],
        message: "sent messages cannot have editedAt",
      });
    }
    if (message.editedAt !== undefined && !isAtOrAfter(message.editedAt, message.createdAt)) {
      context.addIssue({
        code: "custom",
        path: ["editedAt"],
        message: "editedAt must not be before createdAt",
      });
    }
    if (message.deletedAt !== undefined && !isAtOrAfter(message.deletedAt, message.createdAt)) {
      context.addIssue({
        code: "custom",
        path: ["deletedAt"],
        message: "deletedAt must not be before createdAt",
      });
    }
  });

export type MessageStatus = z.infer<typeof MessageStatusSchema>;
export type Message = z.infer<typeof MessageSchema>;

export const MentionSchema = z
  .object({
    id: MentionIdSchema,
    workspaceId: WorkspaceIdSchema,
    roomId: RoomIdSchema,
    messageId: MessageIdSchema,
    targetActorId: ActorIdSchema,
    targetActorKind: ActorKindSchema,
    intent: z.enum(["notify", "invoke"]),
    createdAt: ISODateTimeSchema,
  })
  .strict()
  .superRefine((mention, context) => {
    /**
     * invoke 是会产生模型调用、费用和权限委托的明确协议意图，
     * 因此只能指向 AI；人类 Mention 只产生 notify，不能被客户端伪造成可执行主体。
     */
    if (mention.intent === "invoke" && mention.targetActorKind !== "agent") {
      context.addIssue({
        code: "custom",
        path: ["intent"],
        message: "only agent mentions can invoke",
      });
    }
  });

export type Mention = z.infer<typeof MentionSchema>;
