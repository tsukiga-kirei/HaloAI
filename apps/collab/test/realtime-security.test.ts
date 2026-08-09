import {
  ActorIdSchema,
  DocumentIdSchema,
  ISODateTimeSchema,
  WorkspaceIdSchema,
} from "@haloai/contracts";
import { MessageType, type Connection } from "@hocuspocus/server";
import { describe, expect, it } from "vitest";
import { Doc, applyUpdate, encodeStateAsUpdate } from "yjs";
import { RealtimeSecurityGuards } from "../src/realtime-security";

const limits = {
  maxUpdateBytes: 1_048_576,
  maxDocumentBytes: 20_971_520,
  maxAwarenessBytes: 2_048,
  maxAwarenessUpdatesPerSecond: 20,
};

const grant = {
  ticketId: "ticket_0000000001",
  audience: "collaboration" as const,
  purpose: "document_sync" as const,
  actorId: ActorIdSchema.parse("actor_human_001"),
  actorKind: "human" as const,
  workspaceId: WorkspaceIdSchema.parse("workspace_00001"),
  documentId: DocumentIdSchema.parse("document_000001"),
  access: "write" as const,
  authorizationVersion: 1,
  expiresAt: ISODateTimeSchema.parse("2026-08-09T12:00:00.000Z"),
};

function varUint(value: number): Uint8Array {
  const bytes: number[] = [];
  let remaining = value;
  do {
    let next = remaining & 127;
    remaining = Math.floor(remaining / 128);
    if (remaining > 0) next |= 128;
    bytes.push(next);
  } while (remaining > 0);
  return Uint8Array.from(bytes);
}

function concat(...parts: Uint8Array[]): Uint8Array {
  const result = new Uint8Array(parts.reduce((total, part) => total + part.byteLength, 0));
  let offset = 0;
  for (const part of parts) {
    result.set(part, offset);
    offset += part.byteLength;
  }
  return result;
}

function varString(value: string): Uint8Array {
  const bytes = new TextEncoder().encode(value);
  return concat(varUint(bytes.byteLength), bytes);
}

function frame(type: MessageType, payload?: Uint8Array): Uint8Array {
  const prefix = concat(varString("v1.test.test"), varUint(type));
  return payload === undefined ? prefix : concat(prefix, varUint(payload.byteLength), payload);
}

function awarenessPayload(clientId: number, clock: number, state: unknown): Uint8Array {
  return concat(varUint(1), varUint(clientId), varUint(clock), varString(JSON.stringify(state)));
}

function awarenessPayloadOfSize(targetBytes: number): Uint8Array {
  let padding = Math.max(0, targetBytes - 32);
  for (;;) {
    const payload = awarenessPayload(10, 1, { padding: "x".repeat(padding) });
    if (payload.byteLength === targetBytes) return payload;
    padding += targetBytes - payload.byteLength;
  }
}

function connection(readOnly = false): Connection {
  return { readOnly } as Connection;
}

function awarenessDocument(
  owners: Map<Connection, Set<number>>,
  states: Map<number, unknown> = new Map(),
) {
  return {
    getClients(candidate: Connection) {
      return owners.get(candidate) ?? new Set<number>();
    },
    getConnections() {
      return [...owners.keys()];
    },
    awareness: {
      getStates() {
        return states;
      },
    },
  };
}

describe("实时协作入站安全边界", () => {
  it("候选更新会在权威文档改变前因累计大小超限而拒绝", async () => {
    const authoritative = new Doc();
    const first = new Doc();
    const second = new Doc();
    first.getText("body-a").insert(0, "a".repeat(16_000));
    second.getText("body-b").insert(0, "b".repeat(16_000));
    const updateA = encodeStateAsUpdate(first);
    const updateB = encodeStateAsUpdate(second);

    const onlyA = new Doc();
    applyUpdate(onlyA, updateA);
    const both = new Doc();
    applyUpdate(both, updateA);
    applyUpdate(both, updateB);
    const oneSize = encodeStateAsUpdate(onlyA).byteLength;
    const bothSize = encodeStateAsUpdate(both).byteLength;
    expect(bothSize).toBeGreaterThan(oneSize);

    const guards = new RealtimeSecurityGuards({
      ...limits,
      maxDocumentBytes: Math.floor((oneSize + bothSize) / 2),
    });
    const firstConnection = connection();
    const secondConnection = connection();

    await guards.beforeHandleMessage({
      connection: firstConnection,
      document: authoritative as never,
      update: frame(MessageType.Sync),
    });
    guards.beforeSync({
      connection: firstConnection,
      document: authoritative as never,
      payload: updateA,
      type: 2,
    });
    applyUpdate(authoritative, updateA);
    guards.afterHandleMessage({ connection: firstConnection });

    await guards.beforeHandleMessage({
      connection: secondConnection,
      document: authoritative as never,
      update: frame(MessageType.Sync),
    });
    expect(() =>
      guards.beforeSync({
        connection: secondConnection,
        document: authoritative as never,
        payload: updateB,
        type: 2,
      }),
    ).toThrow("document-size-limit-exceeded");
    guards.afterHandleMessage({ connection: secondConnection });
    expect(encodeStateAsUpdate(authoritative).byteLength).toBe(oneSize);

    authoritative.destroy();
    first.destroy();
    second.destroy();
    onlyA.destroy();
    both.destroy();
  });

  it("跨连接更新在实际应用完成前共享同一把文档锁", async () => {
    const guards = new RealtimeSecurityGuards(limits);
    const document = new Doc();
    const first = connection();
    const second = connection();
    await guards.beforeHandleMessage({
      connection: first,
      document: document as never,
      update: frame(MessageType.Sync),
    });

    let secondAcquired = false;
    const waiting = guards
      .beforeHandleMessage({
        connection: second,
        document: document as never,
        update: frame(MessageType.Sync),
      })
      .then(() => {
        secondAcquired = true;
      });
    await Promise.resolve();
    expect(secondAcquired).toBe(false);

    guards.afterHandleMessage({ connection: first });
    await waiting;
    expect(secondAcquired).toBe(true);
    guards.afterHandleMessage({ connection: second });
    document.destroy();
  });

  it("Awareness 原始载荷严格限制为 2 KiB", async () => {
    const guards = new RealtimeSecurityGuards(limits);
    const actorConnection = connection();
    const document = awarenessDocument(new Map([[actorConnection, new Set()]]));

    await guards.beforeHandleMessage({
      connection: actorConnection,
      document: document as never,
      update: frame(MessageType.Awareness, awarenessPayloadOfSize(2_048)),
    });
    guards.afterHandleMessage({ connection: actorConnection });

    await expect(
      guards.beforeHandleMessage({
        connection: actorConnection,
        document: document as never,
        update: frame(MessageType.Awareness, awarenessPayloadOfSize(2_049)),
      }),
    ).rejects.toThrow("awareness-size-limit-exceeded");
  });

  it("Awareness 任意滚动一秒内第 21 次被拒绝，窗口后恢复", async () => {
    let now = 1_000;
    const guards = new RealtimeSecurityGuards(limits, { now: () => now });
    const actorConnection = connection();
    const document = awarenessDocument(new Map([[actorConnection, new Set()]]));
    const update = frame(MessageType.Awareness, awarenessPayload(10, 1, {}));

    for (let index = 0; index < 20; index += 1) {
      await guards.beforeHandleMessage({
        connection: actorConnection,
        document: document as never,
        update,
      });
      guards.afterHandleMessage({ connection: actorConnection });
    }
    await expect(
      guards.beforeHandleMessage({
        connection: actorConnection,
        document: document as never,
        update,
      }),
    ).rejects.toThrow("awareness-rate-limit-exceeded");

    now = 2_001;
    await guards.beforeHandleMessage({
      connection: actorConnection,
      document: document as never,
      update,
    });
    guards.afterHandleMessage({ connection: actorConnection });
  });

  it("Awareness 清除临时空状态并用已认证 Actor 覆盖客户端声明", async () => {
    const guards = new RealtimeSecurityGuards(limits);
    const actorConnection = connection();
    const document = awarenessDocument(new Map([[actorConnection, new Set()]]));
    const state = {
      actorId: "actor_human_999",
      actorType: "agent",
      displayName: "协作者",
      presenceColor: "#3366FF",
      clientInstanceId: "client_instance_1",
      cursorOrSelection: { anchor: 3, head: 7 },
    };
    await guards.beforeHandleMessage({
      connection: actorConnection,
      document: document as never,
      update: frame(MessageType.Awareness, awarenessPayload(10, 1, state)),
    });
    const states = new Map<number, Record<string, unknown>>([[999, {}]]);
    guards.beforeHandleAwareness({
      connection: actorConnection,
      context: { grant },
      states,
    });

    expect([...states.keys()]).toEqual([10]);
    expect(states.get(10)).toMatchObject({ actorId: grant.actorId, actorType: "human" });
    guards.afterHandleMessage({ connection: actorConnection });
  });

  it("Awareness 拒绝白名单外字段以及对其他连接 clientId 的修改", async () => {
    const guards = new RealtimeSecurityGuards(limits);
    const owner = connection();
    const attacker = connection();
    const document = awarenessDocument(
      new Map([
        [owner, new Set([10])],
        [attacker, new Set()],
      ]),
      new Map([[10, {}]]),
    );
    const spoofed = {
      displayName: "伪造者",
      presenceColor: "#3366FF",
      clientInstanceId: "client_instance_2",
      token: "must-not-pass",
    };

    await expect(
      guards.beforeHandleMessage({
        connection: attacker,
        document: document as never,
        update: frame(MessageType.Awareness, awarenessPayload(10, 2, spoofed)),
      }),
    ).rejects.toThrow("awareness-client-identity-mismatch");

    const ownDocument = awarenessDocument(new Map([[attacker, new Set()]]));
    await guards.beforeHandleMessage({
      connection: attacker,
      document: ownDocument as never,
      update: frame(MessageType.Awareness, awarenessPayload(11, 1, spoofed)),
    });
    expect(() =>
      guards.beforeHandleAwareness({
        connection: attacker,
        context: { grant },
        states: new Map(),
      }),
    ).toThrow();
    guards.afterHandleMessage({ connection: attacker });
  });

  it("Awareness 删除保留 null tombstone 以立即移除在线状态", async () => {
    const guards = new RealtimeSecurityGuards(limits);
    const actorConnection = connection();
    const document = awarenessDocument(
      new Map([[actorConnection, new Set([10])]]),
      new Map([[10, {}]]),
    );
    await guards.beforeHandleMessage({
      connection: actorConnection,
      document: document as never,
      update: frame(MessageType.Awareness, awarenessPayload(10, 2, null)),
    });
    const states = new Map<number, Record<string, unknown>>([[999, {}]]);
    guards.beforeHandleAwareness({
      connection: actorConnection,
      context: { grant },
      states,
    });
    expect(states.size).toBe(1);
    expect(states.get(10)).toBeNull();
    guards.afterHandleMessage({ connection: actorConnection });
  });
});
