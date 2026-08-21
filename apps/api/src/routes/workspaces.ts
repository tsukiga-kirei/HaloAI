import {
  AcceptWorkspaceInvitationInputSchema,
  ArchiveWorkspaceInputSchema,
  BatchUpdateMemberDepartmentInputSchema,
  CreateWorkspaceInputSchema,
  CreateWorkspaceInvitationInputSchema,
  SaveWorkspaceDepartmentInputSchema,
  TransferWorkspaceOwnershipInputSchema,
  UpdateWorkspaceMemberOrganizationInputSchema,
  UpdateWorkspaceMemberRoleInputSchema,
  UpdateWorkspaceSettingsInputSchema,
} from "@haloai/contracts";
import { WorkspaceOnboardingRepository } from "@haloai/db";
import type { FastifyInstance } from "fastify";
import type { HaloAuth } from "../auth";
import type { ApiConfig } from "../config";
import { requireSession } from "../session";

/**
 * 工作空间路由负责邀请、角色和部门。成员列表必须先经 Membership 过滤再分页，
 * 禁止把客户端传入的 workspaceId 当作已授权上下文。
 */
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
    const [workspaces, profile] = await Promise.all([
      repository.listWorkspacesForUser(session.user.id),
      repository.getUserProfile(session.user.id),
    ]);
    reply.header("cache-control", "no-store");
    return {
      user: {
        id: session.user.id,
        name: profile?.name ?? session.user.name,
        email: profile?.email ?? session.user.email,
        image: session.user.image ?? null,
        locale: profile?.preferredLocale ?? "zh-CN",
        timeZone: profile?.timeZone ?? "Asia/Shanghai",
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
          departmentId: invitation.departmentId,
          jobTitle: invitation.jobTitle,
          expiresAt: invitation.expiresAt.toISOString(),
          token: config.EXPOSE_DEVELOPMENT_INVITE_TOKENS ? invitation.token : undefined,
        },
      });
    },
  );

  app.get<{ Params: { workspaceId: string } }>(
    "/v1/workspaces/:workspaceId/organization",
    async (request) => {
      const session = await requireSession(auth, request);
      const principal = await repository.resolveMembership(
        session.user.id,
        request.params.workspaceId,
      );
      const [members, departments, workspaces] = await Promise.all([
        repository.listMembers(session.user.id, principal, request.id),
        repository.listDepartments(principal, request.id),
        repository.listWorkspacesForUser(session.user.id),
      ]);
      const workspace = workspaces.find((item) => item.id === principal.workspaceId);
      if (!workspace) throw new Error("workspace context disappeared");
      return {
        workspace: { id: workspace.id, name: workspace.name, slug: workspace.slug },
        members: members.map((member) => ({
          ...member,
          joinedAt: member.joinedAt?.toISOString() ?? null,
        })),
        departments,
      };
    },
  );

  app.post<{ Params: { workspaceId: string } }>(
    "/v1/workspaces/:workspaceId/departments",
    async (request, reply) => {
      const session = await requireSession(auth, request);
      const principal = await repository.resolveMembership(
        session.user.id,
        request.params.workspaceId,
      );
      const input = SaveWorkspaceDepartmentInputSchema.parse(request.body);
      const id = await repository.saveDepartment({ principal, ...input, requestId: request.id });
      return reply.status(201).send({ id });
    },
  );

  app.patch<{ Params: { workspaceId: string; departmentId: string } }>(
    "/v1/workspaces/:workspaceId/departments/:departmentId",
    async (request, reply) => {
      const session = await requireSession(auth, request);
      const principal = await repository.resolveMembership(
        session.user.id,
        request.params.workspaceId,
      );
      const input = SaveWorkspaceDepartmentInputSchema.parse(request.body);
      await repository.saveDepartment({
        principal,
        departmentId: request.params.departmentId,
        ...input,
        requestId: request.id,
      });
      return reply.status(204).send();
    },
  );

  app.patch<{ Params: { workspaceId: string; membershipId: string } }>(
    "/v1/workspaces/:workspaceId/members/:membershipId/organization",
    async (request, reply) => {
      const session = await requireSession(auth, request);
      const principal = await repository.resolveMembership(
        session.user.id,
        request.params.workspaceId,
      );
      const input = UpdateWorkspaceMemberOrganizationInputSchema.parse(request.body);
      await repository.updateMemberOrganization({
        principal,
        membershipId: request.params.membershipId,
        ...input,
        requestId: request.id,
      });
      return reply.status(204).send();
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

  app.patch<{ Params: { workspaceId: string } }>(
    "/v1/workspaces/:workspaceId/settings",
    async (request, reply) => {
      const session = await requireSession(auth, request);
      const input = UpdateWorkspaceSettingsInputSchema.parse(request.body);
      const principal = await repository.resolveMembership(
        session.user.id,
        request.params.workspaceId,
      );
      await repository.updateWorkspaceSettings({
        principal,
        name: input.name,
        timeZone: input.timeZone,
        defaultLocale: input.defaultLocale,
        requestId: request.id,
      });
      return reply.status(204).send();
    },
  );

  app.post<{ Params: { workspaceId: string } }>(
    "/v1/workspaces/:workspaceId/transfer-ownership",
    async (request, reply) => {
      const session = await requireSession(auth, request);
      const input = TransferWorkspaceOwnershipInputSchema.parse(request.body);
      const principal = await repository.resolveMembership(
        session.user.id,
        request.params.workspaceId,
      );
      await repository.transferWorkspaceOwnership({
        principal,
        targetMembershipId: input.targetMembershipId,
        requestId: request.id,
      });
      return reply.status(204).send();
    },
  );

  app.post<{ Params: { workspaceId: string } }>(
    "/v1/workspaces/:workspaceId/archive",
    async (request, reply) => {
      const session = await requireSession(auth, request);
      const input = ArchiveWorkspaceInputSchema.parse(request.body ?? {});
      const principal = await repository.resolveMembership(
        session.user.id,
        request.params.workspaceId,
      );
      await repository.archiveWorkspace({
        principal,
        reason: input.reason,
        requestId: request.id,
      });
      return reply.status(204).send();
    },
  );

  app.post<{ Params: { workspaceId: string } }>(
    "/v1/workspaces/:workspaceId/unarchive",
    async (request, reply) => {
      const session = await requireSession(auth, request);
      const principal = await repository.resolveMembership(
        session.user.id,
        request.params.workspaceId,
      );
      await repository.unarchiveWorkspace({
        principal,
        requestId: request.id,
      });
      return reply.status(204).send();
    },
  );

  app.patch<{ Params: { workspaceId: string } }>(
    "/v1/workspaces/:workspaceId/members/batch-department",
    async (request, reply) => {
      const session = await requireSession(auth, request);
      const input = BatchUpdateMemberDepartmentInputSchema.parse(request.body);
      const principal = await repository.resolveMembership(
        session.user.id,
        request.params.workspaceId,
      );
      await repository.batchUpdateMemberDepartment({
        principal,
        membershipIds: input.membershipIds,
        departmentId: input.departmentId,
        requestId: request.id,
      });
      return reply.status(204).send();
    },
  );
}
