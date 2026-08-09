import { z } from "zod";
import {
  formatDocumentName,
  parseDocumentName,
  type CollaborationDocumentIdentity,
} from "./document-name";
import {
  DocumentAuthorizationGrantSchema,
  type DocumentAuthorizationGrant,
  type DocumentAuthorizationPort,
} from "./ports/authorization";

const CollaborationTokenSchema = z.string().min(1).max(8_192);

export interface CollaborationConnectionContext {
  grant: DocumentAuthorizationGrant;
}

export interface AuthorizedDocumentConnection {
  context: CollaborationConnectionContext;
  readOnly: boolean;
}

export interface AuthorizationClock {
  now(): number;
}

const systemClock: AuthorizationClock = { now: () => Date.now() };

function deny(): never {
  /**
   * 连接端只获得稳定的拒绝原因，不能借错误差异枚举工作空间、文档、Actor 或 ticket 状态。
   * 服务端遥测也不得记录原 token；需要关联时使用成功解析后的 ticketId。
   */
  throw new Error("permission-denied");
}

function assertGrantMatchesDocument(
  grant: DocumentAuthorizationGrant,
  document: CollaborationDocumentIdentity,
): void {
  if (grant.workspaceId !== document.workspaceId || grant.documentId !== document.documentId) {
    deny();
  }
}

function assertGrantIsCurrent(grant: DocumentAuthorizationGrant, clock: AuthorizationClock): void {
  if (Date.parse(grant.expiresAt) <= clock.now()) {
    deny();
  }
}

export async function authorizeDocumentConnection(input: {
  token: string;
  documentName: string;
  authorization: DocumentAuthorizationPort;
  clock?: AuthorizationClock;
}): Promise<AuthorizedDocumentConnection> {
  const clock = input.clock ?? systemClock;
  let token: string;
  let document: CollaborationDocumentIdentity;

  try {
    token = CollaborationTokenSchema.parse(input.token);
    document = parseDocumentName(input.documentName);
  } catch {
    return deny();
  }

  let grant: DocumentAuthorizationGrant;
  try {
    const candidate = await input.authorization.resolveDocumentTicket({
      token,
      document,
    });
    grant = DocumentAuthorizationGrantSchema.parse(candidate);
    assertGrantMatchesDocument(grant, document);
    assertGrantIsCurrent(grant, clock);
  } catch {
    return deny();
  }

  return {
    context: { grant },
    readOnly: grant.access !== "write",
  };
}

/**
 * 活动连接不能把首次认证当作永久授权。每次收到客户端消息时重新查询端口，使撤权、过期和
 * 写权限降级在下一次入站交互前生效。已有只读连接不会因后台新增权限自动升级；升级必须用
 * 新 ticket 重新认证，避免旧连接静默扩大权限。
 */
export async function revalidateDocumentConnection(input: {
  context: CollaborationConnectionContext;
  documentName: string;
  authorization: DocumentAuthorizationPort;
  clock?: AuthorizationClock;
}): Promise<AuthorizedDocumentConnection> {
  const clock = input.clock ?? systemClock;
  let document: CollaborationDocumentIdentity;
  let previous: DocumentAuthorizationGrant;

  try {
    document = parseDocumentName(input.documentName);
    previous = DocumentAuthorizationGrantSchema.parse(input.context.grant);
    assertGrantMatchesDocument(previous, document);
  } catch {
    return deny();
  }

  let refreshed: DocumentAuthorizationGrant;
  try {
    const candidate = await input.authorization.revalidateDocumentAccess({
      grant: previous,
      document,
    });
    refreshed = DocumentAuthorizationGrantSchema.parse(candidate);
    assertGrantMatchesDocument(refreshed, document);
    assertGrantIsCurrent(refreshed, clock);
  } catch {
    return deny();
  }

  if (
    refreshed.ticketId !== previous.ticketId ||
    refreshed.actorId !== previous.actorId ||
    refreshed.authorizationVersion < previous.authorizationVersion
  ) {
    return deny();
  }

  const access = previous.access === "read" ? "read" : refreshed.access;
  const grant = DocumentAuthorizationGrantSchema.parse({
    ...refreshed,
    access,
  });

  return { context: { grant }, readOnly: access !== "write" };
}

/**
 * token sync 是同一条物理连接的凭据续期，不是切换账户的入口。新 ticket 可以更新权限与到期时间，
 * 但必须保持 Actor、workspace 和 document 不变；切换 Actor 必须先断开旧连接，避免 transaction
 * origin、Awareness 与审计归属在一条连接中出现两个身份。
 */
export async function renewDocumentConnection(input: {
  token: string;
  context: CollaborationConnectionContext;
  documentName: string;
  authorization: DocumentAuthorizationPort;
  clock?: AuthorizationClock;
}): Promise<AuthorizedDocumentConnection> {
  let previous: DocumentAuthorizationGrant;
  try {
    previous = DocumentAuthorizationGrantSchema.parse(input.context.grant);
  } catch {
    return deny();
  }
  const renewed = await authorizeDocumentConnection(input);

  if (
    renewed.context.grant.actorId !== previous.actorId ||
    renewed.context.grant.workspaceId !== previous.workspaceId ||
    renewed.context.grant.documentId !== previous.documentId ||
    renewed.context.grant.authorizationVersion < previous.authorizationVersion
  ) {
    return deny();
  }
  return renewed;
}

export function assertContextOwnsDocument(
  context: CollaborationConnectionContext,
  documentName: string,
): CollaborationDocumentIdentity {
  try {
    const document = parseDocumentName(documentName);
    const grant = DocumentAuthorizationGrantSchema.parse(context.grant);
    assertGrantMatchesDocument(grant, document);
    return document;
  } catch {
    return deny();
  }
}

export function documentNameForGrant(grant: DocumentAuthorizationGrant): string {
  return formatDocumentName({
    workspaceId: grant.workspaceId,
    documentId: grant.documentId,
  });
}
