import { DocumentIdSchema, WorkspaceIdSchema } from "@haloai/contracts";
import { afterEach, describe, expect, it, vi } from "vitest";
import { storeDocumentWithRetry } from "../src/persistence-retry";
import type {
  DocumentPersistencePort,
  LoadDocumentInput,
  StoreDocumentInput,
} from "../src/ports/persistence";
import { shutdownWithinDeadline } from "../src/shutdown";

const document = {
  workspaceId: WorkspaceIdSchema.parse("workspace_00001"),
  documentId: DocumentIdSchema.parse("document_000001"),
};

class FlakyPersistence implements DocumentPersistencePort {
  readonly persistenceKind = "persistent" as const;
  attempts = 0;
  stored: Uint8Array | null = null;

  async loadDocument(_input: LoadDocumentInput): Promise<Uint8Array | null> {
    return this.stored === null ? null : new Uint8Array(this.stored);
  }

  async storeDocument(input: StoreDocumentInput): Promise<void> {
    this.attempts += 1;
    if (this.attempts < 3) throw new Error("temporary-adapter-failure");
    this.stored = new Uint8Array(input.state);
  }
}

afterEach(() => {
  vi.useRealTimers();
});

describe("协作文档持久化恢复", () => {
  it("适配器短暂失败后在有界次数内保存同一份权威快照", async () => {
    const persistence = new FlakyPersistence();
    const delays: number[] = [];
    const state = Uint8Array.from([1, 2, 3, 4]);

    await storeDocumentWithRetry({
      persistence,
      store: { document, state, storedAt: "2026-08-09T10:00:00.000Z" },
      policy: { attempts: 3, attemptTimeoutMs: 100, baseDelayMs: 10 },
      runtime: {
        async wait(delayMs) {
          delays.push(delayMs);
        },
      },
    });

    expect(persistence.attempts).toBe(3);
    expect(delays).toEqual([10, 20]);
    expect(persistence.stored).toEqual(state);
  });

  it("单次适配器调用挂起时会中止并在期限内失败", async () => {
    vi.useFakeTimers();
    let observedAbort = false;
    const persistence: DocumentPersistencePort = {
      persistenceKind: "persistent",
      async loadDocument() {
        return null;
      },
      async storeDocument(input) {
        await new Promise<void>((_resolve, reject) => {
          input.signal.addEventListener(
            "abort",
            () => {
              observedAbort = true;
              reject(new Error("adapter-aborted"));
            },
            { once: true },
          );
        });
      },
    };
    const operation = storeDocumentWithRetry({
      persistence,
      store: {
        document,
        state: Uint8Array.from([1]),
        storedAt: "2026-08-09T10:00:00.000Z",
      },
      policy: { attempts: 1, attemptTimeoutMs: 50, baseDelayMs: 10 },
    });
    const rejected = expect(operation).rejects.toThrow("document-store-failed");

    await vi.advanceTimersByTimeAsync(50);
    await rejected;
    expect(observedAbort).toBe(true);
  });

  it("正常关闭挂起时执行有界强制卸载并明确返回失败", async () => {
    vi.useFakeTimers();
    let forced = false;
    const operation = shutdownWithinDeadline({
      graceful: new Promise<void>(() => undefined),
      timeoutMs: 100,
      async forceUnload() {
        forced = true;
      },
    });
    const rejected = expect(operation).rejects.toThrow("collaboration-shutdown-forced");

    await vi.advanceTimersByTimeAsync(100);
    await rejected;
    expect(forced).toBe(true);
  });
});
