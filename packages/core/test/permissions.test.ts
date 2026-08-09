import { describe, expect, it } from "vitest";
import {
  authorize,
  intersectCapabilities,
  type Capability,
  type Principal,
} from "../src";

const basePrincipal: Principal = {
  actorId: "human-1",
  actorKind: "human",
  actorStatus: "active",
  workspaceId: "workspace-1",
  builtInRole: "member",
  projectIds: new Set(["project-1"]),
};

describe("授权策略", () => {
  it("允许成员在已加入项目中编辑文档", () => {
    expect(
      authorize(basePrincipal, "document.edit", {
        workspaceId: "workspace-1",
        projectId: "project-1",
      }),
    ).toEqual({ allowed: true, reason: "allowed" });
  });

  it("租户上下文缺失时默认拒绝", () => {
    expect(authorize(basePrincipal, "room.read", { projectId: "project-1" })).toEqual({
      allowed: false,
      reason: "tenant_context_missing",
    });
  });

  it("拒绝跨工作空间访问", () => {
    expect(
      authorize(basePrincipal, "room.read", {
        workspaceId: "workspace-2",
        projectId: "project-1",
      }),
    ).toEqual({ allowed: false, reason: "cross_workspace" });
  });

  it("拒绝访问未加入的项目", () => {
    expect(
      authorize(basePrincipal, "document.read", {
        workspaceId: "workspace-1",
        projectId: "project-2",
      }),
    ).toEqual({ allowed: false, reason: "outside_project_scope" });
  });

  it("任何 AI 都不能成为最终审批人", () => {
    const agent: Principal = {
      actorId: "agent-1",
      actorKind: "agent",
      actorStatus: "active",
      workspaceId: "workspace-1",
      projectIds: new Set(["project-1"]),
      grantedCapabilities: new Set(["approval.review"]),
    };
    expect(
      authorize(agent, "approval.review", {
        workspaceId: "workspace-1",
        projectId: "project-1",
      }),
    ).toEqual({ allowed: false, reason: "human_approval_required" });
  });

  it("AI 静态能力只取委托人、Agent、资源和工具策略交集", () => {
    const delegator = new Set<Capability>(["document.read", "document.edit", "agent.invoke"]);
    const agent = new Set<Capability>(["document.read", "document.edit"]);
    const resource = new Set<Capability>(["document.read", "document.edit"]);
    const tool = new Set<Capability>(["document.read"]);
    expect([...intersectCapabilities(delegator, agent, resource, tool)]).toEqual([
      "document.read",
    ]);
  });
});
