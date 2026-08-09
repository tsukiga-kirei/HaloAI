import { formatDocumentName } from "../document-name";
import type {
  DocumentPersistencePort,
  LoadDocumentInput,
  StoreDocumentInput,
} from "../ports/persistence";

/**
 * 仅供 Foundation 本地演示：状态只存在于当前进程，重启会永久丢失，也不提供跨实例一致性。
 * 通过复制 Uint8Array 隔离 Yjs/调用方后续修改，避免测试中出现“存储内容被外部引用悄悄改写”。
 * production 启动检查会明确拒绝本适配器。
 */
export class InMemoryDemoDocumentPersistence implements DocumentPersistencePort {
  readonly persistenceKind = "demo-memory" as const;
  private readonly states = new Map<string, Uint8Array>();

  async loadDocument(input: LoadDocumentInput): Promise<Uint8Array | null> {
    const state = this.states.get(formatDocumentName(input.document));
    return state === undefined ? null : new Uint8Array(state);
  }

  async storeDocument(input: StoreDocumentInput): Promise<void> {
    this.states.set(formatDocumentName(input.document), new Uint8Array(input.state));
  }
}
