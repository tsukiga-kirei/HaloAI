import {
  AssignMemberRolesInputSchema,
  ChangePasswordInputSchema,
  CreateCustomRoleInputSchema,
  UpdateCustomRoleInputSchema,
  UpdateSessionProfileInputSchema,
  UpdateWorkspaceMemberStatusInputSchema,
  WorkspaceAdminAccessQuerySchema,
  WorkspaceAllocatedModelListSchema,
  WorkspaceAuditQuerySchema,
  type WorkspaceAdminSection,
} from "@haloai/contracts";
import type { Capability } from "@haloai/core";
import {
  SystemAdministrationRepository,
  WorkspaceGovernanceRepository,
  WorkspaceOnboardingRepository,
} from "@haloai/db";
import type { FastifyInstance } from "fastify";
import type { HaloAuth } from "../auth";
import { fromNodeHeaders } from "better-auth/node";
import { HttpError } from "../http-error";
import { requireSession } from "../session";
import { requireWorkspaceCapability } from "../workspace-authorization";

const sectionCapabilities: Record<WorkspaceAdminSection, Capability> = {
  overview: "workspace.manage",
  members: "member.manage",
  roles: "workspace.manage",
  agents: "agent.profile.create",
  integrations: "workspace.manage",
  security: "workspace.security.manage",
  audit: "audit.read",
};

function toIso(value: Date): string {
  return value.toISOString();
}

export async function registerWorkspaceGovernanceRoutes(
  app: FastifyInstance,
  auth: HaloAuth,
  onboarding: WorkspaceOnboardingRepository,
  governance: WorkspaceGovernanceRepository,
  systemAdministration: SystemAdministrationRepository,
): Promise<void> {
  app.patch("/v1/session/profile", async (request) => {
    const session = await requireSession(auth, request);
    const input = UpdateSessionProfileInputSchema.parse(request.body);
    await auth.api.updateUser({
      body: { name: input.name },
      headers: fromNodeHeaders(request.headers),
    });
    await onboarding.updateUserProfile({
      userId: session.user.id,
      name: input.name,
      preferredLocale: input.preferredLocale,
      timeZone: input.timeZone,
      requestId: request.id,
    });
    const profile = await onboarding.getUserProfile(session.user.id);
    return {
      user: {
        id: session.user.id,
        name: profile?.name ?? input.name,
        email: session.user.email,
        locale: profile?.preferredLocale ?? "zh-CN",
        timeZone: profile?.timeZone ?? "Asia/Shanghai",
      },
    };
  });

  app.post(
    "/v1/session/change-password",
    { config: { rateLimit: { max: 5, timeWindow: "1 minute" } } },
    async (request, reply) => {
      const session = await requireSession(auth, request);
      const input = ChangePasswordInputSchema.parse(request.body);
      try {
        await auth.api.changePassword({
          body: {
            currentPassword: input.currentPassword,
            newPassword: input.newPassword,
            revokeOtherSessions: input.revokeOtherSessions,
          },
          headers: fromNodeHeaders(request.headers),
        });
        return reply.status(204).send();
      } catch (error) {
        throw new HttpError("validation_failed", "errors.invalidCredentials");
      }
    },
  );

  app.get<{ Params: { workspaceId: string } }>(
    "/v1/workspaces/:workspaceId/access",
    async (request) => {
      const session = await requireSession(auth, request);
      const query = WorkspaceAdminAccessQuerySchema.parse(request.query);
      const principal = await onboarding.resolveMembership(
        session.user.id,
        request.params.workspaceId,
      );
      requireWorkspaceCapability(principal, sectionCapabilities[query.section]);
      const workspaces = await onboarding.listWorkspacesForUser(session.user.id);
      const workspace = workspaces.find((item) => item.id === principal.workspaceId);
      return {
        allowed: true as const,
        role: principal.role,
        workspaceName: workspace?.name ?? "HaloAI",
      };
    },
  );

  app.get<{ Params: { workspaceId: string } }>(
    "/v1/workspaces/:workspaceId/audit",
    async (request) => {
      const session = await requireSession(auth, request);
      const query = WorkspaceAuditQuerySchema.parse(request.query);
      const principal = await onboarding.resolveMembership(
        session.user.id,
        request.params.workspaceId,
      );
      requireWorkspaceCapability(principal, "audit.read");
      const page = await governance.listAuditEvents({
        principal,
        requestId: request.id,
        page: query.page,
        pageSize: query.pageSize,
        ...(query.query === undefined ? {} : { query: query.query }),
        ...(query.outcome === undefined ? {} : { outcome: query.outcome }),
      });
      return {
        items: page.items.map((item) => ({
          ...item,
          occurredAt: toIso(item.occurredAt),
        })),
        page: query.page,
        pageSize: query.pageSize,
        total: page.total,
      };
    },
  );

  app.get<{ Params: { workspaceId: string } }>(
    "/v1/workspaces/:workspaceId/models",
    async (request) => {
      const session = await requireSession(auth, request);
      const principal = await onboarding.resolveMembership(
        session.user.id,
        request.params.workspaceId,
      );
      // 协作侧给 AI 选模型也要读这份目录；密钥密文列不会进入响应。
      requireWorkspaceCapability(principal, "agent.profile.read");
      const items = await governance.listAllocatedModels({
        principal,
        requestId: request.id,
      });
      return WorkspaceAllocatedModelListSchema.parse({
        items: items.map((item) => ({
          ...item,
          allocatedAt: toIso(item.allocatedAt),
        })),
      });
    },
  );

  app.get<{ Params: { workspaceId: string } }>(
    "/v1/workspaces/:workspaceId/security",
    async (request) => {
      const session = await requireSession(auth, request);
      const principal = await onboarding.resolveMembership(
        session.user.id,
        request.params.workspaceId,
      );
      requireWorkspaceCapability(principal, "workspace.security.manage");
      const settings = await systemAdministration.getSettings();
      return {
        session: {
          cookieProtected: true as const,
          expiresInSeconds: settings.authentication.sessionExpiresInSeconds,
          updateAgeSeconds: settings.authentication.sessionUpdateAgeSeconds,
          slidingRenewal: settings.authentication.slidingRenewal,
        },
        defaultLocale: settings.defaultLocale,
        highRiskApprovalRequired: true as const,
        rowLevelIsolation: true as const,
        systemBreakGlassRequired: true as const,
      };
    },
  );

  app.patch<{ Params: { workspaceId: string; membershipId: string } }>(
    "/v1/workspaces/:workspaceId/members/:membershipId/status",
    async (request, reply) => {
      const session = await requireSession(auth, request);
      const input = UpdateWorkspaceMemberStatusInputSchema.parse(request.body);
      const principal = await onboarding.resolveMembership(
        session.user.id,
        request.params.workspaceId,
      );
      requireWorkspaceCapability(principal, "member.manage");
      await onboarding.updateMemberStatus({
        principal,
        membershipId: request.params.membershipId,
        status: input.status,
        requestId: request.id,
      });
      return reply.status(204).send();
    },
  );

  // === 自定义角色与权限治理 ===
  app.get<{ Params: { workspaceId: string } }>(
    "/v1/workspaces/:workspaceId/roles",
    async (request) => {
      const session = await requireSession(auth, request);
      const principal = await onboarding.resolveMembership(
        session.user.id,
        request.params.workspaceId,
      );
      requireWorkspaceCapability(principal, "workspace.read");
      const roles = await governance.listRoles({
        principal,
        requestId: request.id,
      });
      return {
        items: roles.map((r) => ({
          ...r,
          createdAt: toIso(r.createdAt),
          updatedAt: toIso(r.updatedAt),
        })),
      };
    },
  );

  app.post<{ Params: { workspaceId: string } }>(
    "/v1/workspaces/:workspaceId/roles",
    async (request, reply) => {
      const session = await requireSession(auth, request);
      const principal = await onboarding.resolveMembership(
        session.user.id,
        request.params.workspaceId,
      );
      requireWorkspaceCapability(principal, "workspace.manage");
      const input = CreateCustomRoleInputSchema.parse(request.body);
      const role = await governance.createRole({
        principal,
        requestId: request.id,
        key: input.key,
        name: input.name,
        description: input.description,
        capabilities: input.capabilities,
      });
      return reply.status(201).send({
        role: {
          ...role,
          createdAt: toIso(role.createdAt),
          updatedAt: toIso(role.updatedAt),
        },
      });
    },
  );

  app.patch<{ Params: { workspaceId: string; roleId: string } }>(
    "/v1/workspaces/:workspaceId/roles/:roleId",
    async (request, reply) => {
      const session = await requireSession(auth, request);
      const principal = await onboarding.resolveMembership(
        session.user.id,
        request.params.workspaceId,
      );
      requireWorkspaceCapability(principal, "workspace.manage");
      const input = UpdateCustomRoleInputSchema.parse(request.body);
      await governance.updateRole({
        principal,
        requestId: request.id,
        roleId: request.params.roleId,
        name: input.name,
        description: input.description,
        capabilities: input.capabilities,
        status: input.status,
      });
      return reply.status(204).send();
    },
  );

  app.delete<{ Params: { workspaceId: string; roleId: string } }>(
    "/v1/workspaces/:workspaceId/roles/:roleId",
    async (request, reply) => {
      const session = await requireSession(auth, request);
      const principal = await onboarding.resolveMembership(
        session.user.id,
        request.params.workspaceId,
      );
      requireWorkspaceCapability(principal, "workspace.manage");
      await governance.deleteRole({
        principal,
        requestId: request.id,
        roleId: request.params.roleId,
      });
      return reply.status(204).send();
    },
  );

  // === 成员自定义角色绑定 ===
  app.get<{ Params: { workspaceId: string; actorId: string } }>(
    "/v1/workspaces/:workspaceId/members/:actorId/roles",
    async (request) => {
      const session = await requireSession(auth, request);
      const principal = await onboarding.resolveMembership(
        session.user.id,
        request.params.workspaceId,
      );
      requireWorkspaceCapability(principal, "member.manage");
      const roleIds = await governance.listMemberRoles({
        principal,
        requestId: request.id,
        memberActorId: request.params.actorId,
      });
      return { roleIds };
    },
  );

  app.put<{ Params: { workspaceId: string; actorId: string } }>(
    "/v1/workspaces/:workspaceId/members/:actorId/roles",
    async (request, reply) => {
      const session = await requireSession(auth, request);
      const principal = await onboarding.resolveMembership(
        session.user.id,
        request.params.workspaceId,
      );
      requireWorkspaceCapability(principal, "member.manage");
      const input = AssignMemberRolesInputSchema.parse(request.body);
      await governance.assignMemberRoles({
        principal,
        requestId: request.id,
        memberActorId: request.params.actorId,
        roleIds: input.roleIds,
      });
      return reply.status(204).send();
    },
  );
}
