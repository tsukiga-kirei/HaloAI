import {
  AddProjectMemberInputSchema,
  AddRoomMemberInputSchema,
  CreateDocumentInputSchema,
  CreateProjectInputSchema,
  CreateRoomInputSchema,
  UpdateDocumentInputSchema,
} from "@haloai/contracts";
import {
  CollaborationRepository,
  type DatabaseClient,
  type DocumentView,
  type MembershipContext,
  type ProjectMemberView,
  type ProjectWithRole,
  type RoomWithParticipantCount,
  type StoredDocument,
  type StoredProject,
  type StoredRoom,
  withWorkspaceTransaction,
  WorkspaceOnboardingRepository,
} from "@haloai/db";
import type { FastifyInstance, FastifyRequest } from "fastify";
import type { HaloAuth } from "../auth";
import { requireSession } from "../session";

export type CollaborationRepositoryExecutor = <T>(
  request: FastifyRequest,
  workspaceId: string,
  operation: (repository: CollaborationRepository, principal: MembershipContext) => Promise<T>,
) => Promise<T>;

function serializeProject(
  project: ProjectWithRole | (StoredProject & { currentActorRole: "lead" }),
) {
  return {
    id: project.id,
    workspaceId: project.workspaceId,
    name: project.name,
    description: project.description,
    goal: project.goal,
    expectedArtifact: project.expectedArtifact,
    completionCriteria: project.completionCriteria,
    status: project.status,
    currentActorRole: project.currentActorRole,
    createdAt: project.createdAt.toISOString(),
    updatedAt: project.updatedAt.toISOString(),
  };
}

function serializeRoom(
  room: RoomWithParticipantCount | (StoredRoom & { participantCount: number }),
) {
  return {
    id: room.id,
    workspaceId: room.workspaceId,
    projectId: room.projectId,
    name: room.name,
    goal: room.goal,
    expectedArtifact: room.expectedArtifact,
    completionCriteria: room.completionCriteria,
    visibility: room.visibility,
    status: room.status,
    collaborationMode: room.collaborationMode,
    participantCount: room.participantCount,
    createdAt: room.createdAt.toISOString(),
    updatedAt: room.updatedAt.toISOString(),
  };
}

function serializeProjectMember(member: ProjectMemberView) {
  return {
    id: member.id,
    actorId: member.actorId,
    displayName: member.displayName,
    role: member.role,
    status: member.status === "invited" ? "suspended" : member.status,
    joinedAt: member.joinedAt.toISOString(),
  };
}

function serializeDocument(
  document: DocumentView | (StoredDocument & { ownerDisplayName: string }),
) {
  return {
    id: document.id,
    workspaceId: document.workspaceId,
    projectId: document.projectId,
    roomId: document.roomId,
    ownerActorId: document.ownerActorId,
    ownerDisplayName: document.ownerDisplayName,
    title: document.title,
    status: document.status === "deleted" ? "archived" : document.status,
    createdAt: document.createdAt.toISOString(),
    updatedAt: document.updatedAt.toISOString(),
  };
}

export async function registerCollaborationRoutes(
  app: FastifyInstance,
  auth: HaloAuth,
  database: DatabaseClient,
  onboardingRepository: WorkspaceOnboardingRepository,
  repositoryExecutor?: CollaborationRepositoryExecutor,
): Promise<void> {
  const execute: CollaborationRepositoryExecutor =
    repositoryExecutor ??
    async function execute<T>(
      request: FastifyRequest,
      workspaceId: string,
      operation: (repository: CollaborationRepository, principal: MembershipContext) => Promise<T>,
    ): Promise<T> {
      const session = await requireSession(auth, request);
      const principal = await onboardingRepository.resolveMembership(session.user.id, workspaceId);
      return withWorkspaceTransaction(
        database.db,
        {
          workspaceId: principal.workspaceId,
          actorId: principal.actorId,
          requestId: request.id,
        },
        (transaction) =>
          operation(
            new CollaborationRepository(
              transaction,
              principal.workspaceId,
              principal.actorId,
              principal.role,
            ),
            principal,
          ),
      );
    };

  app.get<{ Params: { workspaceId: string } }>(
    "/v1/workspaces/:workspaceId/collaboration",
    async (request, reply) => {
      const snapshot = await execute(request, request.params.workspaceId, async (repository) => {
        const projects = await repository.listProjects();
        const rooms = await repository.listRooms();
        const documents = await repository.listDocuments();
        return {
          projects: projects.map(serializeProject),
          rooms: rooms.map(serializeRoom),
          documents: documents.map(serializeDocument),
        };
      });
      reply.header("cache-control", "no-store");
      return snapshot;
    },
  );

  app.post<{ Params: { workspaceId: string } }>(
    "/v1/workspaces/:workspaceId/projects",
    async (request, reply) => {
      const input = CreateProjectInputSchema.parse(request.body);
      const project = await execute(request, request.params.workspaceId, async (repository) => {
        const created = await repository.createProject(input);
        return serializeProject({ ...created, currentActorRole: "lead" });
      });
      return reply.status(201).send({ project });
    },
  );

  app.get<{ Params: { workspaceId: string; projectId: string } }>(
    "/v1/workspaces/:workspaceId/projects/:projectId/members",
    async (request) => {
      const members = await execute(request, request.params.workspaceId, (repository) =>
        repository.listProjectMembers(request.params.projectId),
      );
      return { members: members.map(serializeProjectMember) };
    },
  );

  app.post<{ Params: { workspaceId: string; projectId: string } }>(
    "/v1/workspaces/:workspaceId/projects/:projectId/members",
    async (request, reply) => {
      const input = AddProjectMemberInputSchema.parse(request.body);
      const member = await execute(request, request.params.workspaceId, async (repository) => {
        await repository.addProjectMember(request.params.projectId, input.actorId, input.role);
        const members = await repository.listProjectMembers(request.params.projectId);
        const created = members.find((item) => item.actorId === input.actorId);
        if (!created) throw new Error("project member projection missing after insert");
        return serializeProjectMember(created);
      });
      return reply.status(201).send({ member });
    },
  );

  app.post<{ Params: { workspaceId: string; projectId: string } }>(
    "/v1/workspaces/:workspaceId/projects/:projectId/rooms",
    async (request, reply) => {
      const input = CreateRoomInputSchema.parse(request.body);
      const room = await execute(request, request.params.workspaceId, async (repository) => {
        const created = await repository.createRoom({
          projectId: request.params.projectId,
          ...input,
        });
        return serializeRoom({ ...created, participantCount: 1 });
      });
      return reply.status(201).send({ room });
    },
  );

  app.post<{ Params: { workspaceId: string; roomId: string } }>(
    "/v1/workspaces/:workspaceId/rooms/:roomId/members",
    async (request, reply) => {
      const input = AddRoomMemberInputSchema.parse(request.body);
      await execute(request, request.params.workspaceId, (repository) =>
        repository.addRoomMember(request.params.roomId, input.actorId),
      );
      return reply.status(204).send();
    },
  );

  app.post<{ Params: { workspaceId: string; projectId: string } }>(
    "/v1/workspaces/:workspaceId/projects/:projectId/documents",
    async (request, reply) => {
      const input = CreateDocumentInputSchema.parse(request.body);
      const document = await execute(request, request.params.workspaceId, async (repository) =>
        serializeDocument(
          await repository.createDocument({
            projectId: request.params.projectId,
            title: input.title,
            ...(input.roomId === undefined ? {} : { roomId: input.roomId }),
          }),
        ),
      );
      return reply.status(201).send({ document });
    },
  );

  app.patch<{ Params: { workspaceId: string; documentId: string } }>(
    "/v1/workspaces/:workspaceId/documents/:documentId",
    async (request) => {
      const input = UpdateDocumentInputSchema.parse(request.body);
      const document = await execute(request, request.params.workspaceId, async (repository) =>
        serializeDocument(
          await repository.updateDocument(request.params.documentId, {
            ...(input.title === undefined ? {} : { title: input.title }),
            ...(input.status === undefined ? {} : { status: input.status }),
          }),
        ),
      );
      return { document };
    },
  );
}
