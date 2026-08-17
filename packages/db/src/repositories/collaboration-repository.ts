import { and, asc, desc, eq, inArray, lt } from "drizzle-orm";
import { canonicalJson, sha256Digest } from "../canonical-json";
import { PersistenceError } from "../errors";
import type { MessagePart } from "../schema/common";
import {
  actors,
  documents,
  messages,
  projectMemberships,
  projects,
  roomMemberships,
  rooms,
  workspaceMemberships,
} from "../schema/index";
import { assertUuid, type WorkspaceTransaction } from "../workspace-transaction";

export type StoredProject = typeof projects.$inferSelect;
export type StoredRoom = typeof rooms.$inferSelect;
export type StoredActor = typeof actors.$inferSelect;
export type StoredMessage = typeof messages.$inferSelect;
export type StoredProjectMembership = typeof projectMemberships.$inferSelect;
export type StoredRoomMembership = typeof roomMemberships.$inferSelect;
export type StoredDocument = typeof documents.$inferSelect;
export type WorkspaceAccessRole = "owner" | "admin" | "member" | "guest";
export type ProjectRole = "lead" | "contributor" | "reviewer" | "observer";

export interface CreateProjectInput {
  readonly name: string;
  readonly description?: string;
  readonly goal?: string;
  readonly expectedArtifact?: string;
  readonly completionCriteria?: string;
}

export interface CreateRoomInput {
  readonly projectId: string;
  readonly name: string;
  readonly goal?: string;
  readonly expectedArtifact?: string;
  readonly completionCriteria?: string;
  readonly visibility?: "workspace" | "private";
}

export interface CreateDocumentInput {
  readonly projectId: string;
  readonly roomId?: string;
  readonly title: string;
}

export interface UpdateDocumentInput {
  readonly title?: string;
  readonly status?: "active" | "archived";
}

export interface ProjectWithRole extends StoredProject {
  readonly currentActorRole: ProjectRole | null;
}

export interface RoomWithParticipantCount extends StoredRoom {
  readonly participantCount: number;
}

export interface ProjectMemberView extends StoredProjectMembership {
  readonly displayName: string;
}

export interface DocumentView extends StoredDocument {
  readonly ownerDisplayName: string;
}

export interface AppendMessageInput {
  readonly roomId: string;
  readonly clientMutationId: string;
  readonly parts: readonly MessagePart[];
  readonly kind?: "text" | "rich_text" | "system" | "agent_response" | "action_card";
  readonly replyToMessageId?: string;
  readonly threadRootId?: string;
}

export interface AppendMessageResult {
  readonly message: StoredMessage;
  readonly deduplicated: boolean;
}

export interface MessagePage {
  readonly items: readonly StoredMessage[];
  readonly nextBeforeSequence?: number;
}

function requireText(value: string, field: string, maxLength: number): string {
  const normalized = value.trim();
  if (!normalized || normalized.length > maxLength) {
    throw new PersistenceError(
      "invalid_input",
      `${field} 不能为空且长度不能超过 ${maxLength} 个字符`,
    );
  }
  return normalized;
}

function requireMessageParts(parts: readonly MessagePart[]): MessagePart[] {
  if (parts.length === 0 || parts.length > 50) {
    throw new PersistenceError("invalid_input", "消息必须包含 1 至 50 个结构化内容块");
  }
  const mutableParts = parts.map((part) => ({ ...part, data: { ...part.data } }));
  const byteLength = Buffer.byteLength(canonicalJson(mutableParts), "utf8");
  if (byteLength > 64 * 1024) {
    throw new PersistenceError("invalid_input", "单条消息结构化内容不能超过 64 KiB");
  }
  return mutableParts;
}

/**
 * Repository 只接收已写入工作空间与 Actor 上下文的事务。workspaceId 和 authorActorId
 * 永远来自服务端上下文，不接受请求体传值，避免出现“SQL 有过滤但写入使用了伪造租户”的漏洞。
 */
export class CollaborationRepository {
  constructor(
    private readonly transaction: WorkspaceTransaction,
    private readonly workspaceId: string,
    private readonly actorId: string,
    private readonly workspaceRole: WorkspaceAccessRole,
  ) {
    assertUuid(workspaceId, "workspaceId");
    assertUuid(actorId, "actorId");
  }

  private isWorkspaceManager(): boolean {
    return this.workspaceRole === "owner" || this.workspaceRole === "admin";
  }

  private async requireActiveWorkspaceMember(): Promise<void> {
    const [membership] = await this.transaction
      .select({ id: workspaceMemberships.id })
      .from(workspaceMemberships)
      .where(
        and(
          eq(workspaceMemberships.workspaceId, this.workspaceId),
          eq(workspaceMemberships.humanActorId, this.actorId),
          eq(workspaceMemberships.status, "active"),
        ),
      )
      .limit(1);
    if (!membership) throw new PersistenceError("access_denied", "当前成员无权操作该工作空间");
  }

  private async requireActiveProjectMember(projectId: string): Promise<StoredProjectMembership> {
    const [membership] = await this.transaction
      .select()
      .from(projectMemberships)
      .where(
        and(
          eq(projectMemberships.workspaceId, this.workspaceId),
          eq(projectMemberships.projectId, projectId),
          eq(projectMemberships.actorId, this.actorId),
          eq(projectMemberships.status, "active"),
        ),
      )
      .limit(1);
    if (!membership) throw new PersistenceError("access_denied", "当前成员无权操作该项目");
    return membership;
  }

  private async requireProjectWrite(projectId: string): Promise<StoredProjectMembership | null> {
    const membership = await this.requireActiveProjectMember(projectId);
    if (membership.role !== "lead" && membership.role !== "contributor") {
      throw new PersistenceError("access_denied", "当前项目角色没有写入权限");
    }
    return membership;
  }

  private async requireProjectManage(projectId: string): Promise<void> {
    const [project] = await this.transaction
      .select({ id: projects.id })
      .from(projects)
      .where(and(eq(projects.workspaceId, this.workspaceId), eq(projects.id, projectId)))
      .limit(1);
    if (!project) throw new PersistenceError("not_found", "项目不存在");
    if (this.isWorkspaceManager()) return;
    const membership = await this.requireActiveProjectMember(projectId);
    if (membership.role !== "lead") {
      throw new PersistenceError("access_denied", "只有项目负责人可以管理项目成员");
    }
  }

  private async requireActiveRoomMember(roomId: string): Promise<void> {
    const [membership] = await this.transaction
      .select({ id: roomMemberships.id })
      .from(roomMemberships)
      .where(
        and(
          eq(roomMemberships.workspaceId, this.workspaceId),
          eq(roomMemberships.roomId, roomId),
          eq(roomMemberships.actorId, this.actorId),
          eq(roomMemberships.status, "active"),
        ),
      )
      .limit(1);
    if (!membership) throw new PersistenceError("access_denied", "当前成员无权访问该房间");
  }

  async createProject(input: CreateProjectInput): Promise<StoredProject> {
    await this.requireActiveWorkspaceMember();
    if (!this.isWorkspaceManager()) {
      throw new PersistenceError("access_denied", "只有工作区所有者或管理员可以创建项目");
    }
    const [project] = await this.transaction
      .insert(projects)
      .values({
        workspaceId: this.workspaceId,
        createdByActorId: this.actorId,
        name: requireText(input.name, "项目名称", 200),
        description: input.description?.trim() ?? "",
        goal: input.goal?.trim() ?? "",
        expectedArtifact: input.expectedArtifact?.trim() ?? "",
        completionCriteria: input.completionCriteria?.trim() ?? "",
      })
      .returning();
    if (!project) throw new PersistenceError("conflict", "项目创建后未返回记录");

    await this.transaction.insert(projectMemberships).values({
      workspaceId: this.workspaceId,
      projectId: project.id,
      actorId: this.actorId,
      role: "lead",
      addedByActorId: this.actorId,
      status: "active",
    });
    return project;
  }

  async createRoom(input: CreateRoomInput): Promise<StoredRoom> {
    assertUuid(input.projectId, "projectId");
    await this.requireProjectWrite(input.projectId);
    const [room] = await this.transaction
      .insert(rooms)
      .values({
        workspaceId: this.workspaceId,
        projectId: input.projectId,
        createdByActorId: this.actorId,
        name: requireText(input.name, "房间名称", 200),
        goal: input.goal?.trim() ?? "",
        expectedArtifact: input.expectedArtifact?.trim() ?? "",
        completionCriteria: input.completionCriteria?.trim() ?? "",
        visibility: input.visibility ?? "private",
      })
      .returning();
    if (!room) throw new PersistenceError("conflict", "房间创建后未返回记录");

    await this.transaction.insert(roomMemberships).values({
      workspaceId: this.workspaceId,
      roomId: room.id,
      actorId: this.actorId,
      addedByActorId: this.actorId,
      status: "active",
    });
    return room;
  }

  async listActors(): Promise<StoredActor[]> {
    await this.requireActiveWorkspaceMember();
    return this.transaction
      .select()
      .from(actors)
      .where(eq(actors.workspaceId, this.workspaceId))
      .orderBy(asc(actors.createdAt));
  }

  async listProjects(): Promise<ProjectWithRole[]> {
    await this.requireActiveWorkspaceMember();
    const memberships = await this.transaction
      .select()
      .from(projectMemberships)
      .where(
        and(
          eq(projectMemberships.workspaceId, this.workspaceId),
          eq(projectMemberships.actorId, this.actorId),
          eq(projectMemberships.status, "active"),
        ),
      );
    const roleByProject = new Map(memberships.map((item) => [item.projectId, item.role]));
    const filters = [eq(projects.workspaceId, this.workspaceId)];
    if (!this.isWorkspaceManager()) {
      const projectIds = memberships.map((item) => item.projectId);
      if (projectIds.length === 0) return [];
      filters.push(inArray(projects.id, projectIds));
    }
    const rows = await this.transaction
      .select()
      .from(projects)
      .where(and(...filters))
      .orderBy(asc(projects.createdAt));
    return rows.map((project) => ({
      ...project,
      currentActorRole: roleByProject.get(project.id) ?? null,
    }));
  }

  async addProjectMember(
    projectId: string,
    actorId: string,
    role: ProjectRole,
  ): Promise<StoredProjectMembership> {
    assertUuid(projectId, "projectId");
    assertUuid(actorId, "actorId");
    await this.requireProjectManage(projectId);
    const [workspaceMember] = await this.transaction
      .select({ actorId: workspaceMemberships.humanActorId })
      .from(workspaceMemberships)
      .where(
        and(
          eq(workspaceMemberships.workspaceId, this.workspaceId),
          eq(workspaceMemberships.humanActorId, actorId),
          eq(workspaceMemberships.status, "active"),
        ),
      )
      .limit(1);
    if (!workspaceMember) {
      throw new PersistenceError("access_denied", "目标人员不是当前工作区的活跃成员");
    }
    const [membership] = await this.transaction
      .insert(projectMemberships)
      .values({
        workspaceId: this.workspaceId,
        projectId,
        actorId,
        role,
        status: "active",
        addedByActorId: this.actorId,
        leftAt: null,
      })
      .onConflictDoUpdate({
        target: [
          projectMemberships.workspaceId,
          projectMemberships.projectId,
          projectMemberships.actorId,
        ],
        set: { role, status: "active", leftAt: null, updatedAt: new Date() },
      })
      .returning();
    if (!membership) throw new PersistenceError("conflict", "项目成员写入后未返回记录");
    return membership;
  }

  async listProjectMembers(projectId: string): Promise<ProjectMemberView[]> {
    assertUuid(projectId, "projectId");
    if (this.isWorkspaceManager()) await this.requireProjectManage(projectId);
    else await this.requireActiveProjectMember(projectId);
    return this.transaction
      .select({
        id: projectMemberships.id,
        workspaceId: projectMemberships.workspaceId,
        projectId: projectMemberships.projectId,
        actorId: projectMemberships.actorId,
        role: projectMemberships.role,
        status: projectMemberships.status,
        addedByActorId: projectMemberships.addedByActorId,
        joinedAt: projectMemberships.joinedAt,
        leftAt: projectMemberships.leftAt,
        createdAt: projectMemberships.createdAt,
        updatedAt: projectMemberships.updatedAt,
        displayName: actors.displayName,
      })
      .from(projectMemberships)
      .innerJoin(
        actors,
        and(
          eq(actors.workspaceId, projectMemberships.workspaceId),
          eq(actors.id, projectMemberships.actorId),
        ),
      )
      .where(
        and(
          eq(projectMemberships.workspaceId, this.workspaceId),
          eq(projectMemberships.projectId, projectId),
        ),
      )
      .orderBy(asc(projectMemberships.createdAt));
  }

  async addRoomMember(roomId: string, actorId: string): Promise<StoredRoomMembership> {
    assertUuid(roomId, "roomId");
    assertUuid(actorId, "actorId");
    const [room] = await this.transaction
      .select({ projectId: rooms.projectId })
      .from(rooms)
      .where(and(eq(rooms.workspaceId, this.workspaceId), eq(rooms.id, roomId)))
      .limit(1);
    if (!room) throw new PersistenceError("not_found", "房间不存在");
    await this.requireProjectManage(room.projectId);
    const [projectMember] = await this.transaction
      .select({ id: projectMemberships.id })
      .from(projectMemberships)
      .where(
        and(
          eq(projectMemberships.workspaceId, this.workspaceId),
          eq(projectMemberships.projectId, room.projectId),
          eq(projectMemberships.actorId, actorId),
          eq(projectMemberships.status, "active"),
        ),
      )
      .limit(1);
    if (!projectMember) {
      throw new PersistenceError("access_denied", "加入房间前必须先成为项目成员");
    }
    const [membership] = await this.transaction
      .insert(roomMemberships)
      .values({
        workspaceId: this.workspaceId,
        roomId,
        actorId,
        addedByActorId: this.actorId,
        status: "active",
        leftAt: null,
      })
      .onConflictDoUpdate({
        target: [roomMemberships.workspaceId, roomMemberships.roomId, roomMemberships.actorId],
        set: { status: "active", leftAt: null, updatedAt: new Date() },
      })
      .returning();
    if (!membership) throw new PersistenceError("conflict", "房间成员写入后未返回记录");
    return membership;
  }

  async listRooms(): Promise<RoomWithParticipantCount[]> {
    const authorizedProjects = await this.listProjects();
    const projectIds = authorizedProjects.map((project) => project.id);
    if (projectIds.length === 0) return [];
    const actorMemberships = await this.transaction
      .select({ roomId: roomMemberships.roomId })
      .from(roomMemberships)
      .where(
        and(
          eq(roomMemberships.workspaceId, this.workspaceId),
          eq(roomMemberships.actorId, this.actorId),
          eq(roomMemberships.status, "active"),
        ),
      );
    const actorRoomIds = new Set(actorMemberships.map((item) => item.roomId));
    const roomRows = await this.transaction
      .select()
      .from(rooms)
      .where(and(eq(rooms.workspaceId, this.workspaceId), inArray(rooms.projectId, projectIds)))
      .orderBy(asc(rooms.createdAt));
    const visibleRooms = roomRows.filter(
      (room) => room.visibility === "workspace" || actorRoomIds.has(room.id),
    );
    if (visibleRooms.length === 0) return [];
    const memberships = await this.transaction
      .select({ roomId: roomMemberships.roomId })
      .from(roomMemberships)
      .where(
        and(
          eq(roomMemberships.workspaceId, this.workspaceId),
          inArray(
            roomMemberships.roomId,
            visibleRooms.map((room) => room.id),
          ),
          eq(roomMemberships.status, "active"),
        ),
      );
    const countByRoom = new Map<string, number>();
    for (const membership of memberships) {
      countByRoom.set(membership.roomId, (countByRoom.get(membership.roomId) ?? 0) + 1);
    }
    return visibleRooms.map((room) => ({
      ...room,
      participantCount: countByRoom.get(room.id) ?? 0,
    }));
  }

  async createDocument(input: CreateDocumentInput): Promise<DocumentView> {
    assertUuid(input.projectId, "projectId");
    await this.requireProjectWrite(input.projectId);
    if (input.roomId !== undefined) {
      assertUuid(input.roomId, "roomId");
      const [room] = await this.transaction
        .select({ projectId: rooms.projectId, visibility: rooms.visibility })
        .from(rooms)
        .where(and(eq(rooms.workspaceId, this.workspaceId), eq(rooms.id, input.roomId)))
        .limit(1);
      if (!room || room.projectId !== input.projectId) {
        throw new PersistenceError("not_found", "房间不存在或不属于指定项目");
      }
      if (room.visibility === "private") await this.requireActiveRoomMember(input.roomId);
    }
    const [document] = await this.transaction
      .insert(documents)
      .values({
        workspaceId: this.workspaceId,
        projectId: input.projectId,
        ...(input.roomId === undefined ? {} : { roomId: input.roomId }),
        ownerActorId: this.actorId,
        title: requireText(input.title, "文档标题", 300),
      })
      .returning();
    if (!document) throw new PersistenceError("conflict", "文档创建后未返回记录");
    const [owner] = await this.transaction
      .select({ displayName: actors.displayName })
      .from(actors)
      .where(and(eq(actors.workspaceId, this.workspaceId), eq(actors.id, this.actorId)));
    return { ...document, ownerDisplayName: owner?.displayName ?? "" };
  }

  async updateDocument(documentId: string, input: UpdateDocumentInput): Promise<DocumentView> {
    assertUuid(documentId, "documentId");
    const [existing] = await this.transaction
      .select()
      .from(documents)
      .where(and(eq(documents.workspaceId, this.workspaceId), eq(documents.id, documentId)))
      .limit(1);
    if (!existing || existing.deletedAt !== null) {
      throw new PersistenceError("not_found", "文档不存在");
    }
    await this.requireProjectWrite(existing.projectId);
    const [updated] = await this.transaction
      .update(documents)
      .set({
        ...(input.title === undefined ? {} : { title: requireText(input.title, "文档标题", 300) }),
        ...(input.status === undefined
          ? {}
          : {
              status: input.status,
              archivedAt: input.status === "archived" ? new Date() : null,
            }),
        updatedAt: new Date(),
      })
      .where(and(eq(documents.workspaceId, this.workspaceId), eq(documents.id, documentId)))
      .returning();
    if (!updated) throw new PersistenceError("conflict", "文档更新后未返回记录");
    const [owner] = await this.transaction
      .select({ displayName: actors.displayName })
      .from(actors)
      .where(and(eq(actors.workspaceId, this.workspaceId), eq(actors.id, updated.ownerActorId)));
    return { ...updated, ownerDisplayName: owner?.displayName ?? "" };
  }

  async listDocuments(): Promise<DocumentView[]> {
    const authorizedProjects = await this.listProjects();
    const projectIds = authorizedProjects.map((project) => project.id);
    if (projectIds.length === 0) return [];
    const visibleRooms = await this.listRooms();
    const visibleRoomIds = new Set(visibleRooms.map((room) => room.id));
    const rows = await this.transaction
      .select({ document: documents, ownerDisplayName: actors.displayName })
      .from(documents)
      .innerJoin(
        actors,
        and(eq(actors.workspaceId, documents.workspaceId), eq(actors.id, documents.ownerActorId)),
      )
      .where(
        and(eq(documents.workspaceId, this.workspaceId), inArray(documents.projectId, projectIds)),
      )
      .orderBy(desc(documents.updatedAt));
    return rows
      .filter(
        ({ document }) =>
          document.deletedAt === null &&
          (document.roomId === null || visibleRoomIds.has(document.roomId)),
      )
      .map(({ document, ownerDisplayName }) => ({ ...document, ownerDisplayName }));
  }

  async appendMessage(input: AppendMessageInput): Promise<AppendMessageResult> {
    assertUuid(input.roomId, "roomId");
    assertUuid(input.clientMutationId, "clientMutationId");
    if (input.replyToMessageId !== undefined)
      assertUuid(input.replyToMessageId, "replyToMessageId");
    if (input.threadRootId !== undefined) assertUuid(input.threadRootId, "threadRootId");
    const parts = requireMessageParts(input.parts);
    await this.requireActiveRoomMember(input.roomId);

    // 锁定房间行后再查幂等键并分配序号，确保并发重试不会重复写入或制造无意义序号空洞。
    const [room] = await this.transaction
      .select({ lastSequence: rooms.lastSequence, status: rooms.status })
      .from(rooms)
      .where(and(eq(rooms.workspaceId, this.workspaceId), eq(rooms.id, input.roomId)))
      .for("update");
    if (!room) throw new PersistenceError("not_found", "房间不存在或不属于当前工作空间");
    if (room.status === "archived" || room.status === "completed") {
      throw new PersistenceError("conflict", "已完成或归档的房间不能新增消息");
    }

    const [existing] = await this.transaction
      .select()
      .from(messages)
      .where(
        and(
          eq(messages.workspaceId, this.workspaceId),
          eq(messages.roomId, input.roomId),
          eq(messages.authorActorId, this.actorId),
          eq(messages.clientMutationId, input.clientMutationId),
        ),
      )
      .limit(1);
    if (existing) return { message: existing, deduplicated: true };

    const sequence = room.lastSequence + 1;
    await this.transaction
      .update(rooms)
      .set({ lastSequence: sequence, updatedAt: new Date() })
      .where(and(eq(rooms.workspaceId, this.workspaceId), eq(rooms.id, input.roomId)));
    const [message] = await this.transaction
      .insert(messages)
      .values({
        workspaceId: this.workspaceId,
        roomId: input.roomId,
        authorActorId: this.actorId,
        sequence,
        clientMutationId: input.clientMutationId,
        parts,
        kind: input.kind ?? "text",
        contentDigest: sha256Digest(parts),
        ...(input.replyToMessageId === undefined
          ? {}
          : { replyToMessageId: input.replyToMessageId }),
        ...(input.threadRootId === undefined ? {} : { threadRootId: input.threadRootId }),
      })
      .returning();
    if (!message) throw new PersistenceError("conflict", "消息写入后未返回记录");
    return { message, deduplicated: false };
  }

  async listMessages(
    roomId: string,
    options: { readonly limit?: number; readonly beforeSequence?: number } = {},
  ): Promise<MessagePage> {
    assertUuid(roomId, "roomId");
    await this.requireActiveRoomMember(roomId);
    const limit = Math.min(Math.max(options.limit ?? 50, 1), 100);
    if (options.beforeSequence !== undefined && options.beforeSequence <= 0) {
      throw new PersistenceError("invalid_input", "beforeSequence 必须是正整数");
    }

    const filters = [eq(messages.workspaceId, this.workspaceId), eq(messages.roomId, roomId)];
    if (options.beforeSequence !== undefined) {
      filters.push(lt(messages.sequence, options.beforeSequence));
    }
    const rows = await this.transaction
      .select()
      .from(messages)
      .where(and(...filters))
      .orderBy(desc(messages.sequence))
      .limit(limit + 1);
    const hasMore = rows.length > limit;
    const page = rows.slice(0, limit).reverse();
    const oldest = page[0];
    return {
      items: page,
      ...(hasMore && oldest !== undefined ? { nextBeforeSequence: oldest.sequence } : {}),
    };
  }
}
