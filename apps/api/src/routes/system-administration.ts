import { randomUUID } from "node:crypto";
import {
  AcceptSystemTenantInvitationInputSchema,
  CreateSystemTenantInputSchema,
  SaveSystemModelInputSchema,
  SetSystemModelAllocationInputSchema,
  SystemPageQuerySchema,
  UpdateSystemSettingsInputSchema,
  UpdateSystemTenantInputSchema,
} from "@haloai/contracts";
import type { SystemAdministrationRepository } from "@haloai/db";
import type { FastifyInstance, FastifyRequest } from "fastify";
import type { HaloAuth } from "../auth";
import type { ApiConfig } from "../config";
import { HttpError } from "../http-error";
import type { ModelSecretCipher } from "../model-secret";
import type { SessionPolicy } from "../session-policy";
import { requireSession } from "../session";

async function requireSystemAdministrator(
  auth: HaloAuth,
  repository: SystemAdministrationRepository,
  request: FastifyRequest,
) {
  const session = await requireSession(auth, request);
  if (!(await repository.isSystemAdministrator(session.user.id))) {
    throw new HttpError("permission_denied", "errors.permissionDenied");
  }
  return session;
}

function serializeModelPage(
  page: Awaited<ReturnType<SystemAdministrationRepository["listModels"]>>,
) {
  return {
    ...page,
    items: page.items.map((model) => ({
      // 浏览器只接收配置状态；密文、IV 与认证标签均不越过 API 边界。
      ...model,
      createdAt: model.createdAt.toISOString(),
      updatedAt: model.updatedAt.toISOString(),
    })),
  };
}

/**
 * 平台路由每次请求都同时验证人员会话与独立平台授权。客户端传入的 workspaceId 只用于选择
 * 要管理的租户，跨租户读取与修改仍由数据库函数再次检查平台身份。
 */
export async function registerSystemAdministrationRoutes(
  app: FastifyInstance,
  auth: HaloAuth,
  repository: SystemAdministrationRepository,
  cipher: ModelSecretCipher,
  config: ApiConfig,
  sessionPolicy: SessionPolicy,
): Promise<void> {
  app.get<{ Params: { token: string } }>(
    "/v1/system/tenant-invitations/:token",
    { config: { rateLimit: { max: 30, timeWindow: "1 minute" } } },
    async (request, reply) => {
      const invitation = await repository.getTenantInvitation(request.params.token);
      reply.header("cache-control", "no-store");
      return { ...invitation, expiresAt: invitation.expiresAt.toISOString() };
    },
  );

  app.post(
    "/v1/system/tenant-invitations/accept",
    { config: { rateLimit: { max: 10, timeWindow: "1 minute" } } },
    async (request) => {
      const session = await requireSession(auth, request);
      const input = AcceptSystemTenantInvitationInputSchema.parse(request.body);
      const workspaceId = await repository.acceptTenantInvitation({
        userId: session.user.id,
        email: session.user.email,
        token: input.token,
      });
      return { workspaceId };
    },
  );

  app.get("/v1/system/access", async (request, reply) => {
    await requireSystemAdministrator(auth, repository, request);
    reply.header("cache-control", "no-store");
    return { allowed: true };
  });

  app.get("/v1/system/overview", async (request, reply) => {
    const session = await requireSystemAdministrator(auth, repository, request);
    reply.header("cache-control", "no-store");
    return repository.overview(session.user.id);
  });

  app.get("/v1/system/tenants", async (request, reply) => {
    const session = await requireSystemAdministrator(auth, repository, request);
    const query = SystemPageQuerySchema.parse(request.query);
    const page = await repository.listTenants(session.user.id, query);
    reply.header("cache-control", "no-store");
    return {
      ...page,
      items: page.items.map((tenant) => ({
        ...tenant,
        createdAt: tenant.createdAt.toISOString(),
      })),
    };
  });

  app.get<{ Params: { workspaceId: string } }>(
    "/v1/system/tenants/:workspaceId/members",
    async (request, reply) => {
      const session = await requireSystemAdministrator(auth, repository, request);
      const query = SystemPageQuerySchema.parse(request.query);
      const page = await repository.listTenantMembers(
        session.user.id,
        request.params.workspaceId,
        query,
      );
      reply.header("cache-control", "no-store");
      return {
        ...page,
        items: page.items.map((member) => ({
          ...member,
          joinedAt: member.joinedAt?.toISOString() ?? null,
        })),
      };
    },
  );

  app.post(
    "/v1/system/tenants",
    { config: { rateLimit: { max: 10, timeWindow: "1 minute" } } },
    async (request, reply) => {
      const session = await requireSystemAdministrator(auth, repository, request);
      const input = CreateSystemTenantInputSchema.parse(request.body);
      const result = await repository.createTenant(session.user.id, input);
      if (result.status === "created") return reply.status(201).send(result);
      return reply.status(202).send({
        status: result.status,
        invitationId: result.invitationId,
        expiresAt: result.expiresAt.toISOString(),
        activationToken: config.EXPOSE_DEVELOPMENT_INVITE_TOKENS
          ? result.activationToken
          : undefined,
      });
    },
  );

  app.patch<{ Params: { workspaceId: string } }>(
    "/v1/system/tenants/:workspaceId",
    { config: { rateLimit: { max: 30, timeWindow: "1 minute" } } },
    async (request, reply) => {
      const session = await requireSystemAdministrator(auth, repository, request);
      const input = UpdateSystemTenantInputSchema.parse(request.body);
      await repository.updateTenant(session.user.id, {
        id: request.params.workspaceId,
        ...input,
      });
      return reply.status(204).send();
    },
  );

  app.get("/v1/system/models", async (request, reply) => {
    const session = await requireSystemAdministrator(auth, repository, request);
    const query = SystemPageQuerySchema.parse(request.query);
    const page = await repository.listModels(session.user.id, query);
    reply.header("cache-control", "no-store");
    return serializeModelPage(page);
  });

  app.post(
    "/v1/system/models",
    { config: { rateLimit: { max: 20, timeWindow: "1 minute" } } },
    async (request, reply) => {
      await requireSystemAdministrator(auth, repository, request);
      const input = SaveSystemModelInputSchema.parse(request.body);
      const id = randomUUID();
      const encrypted = input.apiKey ? cipher.encrypt(id, input.apiKey) : {};
      await repository.createModel({
        id,
        name: input.name,
        provider: input.provider,
        apiFormat: input.apiFormat,
        remoteModelId: input.remoteModelId,
        baseUrl: input.baseUrl,
        contextWindow: input.contextWindow,
        status: input.status,
        ...encrypted,
      });
      return reply.status(201).send({ id });
    },
  );

  app.patch<{ Params: { modelId: string } }>(
    "/v1/system/models/:modelId",
    { config: { rateLimit: { max: 30, timeWindow: "1 minute" } } },
    async (request, reply) => {
      await requireSystemAdministrator(auth, repository, request);
      const input = SaveSystemModelInputSchema.parse(request.body);
      const encrypted = input.apiKey ? cipher.encrypt(request.params.modelId, input.apiKey) : {};
      await repository.updateModel(request.params.modelId, {
        name: input.name,
        provider: input.provider,
        apiFormat: input.apiFormat,
        remoteModelId: input.remoteModelId,
        baseUrl: input.baseUrl,
        contextWindow: input.contextWindow,
        status: input.status,
        ...encrypted,
      });
      return reply.status(204).send();
    },
  );

  app.put<{ Params: { modelId: string } }>(
    "/v1/system/models/:modelId/allocation",
    { config: { rateLimit: { max: 60, timeWindow: "1 minute" } } },
    async (request, reply) => {
      const session = await requireSystemAdministrator(auth, repository, request);
      const input = SetSystemModelAllocationInputSchema.parse(request.body);
      await repository.setModelAllocation(session.user.id, {
        modelId: request.params.modelId,
        ...input,
      });
      return reply.status(204).send();
    },
  );

  app.get("/v1/system/settings", async (request, reply) => {
    await requireSystemAdministrator(auth, repository, request);
    reply.header("cache-control", "no-store");
    return repository.getSettings({
      sessionExpiresInSeconds: config.AUTH_SESSION_EXPIRES_IN_SECONDS,
      sessionUpdateAgeSeconds: config.AUTH_SESSION_UPDATE_AGE_SECONDS,
    });
  });

  app.patch(
    "/v1/system/settings",
    { config: { rateLimit: { max: 20, timeWindow: "1 minute" } } },
    async (request, reply) => {
      await requireSystemAdministrator(auth, repository, request);
      const input = UpdateSystemSettingsInputSchema.parse(request.body);
      await repository.updateSettings({
        defaultLocale: input.defaultLocale,
        sessionExpiresInSeconds: input.authentication.sessionExpiresInSeconds,
        sessionUpdateAgeSeconds: input.authentication.sessionUpdateAgeSeconds,
        slidingRenewal: input.authentication.slidingRenewal,
      });
      sessionPolicy.replace({
        sessionExpiresInSeconds: input.authentication.sessionExpiresInSeconds,
        sessionUpdateAgeSeconds: input.authentication.sessionUpdateAgeSeconds,
        slidingRenewal: input.authentication.slidingRenewal,
      });
      return reply.status(204).send();
    },
  );
}
