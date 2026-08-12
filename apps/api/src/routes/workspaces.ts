import {
  AcceptWorkspaceInvitationInputSchema,
  CreateWorkspaceInputSchema,
  CreateWorkspaceInvitationInputSchema,
  UpdateWorkspaceMemberRoleInputSchema,
} from "@haloai/contracts";
import { WorkspaceOnboardingRepository } from "@haloai/db";
import type { FastifyInstance } from "fastify";
import type { HaloAuth } from "../auth";
import type { ApiConfig } from "../config";
import { requireSession } from "../session";

function sessionUser(session: Awaited<ReturnType<typeof requireSession>>) {
  return { id: session.user.id, name: session.user.name, email: session.user.email };
}

export async function registerWorkspaceRoutes(
  app: FastifyInstance,
  auth: HaloAuth,
  repository: WorkspaceOnboardingRepository,
  config: ApiConfig,
): Promise<void> {
  app.get("/v1/session", async (request, reply) => {
    const session = await requireSession(auth, request);
    const workspaces = await repository.listWorkspacesForUser(session.user.id);
    reply.header("cache-control", "no-store");
    return {
      user: {
        id: session.user.id,
        name: session.user.name,
        email: session.user.email,
        image: session.user.image ?? null,
        locale: "zh-CN",
      },
      workspaces,
    };
  });

  app.post("/v1/workspaces", async (request, reply) => {
    const session = await requireSession(auth, request);
    const input = CreateWorkspaceInputSchema.parse(request.body);
    const workspace = await repository.createWorkspace({
      user: sessionUser(session),
      ...input,
      requestId: request.id,
    });
    return reply.status(201).send({ workspace });
  });

  app.get<{ Params: { workspaceId: string } }>(
    "/v1/workspaces/:workspaceId/members",
    async (request) => {
      const session = await requireSession(auth, request);
      const principal = await repository.resolveMembership(
        session.user.id,
        request.params.workspaceId,
      );
      const members = await repository.listMembers(session.user.id, principal, request.id);
      return { members };
    },
  );

  app.post<{ Params: { workspaceId: string } }>(
    "/v1/workspaces/:workspaceId/invitations",
    async (request, reply) => {
      const session = await requireSession(auth, request);
      const input = CreateWorkspaceInvitationInputSchema.parse(request.body);
      const principal = await repository.resolveMembership(
        session.user.id,
        request.params.workspaceId,
      );
      const invitation = await repository.createInvitation({
        principal,
        ...input,
        requestId: request.id,
      });
      return reply.status(201).send({
        invitation: {
          id: invitation.id,
          workspaceId: invitation.workspaceId,
          email: invitation.email,
          role: invitation.role,
          expiresAt: invitation.expiresAt.toISOString(),
          token: config.EXPOSE_DEVELOPMENT_INVITE_TOKENS ? invitation.token : undefined,
        },
      });
    },
  );

  app.post("/v1/invitations/accept", async (request) => {
    const session = await requireSession(auth, request);
    const input = AcceptWorkspaceInvitationInputSchema.parse(request.body);
    const workspace = await repository.acceptInvitation({
      user: sessionUser(session),
      token: input.token,
      requestId: request.id,
    });
    return { workspace };
  });

  app.patch<{ Params: { workspaceId: string; membershipId: string } }>(
    "/v1/workspaces/:workspaceId/members/:membershipId/role",
    async (request, reply) => {
      const session = await requireSession(auth, request);
      const input = UpdateWorkspaceMemberRoleInputSchema.parse(request.body);
      const principal = await repository.resolveMembership(
        session.user.id,
        request.params.workspaceId,
      );
      await repository.updateMemberRole({
        principal,
        membershipId: request.params.membershipId,
        role: input.role,
        requestId: request.id,
      });
      return reply.status(204).send();
    },
  );
}
