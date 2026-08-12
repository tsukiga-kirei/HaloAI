import { createHash, randomBytes, randomUUID } from "node:crypto";
import { and, count, eq } from "drizzle-orm";
import type { DatabaseClient } from "../client";
import { PersistenceError } from "../errors";
import {
  accessRoles,
  actorRoleAssignments,
  actors,
  humanActors,
  workspaceInvitations,
  workspaceMemberships,
  workspaces,
} from "../schema/index";
import { assertUuid, withWorkspaceTransaction } from "../workspace-transaction";

export type WorkspaceRole = "owner" | "admin" | "member" | "guest";
export type AssignableWorkspaceRole = Exclude<WorkspaceRole, "owner">;

export interface SessionUser {
  readonly id: string;
  readonly name: string;
  readonly email: string;
}

export interface WorkspaceSummary {
  readonly id: string;
  readonly slug: string;
  readonly name: string;
  readonly actorId: string;
  readonly membershipId: string;
  readonly role: WorkspaceRole;
}

export interface MembershipContext {
  readonly workspaceId: string;
  readonly actorId: string;
  readonly membershipId: string;
  readonly role: WorkspaceRole;
}

export interface WorkspaceMember {
  readonly membershipId: string;
  readonly actorId: string;
  readonly name: string;
  readonly email: string;
  readonly role: WorkspaceRole;
  readonly status: "invited" | "active" | "suspended" | "left";
  readonly joinedAt: Date | null;
}

interface MembershipFunctionRow {
  workspace_id: string;
  actor_id: string;
  membership_id: string;
  role_key: WorkspaceRole;
}

interface WorkspaceFunctionRow extends MembershipFunctionRow {
  workspace_slug: string;
  workspace_name: string;
}

interface InvitationFunctionRow {
  invitation_id: string;
  workspace_id: string;
  email: string;
  requested_role: AssignableWorkspaceRole;
  invited_by_actor_id: string;
  expires_at: Date;
  accepted_by_user_id: string | null;
  accepted_at: Date | null;
  revoked_at: Date | null;
}

interface WorkspaceMemberFunctionRow {
  membership_id: string;
  actor_id: string;
  member_name: string;
  member_email: string;
  role_key: WorkspaceRole;
  membership_status: WorkspaceMember["status"];
  joined_at: Date | null;
}

const builtInRoles: ReadonlyArray<{
  key: WorkspaceRole;
  name: string;
  description: string;
}> = [
  { key: "owner", name: "所有者", description: "管理工作区、成员、角色与关键安全设置" },
  { key: "admin", name: "管理员", description: "管理成员和日常工作区配置" },
  { key: "member", name: "成员", description: "参与协作、对话与文档工作" },
  { key: "guest", name: "访客", description: "仅访问明确授权的协作内容" },
];

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

function invitationDigest(token: string): string {
  return createHash("sha256").update(token, "utf8").digest("hex");
}

function isUniqueViolation(error: unknown): boolean {
  return typeof error === "object" && error !== null && "code" in error && error.code === "23505";
}

/**
 * 跨工作区发现只调用迁移中定义的窄 SECURITY DEFINER 函数。函数返回最少成员信息，
 * API 仍必须从已验证会话传入 userId，禁止把客户端提交的 userId 直接传到这里。
 */
export class WorkspaceOnboardingRepository {
  constructor(private readonly client: DatabaseClient) {}

  async listWorkspacesForUser(userId: string): Promise<WorkspaceSummary[]> {
    assertUuid(userId, "userId");
    const rows = await this.client.connection<WorkspaceFunctionRow[]>`
      select * from haloai_list_user_workspaces(${userId}::uuid)
    `;
    return rows.map((row) => ({
      id: row.workspace_id,
      slug: row.workspace_slug,
      name: row.workspace_name,
      actorId: row.actor_id,
      membershipId: row.membership_id,
      role: row.role_key,
    }));
  }

  async resolveMembership(userId: string, workspaceId: string): Promise<MembershipContext> {
    assertUuid(userId, "userId");
    assertUuid(workspaceId, "workspaceId");
    const rows = await this.client.connection<MembershipFunctionRow[]>`
      select * from haloai_resolve_membership(${userId}::uuid, ${workspaceId}::uuid)
    `;
    const row = rows[0];
    if (!row) {
      throw new PersistenceError("access_denied", "当前用户不是该工作区的有效成员");
    }
    return {
      workspaceId: row.workspace_id,
      actorId: row.actor_id,
      membershipId: row.membership_id,
      role: row.role_key,
    };
  }

  async createWorkspace(input: {
    user: SessionUser;
    name: string;
    slug: string;
    locale: "zh-CN" | "en-US";
    timeZone: string;
    requestId: string;
  }): Promise<WorkspaceSummary> {
    assertUuid(input.user.id, "userId");
    const workspaceId = randomUUID();
    const actorId = randomUUID();
    const membershipId = randomUUID();

    try {
      return await withWorkspaceTransaction(
        this.client.db,
        { workspaceId, actorId, requestId: input.requestId },
        async (transaction) => {
          await transaction.insert(workspaces).values({
            id: workspaceId,
            slug: input.slug,
            name: input.name,
            defaultLocale: input.locale,
            timeZone: input.timeZone,
            createdByUserId: input.user.id,
          });
          await transaction.insert(actors).values({
            id: actorId,
            workspaceId,
            kind: "human",
            displayName: input.user.name,
            handle: `user-${input.user.id.slice(0, 8)}`,
          });
          await transaction
            .insert(humanActors)
            .values({ actorId, workspaceId, userId: input.user.id });
          await transaction.insert(workspaceMemberships).values({
            id: membershipId,
            workspaceId,
            humanActorId: actorId,
            status: "active",
            isOwner: true,
            joinedAt: new Date(),
          });

          const roles = builtInRoles.map((role) => ({
            id: randomUUID(),
            workspaceId,
            key: role.key,
            builtIn: role.key,
            name: role.name,
            description: role.description,
          }));
          await transaction.insert(accessRoles).values(roles);
          const ownerRole = roles.find((role) => role.key === "owner");
          if (!ownerRole) {
            throw new PersistenceError("invalid_context", "内置所有者角色缺失");
          }
          await transaction.insert(actorRoleAssignments).values({
            workspaceId,
            actorId,
            roleId: ownerRole.id,
            scope: "workspace",
            scopeId: workspaceId,
            grantedByActorId: actorId,
          });

          return {
            id: workspaceId,
            slug: input.slug,
            name: input.name,
            actorId,
            membershipId,
            role: "owner",
          };
        },
      );
    } catch (error) {
      if (isUniqueViolation(error)) {
        throw new PersistenceError("conflict", "工作区标识已被使用", { cause: error });
      }
      throw error;
    }
  }

  async createInvitation(input: {
    principal: MembershipContext;
    email: string;
    role: AssignableWorkspaceRole;
    requestId: string;
  }): Promise<{
    id: string;
    workspaceId: string;
    email: string;
    role: AssignableWorkspaceRole;
    expiresAt: Date;
    token: string;
  }> {
    if (input.principal.role !== "owner" && input.principal.role !== "admin") {
      throw new PersistenceError("access_denied", "当前成员无权邀请成员");
    }
    if (input.role === "admin" && input.principal.role !== "owner") {
      throw new PersistenceError("delegation_denied", "只有所有者可以授予管理员角色");
    }
    const token = randomBytes(32).toString("base64url");
    const expiresAt = new Date(Date.now() + 72 * 60 * 60 * 1000);
    const id = randomUUID();
    const email = normalizeEmail(input.email);
    await withWorkspaceTransaction(
      this.client.db,
      {
        workspaceId: input.principal.workspaceId,
        actorId: input.principal.actorId,
        requestId: input.requestId,
      },
      async (transaction) => {
        await transaction.insert(workspaceInvitations).values({
          id,
          workspaceId: input.principal.workspaceId,
          email,
          requestedRole: input.role,
          tokenDigest: invitationDigest(token),
          invitedByActorId: input.principal.actorId,
          expiresAt,
        });
      },
    );
    return {
      id,
      workspaceId: input.principal.workspaceId,
      email,
      role: input.role,
      expiresAt,
      token,
    };
  }

  async acceptInvitation(input: {
    user: SessionUser;
    token: string;
    requestId: string;
  }): Promise<WorkspaceSummary> {
    assertUuid(input.user.id, "userId");
    const digest = invitationDigest(input.token);
    const invitations = await this.client.connection<InvitationFunctionRow[]>`
      select * from haloai_resolve_invitation(${digest})
    `;
    const invitation = invitations[0];
    const now = new Date();
    if (
      !invitation ||
      invitation.revoked_at ||
      invitation.expires_at <= now ||
      normalizeEmail(invitation.email) !== normalizeEmail(input.user.email)
    ) {
      throw new PersistenceError("invitation_invalid", "邀请不存在、已过期或不属于当前账户");
    }

    const actorId = randomUUID();
    return withWorkspaceTransaction(
      this.client.db,
      { workspaceId: invitation.workspace_id, actorId, requestId: input.requestId },
      async (transaction) => {
        const [lockedInvitation] = await transaction
          .select()
          .from(workspaceInvitations)
          .where(eq(workspaceInvitations.id, invitation.invitation_id))
          .for("update");
        if (
          !lockedInvitation ||
          lockedInvitation.revokedAt ||
          lockedInvitation.expiresAt <= now ||
          (lockedInvitation.acceptedByUserId && lockedInvitation.acceptedByUserId !== input.user.id)
        ) {
          throw new PersistenceError("invitation_invalid", "邀请已失效");
        }

        const [existingActor] = await transaction
          .select({ actorId: humanActors.actorId })
          .from(humanActors)
          .where(
            and(
              eq(humanActors.workspaceId, invitation.workspace_id),
              eq(humanActors.userId, input.user.id),
            ),
          )
          .limit(1);
        if (existingActor) {
          const [membership] = await transaction
            .select()
            .from(workspaceMemberships)
            .where(
              and(
                eq(workspaceMemberships.workspaceId, invitation.workspace_id),
                eq(workspaceMemberships.humanActorId, existingActor.actorId),
              ),
            )
            .limit(1);
          if (!membership) {
            throw new PersistenceError("invalid_context", "成员身份数据不完整");
          }
          if (!lockedInvitation.acceptedAt) {
            await transaction
              .update(workspaceInvitations)
              .set({ acceptedByUserId: input.user.id, acceptedAt: now, updatedAt: now })
              .where(eq(workspaceInvitations.id, lockedInvitation.id));
          }
          const [workspace] = await transaction
            .select({ name: workspaces.name, slug: workspaces.slug })
            .from(workspaces)
            .where(eq(workspaces.id, invitation.workspace_id));
          return {
            id: invitation.workspace_id,
            slug: workspace?.slug ?? "workspace",
            name: workspace?.name ?? "Workspace",
            actorId: existingActor.actorId,
            membershipId: membership.id,
            role: membership.isOwner ? "owner" : invitation.requested_role,
          };
        }

        const membershipId = randomUUID();
        await transaction.insert(actors).values({
          id: actorId,
          workspaceId: invitation.workspace_id,
          kind: "human",
          displayName: input.user.name,
          handle: `user-${input.user.id.slice(0, 8)}`,
        });
        await transaction.insert(humanActors).values({
          actorId,
          workspaceId: invitation.workspace_id,
          userId: input.user.id,
        });
        await transaction.insert(workspaceMemberships).values({
          id: membershipId,
          workspaceId: invitation.workspace_id,
          humanActorId: actorId,
          status: "active",
          isOwner: false,
          invitedByActorId: invitation.invited_by_actor_id,
          joinedAt: now,
        });
        const [role] = await transaction
          .select({ id: accessRoles.id })
          .from(accessRoles)
          .where(
            and(
              eq(accessRoles.workspaceId, invitation.workspace_id),
              eq(accessRoles.builtIn, invitation.requested_role),
            ),
          )
          .limit(1);
        if (!role) {
          throw new PersistenceError("invalid_context", "邀请角色不存在");
        }
        await transaction.insert(actorRoleAssignments).values({
          workspaceId: invitation.workspace_id,
          actorId,
          roleId: role.id,
          scope: "workspace",
          scopeId: invitation.workspace_id,
          grantedByActorId: invitation.invited_by_actor_id,
        });
        await transaction
          .update(workspaceInvitations)
          .set({ acceptedByUserId: input.user.id, acceptedAt: now, updatedAt: now })
          .where(eq(workspaceInvitations.id, invitation.invitation_id));
        const [workspace] = await transaction
          .select({ name: workspaces.name, slug: workspaces.slug })
          .from(workspaces)
          .where(eq(workspaces.id, invitation.workspace_id));
        return {
          id: invitation.workspace_id,
          slug: workspace?.slug ?? "workspace",
          name: workspace?.name ?? "Workspace",
          actorId,
          membershipId,
          role: invitation.requested_role,
        };
      },
    );
  }

  async listMembers(
    userId: string,
    principal: MembershipContext,
    _requestId: string,
  ): Promise<WorkspaceMember[]> {
    assertUuid(userId, "userId");
    if (principal.role !== "owner" && principal.role !== "admin") {
      throw new PersistenceError("access_denied", "当前成员无权查看成员管理列表");
    }
    const rows = await this.client.connection<WorkspaceMemberFunctionRow[]>`
      select * from haloai_list_workspace_members(${userId}::uuid, ${principal.workspaceId}::uuid)
    `;
    return rows.map((row) => ({
      membershipId: row.membership_id,
      actorId: row.actor_id,
      name: row.member_name,
      email: row.member_email,
      role: row.role_key,
      status: row.membership_status,
      joinedAt: row.joined_at,
    }));
  }

  async updateMemberRole(input: {
    principal: MembershipContext;
    membershipId: string;
    role: WorkspaceRole;
    requestId: string;
  }): Promise<void> {
    assertUuid(input.membershipId, "membershipId");
    if (input.principal.role !== "owner") {
      throw new PersistenceError("delegation_denied", "只有所有者可以修改工作区角色");
    }
    await withWorkspaceTransaction(
      this.client.db,
      {
        workspaceId: input.principal.workspaceId,
        actorId: input.principal.actorId,
        requestId: input.requestId,
      },
      async (transaction) => {
        await transaction
          .select({ id: workspaces.id })
          .from(workspaces)
          .where(eq(workspaces.id, input.principal.workspaceId))
          .for("update");
        const [target] = await transaction
          .select()
          .from(workspaceMemberships)
          .where(
            and(
              eq(workspaceMemberships.workspaceId, input.principal.workspaceId),
              eq(workspaceMemberships.id, input.membershipId),
            ),
          )
          .for("update");
        if (!target || target.status !== "active") {
          throw new PersistenceError("not_found", "目标成员不存在");
        }
        if (target.isOwner && input.role !== "owner") {
          const [owners] = await transaction
            .select({ value: count() })
            .from(workspaceMemberships)
            .where(
              and(
                eq(workspaceMemberships.workspaceId, input.principal.workspaceId),
                eq(workspaceMemberships.status, "active"),
                eq(workspaceMemberships.isOwner, true),
              ),
            );
          if ((owners?.value ?? 0) <= 1) {
            throw new PersistenceError("last_owner_required", "工作区必须保留至少一位所有者");
          }
        }
        const [role] = await transaction
          .select({ id: accessRoles.id })
          .from(accessRoles)
          .where(
            and(
              eq(accessRoles.workspaceId, input.principal.workspaceId),
              eq(accessRoles.builtIn, input.role),
            ),
          );
        if (!role) {
          throw new PersistenceError("invalid_context", "目标角色不存在");
        }
        await transaction
          .update(actorRoleAssignments)
          .set({ status: "revoked", revokedAt: new Date(), updatedAt: new Date() })
          .where(
            and(
              eq(actorRoleAssignments.workspaceId, input.principal.workspaceId),
              eq(actorRoleAssignments.actorId, target.humanActorId),
              eq(actorRoleAssignments.scope, "workspace"),
              eq(actorRoleAssignments.status, "active"),
            ),
          );
        const [existingAssignment] = await transaction
          .select({ id: actorRoleAssignments.id })
          .from(actorRoleAssignments)
          .where(
            and(
              eq(actorRoleAssignments.workspaceId, input.principal.workspaceId),
              eq(actorRoleAssignments.actorId, target.humanActorId),
              eq(actorRoleAssignments.roleId, role.id),
              eq(actorRoleAssignments.scope, "workspace"),
              eq(actorRoleAssignments.scopeId, input.principal.workspaceId),
            ),
          );
        if (existingAssignment) {
          await transaction
            .update(actorRoleAssignments)
            .set({ status: "active", revokedAt: null, expiresAt: null, updatedAt: new Date() })
            .where(eq(actorRoleAssignments.id, existingAssignment.id));
        } else {
          await transaction.insert(actorRoleAssignments).values({
            workspaceId: input.principal.workspaceId,
            actorId: target.humanActorId,
            roleId: role.id,
            scope: "workspace",
            scopeId: input.principal.workspaceId,
            grantedByActorId: input.principal.actorId,
          });
        }
        await transaction
          .update(workspaceMemberships)
          .set({ isOwner: input.role === "owner", updatedAt: new Date() })
          .where(eq(workspaceMemberships.id, target.id));
      },
    );
  }
}
