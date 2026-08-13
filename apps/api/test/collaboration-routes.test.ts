import Fastify from "fastify";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { CollaborationRepository, MembershipContext } from "@haloai/db";
import type { HaloAuth } from "../src/auth";
import { handleError } from "../src/errors";
import {
  registerCollaborationRoutes,
  type CollaborationRepositoryExecutor,
} from "../src/routes/collaboration";

const workspaceId = crypto.randomUUID();
const actorId = crypto.randomUUID();
const projectId = crypto.randomUUID();
const now = new Date("2026-08-13T08:00:00.000Z");
const principal: MembershipContext = {
  workspaceId,
  actorId,
  membershipId: crypto.randomUUID(),
  role: "owner",
};

function fakeAuth(): HaloAuth {
  return {
    api: {
      getSession: vi.fn(async () => ({
        user: { id: crypto.randomUUID(), name: "Owner", email: "owner@example.com" },
        session: { id: crypto.randomUUID() },
      })),
    },
  } as unknown as HaloAuth;
}

describe("非 AI 协作路由", () => {
  let app = Fastify({ logger: false });

  afterEach(async () => {
    await app.close();
    app = Fastify({ logger: false });
  });

  it("返回只包含当前工作区授权投影的协作快照", async () => {
    const repository = {
      listProjects: vi.fn(async () => [
        {
          id: projectId,
          workspaceId,
          name: "Alpha",
          description: "",
          goal: "",
          expectedArtifact: "",
          completionCriteria: "",
          status: "active",
          createdByActorId: actorId,
          archivedAt: null,
          createdAt: now,
          updatedAt: now,
          currentActorRole: "lead",
        },
      ]),
      listRooms: vi.fn(async () => []),
      listDocuments: vi.fn(async () => []),
    } as unknown as CollaborationRepository;
    const execute: CollaborationRepositoryExecutor = async (
      _request,
      scopedWorkspaceId,
      operation,
    ) => {
      expect(scopedWorkspaceId).toBe(workspaceId);
      return operation(repository, principal);
    };
    app.setErrorHandler(handleError);
    await registerCollaborationRoutes(app, fakeAuth(), {} as never, {} as never, execute);

    const response = await app.inject({
      method: "GET",
      url: `/v1/workspaces/${workspaceId}/collaboration`,
    });
    expect(response.statusCode).toBe(200);
    expect(response.headers["cache-control"]).toBe("no-store");
    expect(response.json()).toMatchObject({
      projects: [{ id: projectId, currentActorRole: "lead" }],
      rooms: [],
      documents: [],
    });
  });

  it("拒绝请求体伪造 workspaceId 和 actorId", async () => {
    const createProject = vi.fn();
    const repository = { createProject } as unknown as CollaborationRepository;
    const execute: CollaborationRepositoryExecutor = (_request, _workspaceId, operation) =>
      operation(repository, principal);
    app.setErrorHandler(handleError);
    await registerCollaborationRoutes(app, fakeAuth(), {} as never, {} as never, execute);

    const response = await app.inject({
      method: "POST",
      url: `/v1/workspaces/${workspaceId}/projects`,
      payload: { name: "Injected", workspaceId: crypto.randomUUID(), actorId: crypto.randomUUID() },
    });
    expect(response.statusCode).toBe(400);
    expect(response.json()).toMatchObject({ error: { code: "VALIDATION_FAILED" } });
    expect(createProject).not.toHaveBeenCalled();
  });

  it("创建项目时只把校验后的业务字段交给 Repository", async () => {
    const createProject = vi.fn(async (input) => ({
      id: projectId,
      workspaceId,
      createdByActorId: actorId,
      status: "active" as const,
      archivedAt: null,
      createdAt: now,
      updatedAt: now,
      ...input,
    }));
    const repository = { createProject } as unknown as CollaborationRepository;
    const execute: CollaborationRepositoryExecutor = (_request, scopedWorkspaceId, operation) => {
      expect(scopedWorkspaceId).toBe(workspaceId);
      return operation(repository, principal);
    };
    app.setErrorHandler(handleError);
    await registerCollaborationRoutes(app, fakeAuth(), {} as never, {} as never, execute);

    const response = await app.inject({
      method: "POST",
      url: `/v1/workspaces/${workspaceId}/projects`,
      payload: { name: "Durable Alpha" },
    });
    expect(response.statusCode).toBe(201);
    expect(response.json()).toMatchObject({
      project: { id: projectId, workspaceId, name: "Durable Alpha", currentActorRole: "lead" },
    });
    expect(createProject).toHaveBeenCalledWith({
      name: "Durable Alpha",
      description: "",
      goal: "",
      expectedArtifact: "",
      completionCriteria: "",
    });
  });
});
