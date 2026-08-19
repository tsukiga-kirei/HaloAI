import { describe, expect, it } from "vitest";
import {
  SaveWorkspaceDepartmentInputSchema,
  UpdateWorkspaceMemberOrganizationInputSchema,
} from "../src/workspace-organization";

describe("工作空间组织契约", () => {
  it("规范化部门编码并保留组织信息", () => {
    expect(
      SaveWorkspaceDepartmentInputSchema.parse({
        name: " 产品设计 ",
        code: "Product-Design",
        description: " 负责产品体验 ",
      }),
    ).toMatchObject({
      name: "产品设计",
      code: "product-design",
      description: "负责产品体验",
      parentId: null,
      managerActorId: null,
    });
  });

  it("拒绝路径式部门编码和过长岗位", () => {
    expect(
      SaveWorkspaceDepartmentInputSchema.safeParse({ name: "产品", code: "../product" }).success,
    ).toBe(false);
    expect(
      UpdateWorkspaceMemberOrganizationInputSchema.safeParse({
        departmentId: null,
        jobTitle: "a".repeat(121),
      }).success,
    ).toBe(false);
  });
});
