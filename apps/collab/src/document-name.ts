import {
  DocumentIdSchema,
  WorkspaceIdSchema,
  type DocumentId,
  type WorkspaceId,
} from "@haloai/contracts";
import { z } from "zod";

const DocumentNameWireSchema = z
  .string()
  .min(8)
  .max(384)
  .regex(/^v1\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+$/);

export interface CollaborationDocumentIdentity {
  workspaceId: WorkspaceId;
  documentId: DocumentId;
}

function encodeSegment(value: string): string {
  return Buffer.from(value, "utf8").toString("base64url");
}

function decodeCanonicalSegment(value: string): string {
  const bytes = Buffer.from(value, "base64url");
  const decoded = new TextDecoder("utf-8", { fatal: true }).decode(bytes);

  /**
   * Node 的 base64url 解码器会宽松接受部分非规范输入。重新编码比较可以拒绝多种字符串
   * 映射到同一资源，避免授权缓存、连接复用与审计日志对“同一文档”产生不同键。
   */
  if (encodeSegment(decoded) !== value) {
    throw new Error("non-canonical-document-name");
  }
  return decoded;
}

/**
 * 文档名是资源选择器，不是权限证明。版本化、规范化编码同时携带 workspaceId 与 documentId；
 * ID 自身不允许点号，因此分段无歧义。query 中的 workspaceId、tenantId 或 documentId 一律忽略。
 */
export function formatDocumentName(identity: CollaborationDocumentIdentity): string {
  const workspaceId = WorkspaceIdSchema.parse(identity.workspaceId);
  const documentId = DocumentIdSchema.parse(identity.documentId);
  return `v1.${encodeSegment(workspaceId)}.${encodeSegment(documentId)}`;
}

export function parseDocumentName(documentName: string): CollaborationDocumentIdentity {
  const wireName = DocumentNameWireSchema.parse(documentName);
  const segments = wireName.split(".");
  const workspaceSegment = segments[1];
  const documentSegment = segments[2];

  if (workspaceSegment === undefined || documentSegment === undefined) {
    throw new Error("invalid-document-name");
  }

  const identity = {
    workspaceId: WorkspaceIdSchema.parse(decodeCanonicalSegment(workspaceSegment)),
    documentId: DocumentIdSchema.parse(decodeCanonicalSegment(documentSegment)),
  };

  if (formatDocumentName(identity) !== wireName) {
    throw new Error("non-canonical-document-name");
  }
  return identity;
}
