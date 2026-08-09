import type { CollaborationDocumentIdentity } from "../document-name";

export interface LoadDocumentInput {
  document: CollaborationDocumentIdentity;
}

export interface StoreDocumentInput {
  document: CollaborationDocumentIdentity;
  state: Uint8Array;
  storedAt: string;
  /**
   * 超时后上层会中止本次尝试。生产适配器必须把 signal 继续传给数据库或对象存储驱动；
   * 忽略 signal 的实现虽然仍会被上层限时返回，但可能在服务关闭后继续执行不可观察的写入。
   */
  signal: AbortSignal;
}

/**
 * persistenceKind 是启动安全检查的一部分，而不是展示标签。生产环境只接受 persistent；
 * 适配器必须保存完整 Yjs 二进制状态，不能从 JSON/HTML 投影重建历史。异常不得携带 state 字节，
 * 因为上层和第三方库可能记录异常对象。
 */
export interface DocumentPersistencePort {
  readonly persistenceKind: "persistent" | "demo-memory";
  loadDocument(input: LoadDocumentInput): Promise<Uint8Array | null>;
  storeDocument(input: StoreDocumentInput): Promise<void>;
}
