import { describe, expect, it } from "vitest";
import { DocumentDurabilityGuard } from "../src/durability-guard";

describe("协作文档耐久代次守卫", () => {
  it("保存当前代后允许卸载", () => {
    const guard = new DocumentDurabilityGuard();
    guard.markDirty("workspace/document");
    const generation = guard.beginStore("workspace/document");
    guard.markStored("workspace/document", generation);

    expect(() => guard.assertCanUnload("workspace/document")).not.toThrow();
    expect(guard.hasDirtyDocuments()).toBe(false);
  });

  it("旧快照成功不能清除保存期间产生的新更新", () => {
    const guard = new DocumentDurabilityGuard();
    guard.markDirty("workspace/document");
    const staleGeneration = guard.beginStore("workspace/document");
    guard.markDirty("workspace/document");
    guard.markStored("workspace/document", staleGeneration);

    expect(() => guard.assertCanUnload("workspace/document")).toThrow(
      "document-has-unpersisted-updates",
    );
    expect(guard.hasDirtyDocuments()).toBe(true);
  });

  it("保存失败未调用确认时始终阻止普通卸载", () => {
    const guard = new DocumentDurabilityGuard();
    guard.markDirty("workspace/document");

    expect(() => guard.assertCanUnload("workspace/document")).toThrow(
      "document-has-unpersisted-updates",
    );
  });
});
