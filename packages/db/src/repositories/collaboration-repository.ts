import { and, desc, eq, lt } from "drizzle-orm";
import { canonicalJson, sha256Digest } from "../canonical-json";
import { PersistenceError } from "../errors";
import type { MessagePart } from "../schema/common";
import {
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
export type StoredMessage = typeof messages.$inferSelect;

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
  ) {
    assertUuid(workspaceId, "workspaceId");
    assertUuid(actorId, "actorId");
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

  private async requireActiveProjectMember(projectId: string): Promise<void> {
    const [membership] = await this.transaction
      .select({ id: projectMemberships.id })
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
      addedByActorId: this.actorId,
      status: "active",
    });
    return project;
  }

  async createRoom(input: CreateRoomInput): Promise<StoredRoom> {
    assertUuid(input.projectId, "projectId");
    await this.requireActiveProjectMember(input.projectId);
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
