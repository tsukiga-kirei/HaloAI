import { z } from "zod";

/**
 * 外部边界上的 ID 只承诺是不可解释的不透明值，不承诺 UUID、ULID 或数据库实现。
 * 品牌类型用于阻止 TypeScript 内把 ActorId 误传成 RoomId；运行时仍限制字符和长度，
 * 避免空值、空白、控制字符以及可被用于日志或路径注入的任意文本进入领域层。
 */
function createOpaqueIdSchema<const Brand extends string>() {
  return z
    .string()
    .min(8)
    .max(128)
    .regex(/^[A-Za-z0-9](?:[A-Za-z0-9_-]*[A-Za-z0-9])?$/)
    .brand<Brand>();
}

export const ActorIdSchema = createOpaqueIdSchema<"ActorId">();
export const WorkspaceIdSchema = createOpaqueIdSchema<"WorkspaceId">();
export const RoomIdSchema = createOpaqueIdSchema<"RoomId">();
export const MessageIdSchema = createOpaqueIdSchema<"MessageId">();
export const MentionIdSchema = createOpaqueIdSchema<"MentionId">();
export const AgentRunIdSchema = createOpaqueIdSchema<"AgentRunId">();
export const AgentProfileVersionIdSchema =
  createOpaqueIdSchema<"AgentProfileVersionId">();
export const AuthorizationSnapshotIdSchema =
  createOpaqueIdSchema<"AuthorizationSnapshotId">();
export const EventIdSchema = createOpaqueIdSchema<"EventId">();
export const StreamIdSchema = createOpaqueIdSchema<"StreamId">();
export const DocumentIdSchema = createOpaqueIdSchema<"DocumentId">();
export const DocumentVersionIdSchema =
  createOpaqueIdSchema<"DocumentVersionId">();
export const DocumentNodeIdSchema = createOpaqueIdSchema<"DocumentNodeId">();
export const DocumentProposalIdSchema =
  createOpaqueIdSchema<"DocumentProposalId">();
export const ProposalOperationIdSchema =
  createOpaqueIdSchema<"ProposalOperationId">();
export const ApprovalIdSchema = createOpaqueIdSchema<"ApprovalId">();
export const AttachmentIdSchema = createOpaqueIdSchema<"AttachmentId">();
export const SourceIdSchema = createOpaqueIdSchema<"SourceId">();
export const ToolIdSchema = createOpaqueIdSchema<"ToolId">();
export const RequestIdSchema = createOpaqueIdSchema<"RequestId">();
export const ClientMutationIdSchema = createOpaqueIdSchema<"ClientMutationId">();

export type ActorId = z.infer<typeof ActorIdSchema>;
export type WorkspaceId = z.infer<typeof WorkspaceIdSchema>;
export type RoomId = z.infer<typeof RoomIdSchema>;
export type MessageId = z.infer<typeof MessageIdSchema>;
export type MentionId = z.infer<typeof MentionIdSchema>;
export type AgentRunId = z.infer<typeof AgentRunIdSchema>;
export type AgentProfileVersionId = z.infer<
  typeof AgentProfileVersionIdSchema
>;
export type AuthorizationSnapshotId = z.infer<
  typeof AuthorizationSnapshotIdSchema
>;
export type EventId = z.infer<typeof EventIdSchema>;
export type StreamId = z.infer<typeof StreamIdSchema>;
export type DocumentId = z.infer<typeof DocumentIdSchema>;
export type DocumentVersionId = z.infer<typeof DocumentVersionIdSchema>;
export type DocumentNodeId = z.infer<typeof DocumentNodeIdSchema>;
export type DocumentProposalId = z.infer<typeof DocumentProposalIdSchema>;
export type ProposalOperationId = z.infer<typeof ProposalOperationIdSchema>;
export type ApprovalId = z.infer<typeof ApprovalIdSchema>;
export type AttachmentId = z.infer<typeof AttachmentIdSchema>;
export type SourceId = z.infer<typeof SourceIdSchema>;
export type ToolId = z.infer<typeof ToolIdSchema>;
export type RequestId = z.infer<typeof RequestIdSchema>;
export type ClientMutationId = z.infer<typeof ClientMutationIdSchema>;

/**
 * 所有跨边界时间都必须带时区偏移，防止浏览器、Worker 和数据库按本地时区产生不同顺序。
 * 领域层可以统一转成 UTC，但协议层保留合法 ISO 8601 offset 表达。
 */
export const ISODateTimeSchema = z.iso.datetime({ offset: true }).brand<"ISODateTime">();
export type ISODateTime = z.infer<typeof ISODateTimeSchema>;

export const LocaleSchema = z.enum(["zh-CN", "en-US"]);
export type Locale = z.infer<typeof LocaleSchema>;

export const SequenceSchema = z
  .number()
  .int()
  .nonnegative()
  .max(Number.MAX_SAFE_INTEGER);
export type Sequence = z.infer<typeof SequenceSchema>;

export const PositiveSequenceSchema = z
  .number()
  .int()
  .positive()
  .max(Number.MAX_SAFE_INTEGER);
export type PositiveSequence = z.infer<typeof PositiveSequenceSchema>;

export const Sha256DigestSchema = z
  .string()
  .regex(/^[a-f0-9]{64}$/)
  .brand<"Sha256Digest">();
export type Sha256Digest = z.infer<typeof Sha256DigestSchema>;

export const HandleSchema = z
  .string()
  .min(2)
  .max(48)
  .regex(/^[a-z0-9](?:[a-z0-9._-]*[a-z0-9])?$/);

export const DisplayNameSchema = z
  .string()
  .min(1)
  .max(120)
  .refine((value) => value.trim() === value && value.trim().length > 0, {
    message: "display name must not contain surrounding whitespace",
  });

/**
 * URL 协议必须显式受限。仅使用通用 url() 会允许部分调用方无法安全渲染的协议，
 * 因此头像等展示资源只允许 HTTP(S)，真正的文件访问仍需服务端授权。通过此 schema
 * 不代表 URL 可以由服务端直接抓取；图片代理或预览服务仍须阻止内网地址、重定向绕过与超大响应。
 */
export const HttpUrlSchema = z
  .string()
  .url()
  .max(2048)
  .refine((value) => {
    const protocol = new URL(value).protocol;
    return protocol === "https:" || protocol === "http:";
  }, "only http and https URLs are allowed");

export const JsonScalarSchema = z.union([
  z.string().max(1024),
  z.number().finite(),
  z.boolean(),
  z.null(),
]);
export type JsonScalar = z.infer<typeof JsonScalarSchema>;

/**
 * 这里接受的是传输编码而不是可信 Yjs 状态；解码后的大小与结构仍必须在服务端检查。
 * 长度上限只防止明显滥用，不能替代协作服务的二进制配额。
 */
export const Base64StateVectorSchema = z
  .string()
  .max(349_528)
  .regex(/^(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$/)
  .brand<"Base64StateVector">();
export type Base64StateVector = z.infer<typeof Base64StateVectorSchema>;

export function isAfter(left: ISODateTime, right: ISODateTime): boolean {
  return Date.parse(left) > Date.parse(right);
}

export function isAtOrAfter(left: ISODateTime, right: ISODateTime): boolean {
  return Date.parse(left) >= Date.parse(right);
}
