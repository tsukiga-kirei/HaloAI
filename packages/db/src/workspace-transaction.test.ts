import { describe, expect, it } from "vitest";
import { PersistenceError } from "./errors";
import { assertUuid } from "./workspace-transaction";

describe("工作空间事务上下文", () => {
  it("接受规范 UUID 并拒绝展示层临时 ID", () => {
    expect(() => assertUuid("018f7f34-79f2-7cc3-8e9d-3d93083dc625", "workspaceId")).not.toThrow();
    expect(() => assertUuid("workspace_00001", "workspaceId")).toThrow(PersistenceError);
  });
});
