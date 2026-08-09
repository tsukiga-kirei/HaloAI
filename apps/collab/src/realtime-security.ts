import { ActorIdSchema } from "@haloai/contracts";
import {
  IncomingMessage,
  MessageType,
  type Connection,
  type afterHandleMessagePayload,
  type beforeHandleAwarenessPayload,
  type beforeHandleMessagePayload,
  type beforeSyncPayload,
} from "@hocuspocus/server";
import { messageYjsSyncStep2, messageYjsUpdate } from "y-protocols/sync";
import { Doc, applyUpdate, encodeStateAsUpdate } from "yjs";
import { z } from "zod";
import type { CollaborationConnectionContext } from "./authorization";
import { DocumentAuthorizationGrantSchema } from "./ports/authorization";

export interface RealtimeSecurityLimits {
  maxUpdateBytes: number;
  maxDocumentBytes: number;
  maxAwarenessBytes: number;
  maxAwarenessUpdatesPerSecond: number;
}

export interface RealtimeSecurityClock {
  now(): number;
}

const systemClock: RealtimeSecurityClock = { now: () => Date.now() };

const CursorOrSelectionSchema = z
  .object({
    anchor: z.number().int().min(0).max(100_000_000),
    head: z.number().int().min(0).max(100_000_000),
  })
  .strict();

const ClientAwarenessStateSchema = z
  .object({
    /** actor 字段允许出现在协议中，但其值会在服务端用已认证 grant 覆盖。 */
    actorId: z.unknown().optional(),
    actorType: z.unknown().optional(),
    displayName: z
      .string()
      .trim()
      .min(1)
      .max(80)
      .refine((value) => !/[\u0000-\u001f\u007f]/u.test(value)),
    avatarReference: z
      .string()
      .min(1)
      .max(256)
      .regex(/^[A-Za-z0-9][A-Za-z0-9._/-]*$/u)
      .optional(),
    presenceColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/u),
    cursorOrSelection: CursorOrSelectionSchema.nullable().optional(),
    clientInstanceId: z
      .string()
      .min(1)
      .max(128)
      .regex(/^[A-Za-z0-9_-]+$/u),
  })
  .strict();

const SanitizedAwarenessStateSchema = ClientAwarenessStateSchema.extend({
  actorId: ActorIdSchema,
  actorType: z.literal("human"),
}).strict();

interface DecodedAwarenessEntry {
  clientId: number;
  clock: number;
  state: unknown;
}

interface PendingMessage {
  kind: "sync" | "awareness";
  release(): void;
  awareness?: DecodedAwarenessEntry;
}

class DocumentMessageMutex {
  private readonly tails = new WeakMap<object, Promise<void>>();

  async acquire(document: object): Promise<() => void> {
    const previous = this.tails.get(document) ?? Promise.resolve();
    let releaseGate = (): void => undefined;
    const gate = new Promise<void>((resolve) => {
      releaseGate = resolve;
    });
    const queued = previous.then(() => gate);
    this.tails.set(document, queued);
    await previous;

    let released = false;
    return () => {
      if (released) return;
      released = true;
      releaseGate();
      if (this.tails.get(document) === queued) {
        this.tails.delete(document);
      }
    };
  }
}

function decodeAwarenessEntry(update: Uint8Array): DecodedAwarenessEntry {
  try {
    const decoder = new IncomingMessage(update);
    const entries = decoder.readVarUint();
    if (entries !== 1) {
      throw new Error("awareness-entry-count-invalid");
    }
    const clientId = decoder.readVarUint();
    const clock = decoder.readVarUint();
    if (
      !Number.isSafeInteger(clientId) ||
      clientId < 1 ||
      clientId > 0xffff_ffff ||
      !Number.isSafeInteger(clock) ||
      clock < 1
    ) {
      throw new Error("awareness-identity-invalid");
    }
    const state = JSON.parse(decoder.readVarString()) as unknown;
    if (decoder.decoder.pos !== update.byteLength) {
      throw new Error("awareness-trailing-data");
    }
    return { clientId, clock, state };
  } catch {
    throw new Error("awareness-payload-invalid");
  }
}

function decodeInboundMessage(update: Uint8Array): {
  type: MessageType;
  awareness?: Uint8Array;
} {
  try {
    const message = new IncomingMessage(update);
    message.readVarString();
    const type = message.readVarUint() as MessageType;
    if (type !== MessageType.Awareness) {
      return { type };
    }
    const awareness = message.readVarUint8Array();
    if (message.decoder.pos !== update.byteLength) {
      throw new Error("message-trailing-data");
    }
    return {
      type,
      awareness,
    };
  } catch {
    throw new Error("collaboration-message-invalid");
  }
}

function varUintLength(value: number): number {
  let remaining = value;
  let length = 1;
  while (remaining >= 128) {
    remaining = Math.floor(remaining / 128);
    length += 1;
  }
  return length;
}

function encodedAwarenessBytes(entry: DecodedAwarenessEntry, state: unknown): number {
  const jsonBytes = Buffer.byteLength(JSON.stringify(state), "utf8");
  return (
    1 +
    varUintLength(entry.clientId) +
    varUintLength(entry.clock) +
    varUintLength(jsonBytes) +
    jsonBytes
  );
}

/**
 * v4.5 会在 beforeSync 返回后才真正应用更新，因此锁必须跨越 beforeSync，并在
 * afterHandleMessage 中释放。若只在预演函数内部加锁，两个连接仍可能同时基于旧状态通过上限。
 */
export class RealtimeSecurityGuards {
  private readonly mutex = new DocumentMessageMutex();
  private readonly pending = new WeakMap<Connection, PendingMessage>();
  private readonly awarenessWindows = new WeakMap<Connection, number[]>();

  constructor(
    private readonly limits: RealtimeSecurityLimits,
    private readonly clock: RealtimeSecurityClock = systemClock,
  ) {}

  async beforeHandleMessage(
    data: Pick<
      beforeHandleMessagePayload<CollaborationConnectionContext>,
      "connection" | "document" | "update"
    >,
  ): Promise<void> {
    if (this.pending.has(data.connection)) {
      throw new Error("collaboration-message-overlap");
    }

    const decoded = decodeInboundMessage(data.update);
    if (
      decoded.type !== MessageType.Sync &&
      decoded.type !== MessageType.SyncReply &&
      decoded.type !== MessageType.Awareness
    ) {
      return;
    }

    if (decoded.type === MessageType.Awareness) {
      const awareness = decoded.awareness;
      /**
       * 必须先检查原始字节再 JSON 解码。否则攻击者虽然最终会因 2 KiB 上限被拒绝，仍能先让
       * 进程解析 WebSocket 上限大小的 JSON，令“大小限制”失去保护内存与 CPU 的意义。
       */
      if (awareness === undefined || awareness.byteLength > this.limits.maxAwarenessBytes) {
        throw new Error("awareness-size-limit-exceeded");
      }
      decodeAwarenessEntry(awareness);
      this.assertAwarenessRate(data.connection);
    }

    const release = await this.mutex.acquire(data.document);
    try {
      if (decoded.type === MessageType.Awareness) {
        const entry =
          decoded.awareness === undefined ? undefined : decodeAwarenessEntry(decoded.awareness);
        if (entry === undefined) throw new Error("awareness-payload-invalid");
        this.assertAwarenessOwnership(data.document, data.connection, entry);
        this.pending.set(data.connection, { kind: "awareness", release, awareness: entry });
      } else {
        this.pending.set(data.connection, { kind: "sync", release });
      }
    } catch (error) {
      release();
      throw error;
    }
  }

  beforeSync(
    data: Pick<
      beforeSyncPayload<CollaborationConnectionContext>,
      "connection" | "document" | "payload" | "type"
    >,
  ): void {
    const pending = this.pending.get(data.connection);
    if (pending?.kind !== "sync") {
      throw new Error("document-update-lock-missing");
    }
    if (data.type !== messageYjsSyncStep2 && data.type !== messageYjsUpdate) return;
    if (data.payload.byteLength > this.limits.maxUpdateBytes) {
      throw new Error("document-update-size-limit-exceeded");
    }
    if (data.connection.readOnly) return;

    /**
     * 临时文档先装载当前完整状态，再应用候选更新；任何解码异常或超限都发生在权威文档
     * 改变和广播之前。复制有明确的 CPU/内存成本，但 Foundation 阶段优先保证硬边界；
     * 后续可在保持同一测试契约的前提下替换为可信的增量大小索引。
     */
    const probe = new Doc({ gc: data.document.gc });
    try {
      applyUpdate(probe, encodeStateAsUpdate(data.document));
      applyUpdate(probe, data.payload);
      if (encodeStateAsUpdate(probe).byteLength > this.limits.maxDocumentBytes) {
        throw new Error("document-size-limit-exceeded");
      }
    } catch (error) {
      if (error instanceof Error && error.message === "document-size-limit-exceeded") {
        throw error;
      }
      throw new Error("document-update-invalid");
    } finally {
      probe.destroy();
    }
  }

  beforeHandleAwareness(
    data: Pick<
      beforeHandleAwarenessPayload<CollaborationConnectionContext>,
      "connection" | "context" | "states"
    >,
  ): void {
    if (data.connection === undefined || data.context === undefined) {
      throw new Error("awareness-authentication-required");
    }
    const pending = this.pending.get(data.connection);
    const entry = pending?.awareness;
    if (pending?.kind !== "awareness" || entry === undefined) {
      throw new Error("awareness-message-context-missing");
    }

    let grant: z.infer<typeof DocumentAuthorizationGrantSchema>;
    try {
      grant = DocumentAuthorizationGrantSchema.parse(data.context.grant);
    } catch {
      throw new Error("awareness-authentication-required");
    }
    data.states.clear();
    if (entry.state === null) {
      /**
       * v4.5 的临时 Awareness map 不保留删除项。重新放入 null tombstone 才能让重编码后的
       * 更新立即删除远端 presence，而不是依赖心跳超时；clear 同时移除临时 Awareness 自带的空状态。
       */
      data.states.set(entry.clientId, null as unknown as Record<string, unknown>);
      return;
    }

    let sanitized: z.infer<typeof SanitizedAwarenessStateSchema>;
    try {
      const clientState = ClientAwarenessStateSchema.parse(entry.state);
      sanitized = SanitizedAwarenessStateSchema.parse({
        ...clientState,
        actorId: grant.actorId,
        actorType: "human",
      });
    } catch {
      throw new Error("awareness-state-invalid");
    }
    if (encodedAwarenessBytes(entry, sanitized) > this.limits.maxAwarenessBytes) {
      throw new Error("awareness-size-limit-exceeded");
    }
    data.states.set(entry.clientId, sanitized);
  }

  afterHandleMessage(
    data: Pick<afterHandleMessagePayload<CollaborationConnectionContext>, "connection">,
  ): void {
    const pending = this.pending.get(data.connection);
    if (pending === undefined) return;
    this.pending.delete(data.connection);
    pending.release();
  }

  private assertAwarenessRate(connection: Connection): void {
    const now = this.clock.now();
    const cutoff = now - 1_000;
    const retained = (this.awarenessWindows.get(connection) ?? []).filter(
      (observedAt) => observedAt > cutoff,
    );
    if (retained.length >= this.limits.maxAwarenessUpdatesPerSecond) {
      throw new Error("awareness-rate-limit-exceeded");
    }
    retained.push(now);
    this.awarenessWindows.set(connection, retained);
  }

  private assertAwarenessOwnership(
    document: beforeHandleMessagePayload<CollaborationConnectionContext>["document"],
    connection: Connection,
    entry: DecodedAwarenessEntry,
  ): void {
    const owned = document.getClients(connection);
    if (owned.size > 1 || (owned.size === 1 && !owned.has(entry.clientId))) {
      throw new Error("awareness-client-identity-mismatch");
    }
    for (const other of document.getConnections()) {
      if (other !== connection && document.getClients(other).has(entry.clientId)) {
        throw new Error("awareness-client-identity-mismatch");
      }
    }
    if (entry.state === null && !owned.has(entry.clientId)) {
      throw new Error("awareness-client-identity-mismatch");
    }
    if (
      entry.state !== null &&
      document.awareness.getStates().has(entry.clientId) &&
      !owned.has(entry.clientId)
    ) {
      throw new Error("awareness-client-identity-mismatch");
    }
  }
}
