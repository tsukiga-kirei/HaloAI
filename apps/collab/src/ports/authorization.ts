import {
  ActorIdSchema,
  DocumentIdSchema,
  ISODateTimeSchema,
  WorkspaceIdSchema,
} from "@haloai/contracts";
import { z } from "zod";
import type { CollaborationDocumentIdentity } from "../document-name";

export const DocumentAccessSchema = z.enum(["read", "write"]);

/**
 * 浏览器协作 ticket 只代表已认证人员。AI 和 system 对文档的修改必须走服务端受控事务，
 * 以便附带 Agent 版本、委托人、runId 与提案来源，而不能模拟一条人类 WebSocket 会话。
 */
export const DocumentAuthorizationGrantSchema = z
  .object({
    ticketId: z
      .string()
      .min(16)
      .max(128)
      .regex(/^[A-Za-z0-9](?:[A-Za-z0-9_-]*[A-Za-z0-9])?$/),
    audience: z.literal("collaboration"),
    purpose: z.literal("document_sync"),
    actorId: ActorIdSchema,
    actorKind: z.literal("human"),
    workspaceId: WorkspaceIdSchema,
    documentId: DocumentIdSchema,
    access: DocumentAccessSchema,
    authorizationVersion: z.number().int().nonnegative().max(Number.MAX_SAFE_INTEGER),
    expiresAt: ISODateTimeSchema,
  })
  .strict();

export const DocumentRevocationSchema = z
  .object({
    workspaceId: WorkspaceIdSchema,
    documentId: DocumentIdSchema,
    actorId: ActorIdSchema.optional(),
    authorizationVersion: z.number().int().nonnegative().max(Number.MAX_SAFE_INTEGER),
  })
  .strict();

export type DocumentAccess = z.infer<typeof DocumentAccessSchema>;
export type DocumentAuthorizationGrant = z.infer<typeof DocumentAuthorizationGrantSchema>;
export type DocumentRevocation = z.infer<typeof DocumentRevocationSchema>;

export interface ResolveDocumentTicketInput {
  token: string;
  document: CollaborationDocumentIdentity;
}

export interface RevalidateDocumentAccessInput {
  grant: DocumentAuthorizationGrant;
  document: CollaborationDocumentIdentity;
}

export type DocumentRevocationListener = (event: unknown) => void;

/**
 * 授权端口的返回值刻意是 unknown：真实实现通常跨进程调用 API 或验证外部签发的 ticket，
 * 任何静态类型都不能替代适配器边界后的 Zod 校验。实现不得在错误中附带 token 或原始声明。
 */
export interface DocumentAuthorizationPort {
  resolveDocumentTicket(input: ResolveDocumentTicketInput): Promise<unknown>;
  revalidateDocumentAccess(input: RevalidateDocumentAccessInput): Promise<unknown>;
  /**
   * 生产适配器必须订阅权限版本/成员关系撤销，且订阅建立失败时抛错阻止服务启动。
   * 只依赖 ticket 到期不足以阻止空闲只读连接继续被动接收更新。
   */
  subscribeToRevocations(listener: DocumentRevocationListener): () => void;
}
