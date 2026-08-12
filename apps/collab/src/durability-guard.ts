/**
 * 文档持久化使用“代次”而不是单个布尔值：保存进行中仍可能收到新更新，旧快照成功不能
 * 清除新更新的脏状态。该守卫不负责重试，只负责证明某一代是否已经耐久化。
 */
export class DocumentDurabilityGuard {
  private readonly generations = new Map<string, number>();
  private readonly dirtyDocuments = new Set<string>();

  markDirty(documentName: string): void {
    this.generations.set(documentName, (this.generations.get(documentName) ?? 0) + 1);
    this.dirtyDocuments.add(documentName);
  }

  beginStore(documentName: string): number {
    return this.generations.get(documentName) ?? 0;
  }

  markStored(documentName: string, storedGeneration: number): void {
    if ((this.generations.get(documentName) ?? 0) === storedGeneration) {
      this.dirtyDocuments.delete(documentName);
    }
  }

  assertCanUnload(documentName: string): void {
    if (this.dirtyDocuments.has(documentName)) {
      throw new Error("document-has-unpersisted-updates");
    }
  }

  hasDirtyDocuments(): boolean {
    return this.dirtyDocuments.size > 0;
  }
}
