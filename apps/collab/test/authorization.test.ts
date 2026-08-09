import {
  ActorIdSchema,
  DocumentIdSchema,
  ISODateTimeSchema,
  WorkspaceIdSchema,
} from "@haloai/contracts";
import { describe, expect, it } from "vitest";
import {
  authorizeDocumentConnection,
  renewDocumentConnection,
  revalidateDocumentConnection,
} from "../src/authorization";
import { formatDocumentName } from "../src/document-name";
import type {
  DocumentAuthorizationPort,
  DocumentRevocationListener,
  ResolveDocumentTicketInput,
  RevalidateDocumentAccessInput,
} from "../src/ports/authorization";

const workspaceId = WorkspaceIdSchema.parse("workspace_00001");
const documentId = DocumentIdSchema.parse("document_000001");
const actorId = ActorIdSchema.parse("actor_human_001");
const documentName = formatDocumentName({ workspaceId, documentId });

const baseGrant = {
  ticketId: "ticket_0000000001",
  audience: "collaboration" as const,
  purpose: "document_sync" as const,
  actorId,
  actorKind: "human" as const,
  workspaceId,
  documentId,
  access: "write" as const,
  authorizationVersion: 3,
  expiresAt: ISODateTimeSchema.parse("2026-08-09T12:00:00.000Z"),
};

class FakeAuthorizationPort implements DocumentAuthorizationPort {
  resolveCalls = 0;
  resolveResult: unknown = baseGrant;
  revalidateResult: unknown = baseGrant;

  async resolveDocumentTicket(_input: ResolveDocumentTicketInput): Promise<unknown> {
    this.resolveCalls += 1;
    return this.resolveResult;
  }

  async revalidateDocumentAccess(_input: RevalidateDocumentAccessInput): Promise<unknown> {
    return this.revalidateResult;
  }

  subscribeToRevocations(_listener: DocumentRevocationListener): () => void {
    return () => undefined;
  }
}

const fixedClock = { now: () => Date.parse("2026-08-09T10:00:00.000Z") };

describe("协作文档授权", () => {
  it("从服务端 ticket 解析精确文档的写能力", async () => {
    const authorization = new FakeAuthorizationPort();
    const result = await authorizeDocumentConnection({
      token: "server-ticket-value",
      documentName,
      authorization,
      clock: fixedClock,
    });

    expect(result.readOnly).toBe(false);
    expect(result.context.grant.actorId).toBe(actorId);
    expect(authorization.resolveCalls).toBe(1);
  });

  it("空 ticket 默认拒绝且不会调用授权端口", async () => {
    const authorization = new FakeAuthorizationPort();

    await expect(
      authorizeDocumentConnection({
        token: "",
        documentName,
        authorization,
        clock: fixedClock,
      }),
    ).rejects.toThrow("permission-denied");
    expect(authorization.resolveCalls).toBe(0);
  });

  it("拒绝 ticket 声明的工作空间或文档与连接名不匹配", async () => {
    const authorization = new FakeAuthorizationPort();
    authorization.resolveResult = {
      ...baseGrant,
      workspaceId: WorkspaceIdSchema.parse("workspace_00002"),
    };

    await expect(
      authorizeDocumentConnection({
        token: "server-ticket-value",
        documentName,
        authorization,
        clock: fixedClock,
      }),
    ).rejects.toThrow("permission-denied");
  });

  it("拒绝过期 ticket 与非人员 Actor 声明", async () => {
    const authorization = new FakeAuthorizationPort();
    authorization.resolveResult = {
      ...baseGrant,
      expiresAt: ISODateTimeSchema.parse("2026-08-09T09:59:59.000Z"),
    };

    await expect(
      authorizeDocumentConnection({
        token: "server-ticket-value",
        documentName,
        authorization,
        clock: fixedClock,
      }),
    ).rejects.toThrow("permission-denied");

    authorization.resolveResult = { ...baseGrant, actorKind: "agent" };
    await expect(
      authorizeDocumentConnection({
        token: "server-ticket-value",
        documentName,
        authorization,
        clock: fixedClock,
      }),
    ).rejects.toThrow("permission-denied");
  });

  it("活动连接撤销写能力时降级只读，且旧只读连接不能静默升级", async () => {
    const authorization = new FakeAuthorizationPort();
    authorization.revalidateResult = {
      ...baseGrant,
      access: "read",
      authorizationVersion: 4,
    };

    const downgraded = await revalidateDocumentConnection({
      context: { grant: baseGrant },
      documentName,
      authorization,
      clock: fixedClock,
    });
    expect(downgraded.readOnly).toBe(true);

    authorization.revalidateResult = {
      ...baseGrant,
      access: "write",
      authorizationVersion: 5,
    };
    const remainsReadOnly = await revalidateDocumentConnection({
      context: { grant: downgraded.context.grant },
      documentName,
      authorization,
      clock: fixedClock,
    });
    expect(remainsReadOnly.readOnly).toBe(true);
  });

  it("重新校验不能替换 ticket 对应的 Actor", async () => {
    const authorization = new FakeAuthorizationPort();
    authorization.revalidateResult = {
      ...baseGrant,
      actorId: ActorIdSchema.parse("actor_human_002"),
      authorizationVersion: 4,
    };

    await expect(
      revalidateDocumentConnection({
        context: { grant: baseGrant },
        documentName,
        authorization,
        clock: fixedClock,
      }),
    ).rejects.toThrow("permission-denied");
  });

  it("同一连接续签 ticket 时不能切换 Actor", async () => {
    const authorization = new FakeAuthorizationPort();
    authorization.resolveResult = {
      ...baseGrant,
      ticketId: "ticket_0000000002",
      actorId: ActorIdSchema.parse("actor_human_002"),
      authorizationVersion: 4,
    };

    await expect(
      renewDocumentConnection({
        token: "renewed-server-ticket",
        context: { grant: baseGrant },
        documentName,
        authorization,
        clock: fixedClock,
      }),
    ).rejects.toThrow("permission-denied");
  });

  it("同一连接不能用较旧授权版本的 ticket 回退续签", async () => {
    const authorization = new FakeAuthorizationPort();
    authorization.resolveResult = {
      ...baseGrant,
      ticketId: "ticket_0000000002",
      authorizationVersion: 2,
    };

    await expect(
      renewDocumentConnection({
        token: "stale-server-ticket",
        context: { grant: baseGrant },
        documentName,
        authorization,
        clock: fixedClock,
      }),
    ).rejects.toThrow("permission-denied");
  });

  it("格式正确但来自另一 documentId 的 ticket 仍然拒绝", async () => {
    const authorization = new FakeAuthorizationPort();
    authorization.resolveResult = {
      ...baseGrant,
      documentId: DocumentIdSchema.parse("document_000002"),
    };

    await expect(
      authorizeDocumentConnection({
        token: "server-ticket-value",
        documentName,
        authorization,
        clock: fixedClock,
      }),
    ).rejects.toThrow("permission-denied");
  });
});
