import { createHash, timingSafeEqual } from "node:crypto";
import type { ActorId, DocumentId, WorkspaceId } from "@haloai/contracts";
import { ISODateTimeSchema } from "@haloai/contracts";
import type { CollaborationDocumentIdentity } from "../document-name";
import type {
  DocumentAccess,
  DocumentAuthorizationGrant,
  DocumentAuthorizationPort,
  DocumentRevocationListener,
  ResolveDocumentTicketInput,
  RevalidateDocumentAccessInput,
} from "../ports/authorization";

export interface DemoAuthorizationOptions {
  token: string;
  actorId: ActorId;
  workspaceId: WorkspaceId;
  documentId: DocumentId;
  access: DocumentAccess;
  now?: () => number;
}

function tokensEqual(left: string, right: string): boolean {
  const leftDigest = createHash("sha256").update(left, "utf8").digest();
  const rightDigest = createHash("sha256").update(right, "utf8").digest();
  return timingSafeEqual(leftDigest, rightDigest);
}

/**
 * 仅供本地 Foundation 演示。静态 token、固定单文档授权和进程内撤权都不满足生产要求；
 * 配置层会禁止 production 使用。这里仍采用常量时间比较，避免示例代码形成明显的坏安全习惯。
 */
export class DemoDocumentAuthorization implements DocumentAuthorizationPort {
  private readonly listeners = new Set<DocumentRevocationListener>();
  private readonly expiresAt: string;
  private revoked = false;

  constructor(private readonly options: DemoAuthorizationOptions) {
    this.expiresAt = new Date((options.now ?? Date.now)() + 8 * 60 * 60 * 1_000).toISOString();
  }

  private matchesDocument(document: CollaborationDocumentIdentity): boolean {
    return (
      document.workspaceId === this.options.workspaceId &&
      document.documentId === this.options.documentId
    );
  }

  private grant(): DocumentAuthorizationGrant {
    return {
      ticketId: "demo_ticket_00000001",
      audience: "collaboration",
      purpose: "document_sync",
      actorId: this.options.actorId,
      actorKind: "human",
      workspaceId: this.options.workspaceId,
      documentId: this.options.documentId,
      access: this.options.access,
      authorizationVersion: this.revoked ? 2 : 1,
      expiresAt: ISODateTimeSchema.parse(this.expiresAt),
    };
  }

  async resolveDocumentTicket(input: ResolveDocumentTicketInput): Promise<unknown> {
    if (
      this.revoked ||
      !tokensEqual(input.token, this.options.token) ||
      !this.matchesDocument(input.document)
    ) {
      throw new Error("permission-denied");
    }
    return this.grant();
  }

  async revalidateDocumentAccess(input: RevalidateDocumentAccessInput): Promise<unknown> {
    if (this.revoked || !this.matchesDocument(input.document)) {
      throw new Error("permission-denied");
    }
    return this.grant();
  }

  subscribeToRevocations(listener: DocumentRevocationListener): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  revoke(): void {
    if (this.revoked) {
      return;
    }
    this.revoked = true;
    const event = {
      workspaceId: this.options.workspaceId,
      documentId: this.options.documentId,
      actorId: this.options.actorId,
      authorizationVersion: 2,
    };
    this.listeners.forEach((listener) => listener(event));
  }
}
