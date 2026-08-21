import { createHash, randomBytes, randomUUID } from "node:crypto";
import { and, asc, count, eq } from "drizzle-orm";
import { appendAuditEvent } from "../audit-event";
import type { DatabaseClient } from "../client";
import { PersistenceError } from "../errors";
import {
  accessRoles,
  actorRoleAssignments,
  actors,
  humanActors,
  workspaceInvitations,
  workspaceDepartments,
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
  readonly departmentId: string | null;
  readonly departmentName: string | null;
  readonly jobTitle: string;
  readonly status: "invited" | "active" | "suspended" | "left";
  readonly joinedAt: Date | null;
}

export interface WorkspaceDepartment {
  readonly id: string;
  readonly parentId: string | null;
  readonly name: string;
  readonly code: string;
  readonly description: string;
  readonly managerActorId: string | null;
  readonly managerName: string | null;
  readonly status: "active" | "disabled";
  readonly sortOrder: number;
  readonly memberCount: number;
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
  department_id: string | null;
  job_title: string;
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
  department_id: string | null;
  department_name: string | null;
  job_title: string;
  membership_status: WorkspaceMember["status"];
  joined_at: Date | string | null;
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
          await appendAuditEvent(transaction, {
            workspaceId,
            principalActorId: actorId,
            membershipId,
            action: "workspace.created",
            resourceType: "workspace",
            resourceId: workspaceId,
            outcome: "succeeded",
            metadata: { name: input.name, slug: input.slug },
            requestId: input.requestId,
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
    departmentId?: string | null | undefined;
    jobTitle?: string;
    requestId: string;
  }): Promise<{
    id: string;
    workspaceId: string;
    email: string;
    role: AssignableWorkspaceRole;
    departmentId: string | null;
    jobTitle: string;
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
          departmentId: input.departmentId ?? null,
          jobTitle: input.jobTitle?.trim() ?? "",
          tokenDigest: invitationDigest(token),
          invitedByActorId: input.principal.actorId,
          expiresAt,
        });
        await appendAuditEvent(transaction, {
          workspaceId: input.principal.workspaceId,
          principalActorId: input.principal.actorId,
          membershipId: input.principal.membershipId,
          action: "member.invited",
          resourceType: "invitation",
          resourceId: id,
          outcome: "succeeded",
          metadata: { email, role: input.role },
          requestId: input.requestId,
        });
      },
    );
    return {
      id,
      workspaceId: input.principal.workspaceId,
      email,
      role: input.role,
      departmentId: input.departmentId ?? null,
      jobTitle: input.jobTitle?.trim() ?? "",
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
              .update(workspaceMemberships)
              .set({
                departmentId: invitation.department_id,
                jobTitle: invitation.job_title,
                updatedAt: now,
              })
              .where(eq(workspaceMemberships.id, membership.id));
            await transaction
              .update(workspaceInvitations)
              .set({ acceptedByUserId: input.user.id, acceptedAt: now, updatedAt: now })
              .where(eq(workspaceInvitations.id, lockedInvitation.id));
            await appendAuditEvent(transaction, {
              workspaceId: invitation.workspace_id,
              principalActorId: existingActor.actorId,
              membershipId: membership.id,
              action: "member.joined",
              resourceType: "membership",
              resourceId: membership.id,
              outcome: "succeeded",
              metadata: { email: input.user.email },
              requestId: input.requestId,
            });
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
          departmentId: invitation.department_id,
          jobTitle: invitation.job_title,
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
        await appendAuditEvent(transaction, {
          workspaceId: invitation.workspace_id,
          principalActorId: actorId,
          membershipId,
          action: "member.joined",
          resourceType: "membership",
          resourceId: membershipId,
          outcome: "succeeded",
          metadata: { email: input.user.email, role: invitation.requested_role },
          requestId: input.requestId,
        });
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
      departmentId: row.department_id,
      departmentName: row.department_name,
      jobTitle: row.job_title,
      status: row.membership_status,
      // postgres.js 对 SECURITY DEFINER 函数返回的 timestamptz 可能保留为字符串；
      // Repository 在边界统一恢复为 Date，避免 API 层因驱动表示差异崩溃。
      joinedAt: row.joined_at === null ? null : new Date(row.joined_at),
    }));
  }

  async listDepartments(
    principal: MembershipContext,
    requestId: string,
  ): Promise<WorkspaceDepartment[]> {
    if (principal.role !== "owner" && principal.role !== "admin") {
      throw new PersistenceError("access_denied", "当前成员无权查看组织架构");
    }
    return withWorkspaceTransaction(
      this.client.db,
      { workspaceId: principal.workspaceId, actorId: principal.actorId, requestId },
      async (transaction) => {
        const rows = await transaction
          .select({
            id: workspaceDepartments.id,
            parentId: workspaceDepartments.parentId,
            name: workspaceDepartments.name,
            code: workspaceDepartments.code,
            description: workspaceDepartments.description,
            managerActorId: workspaceDepartments.managerActorId,
            managerName: actors.displayName,
            status: workspaceDepartments.status,
            sortOrder: workspaceDepartments.sortOrder,
          })
          .from(workspaceDepartments)
          .leftJoin(
            actors,
            and(
              eq(actors.workspaceId, workspaceDepartments.workspaceId),
              eq(actors.id, workspaceDepartments.managerActorId),
            ),
          )
          .where(eq(workspaceDepartments.workspaceId, principal.workspaceId))
          .orderBy(asc(workspaceDepartments.sortOrder), asc(workspaceDepartments.name));
        const counts = await transaction
          .select({ departmentId: workspaceMemberships.departmentId, value: count() })
          .from(workspaceMemberships)
          .where(
            and(
              eq(workspaceMemberships.workspaceId, principal.workspaceId),
              eq(workspaceMemberships.status, "active"),
            ),
          )
          .groupBy(workspaceMemberships.departmentId);
        const countByDepartment = new Map(counts.map((item) => [item.departmentId, item.value]));
        return rows.map((row) => ({
          ...row,
          status: row.status === "disabled" ? "disabled" : "active",
          memberCount: countByDepartment.get(row.id) ?? 0,
        }));
      },
    );
  }

  async saveDepartment(input: {
    principal: MembershipContext;
    departmentId?: string;
    name: string;
    code: string;
    description: string;
    parentId: string | null;
    managerActorId: string | null;
    status: "active" | "disabled";
    sortOrder: number;
    requestId: string;
  }): Promise<string> {
    if (input.principal.role !== "owner" && input.principal.role !== "admin") {
      throw new PersistenceError("access_denied", "当前成员无权维护组织架构");
    }
    const departmentId = input.departmentId ?? randomUUID();
    if (input.departmentId) assertUuid(input.departmentId, "departmentId");
    if (input.parentId) assertUuid(input.parentId, "parentId");
    if (input.managerActorId) assertUuid(input.managerActorId, "managerActorId");
    try {
      await withWorkspaceTransaction(
        this.client.db,
        {
          workspaceId: input.principal.workspaceId,
          actorId: input.principal.actorId,
          requestId: input.requestId,
        },
        async (transaction) => {
          if (input.parentId) {
            if (input.parentId === departmentId) {
              throw new PersistenceError("invalid_context", "部门不能成为自己的上级");
            }
            const [parent] = await transaction
              .select({ id: workspaceDepartments.id, parentId: workspaceDepartments.parentId })
              .from(workspaceDepartments)
              .where(
                and(
                  eq(workspaceDepartments.workspaceId, input.principal.workspaceId),
                  eq(workspaceDepartments.id, input.parentId),
                ),
              );
            if (!parent) throw new PersistenceError("not_found", "上级部门不存在");
            if (parent.parentId) {
              throw new PersistenceError("invalid_context", "当前阶段部门最多支持两级");
            }
          }
          if (input.managerActorId) {
            const [manager] = await transaction
              .select({ id: workspaceMemberships.id })
              .from(workspaceMemberships)
              .where(
                and(
                  eq(workspaceMemberships.workspaceId, input.principal.workspaceId),
                  eq(workspaceMemberships.humanActorId, input.managerActorId),
                  eq(workspaceMemberships.status, "active"),
                ),
              );
            if (!manager) throw new PersistenceError("not_found", "部门负责人不是当前空间成员");
          }
          const values = {
            workspaceId: input.principal.workspaceId,
            name: input.name,
            code: input.code,
            description: input.description,
            parentId: input.parentId,
            managerActorId: input.managerActorId,
            status: input.status,
            sortOrder: input.sortOrder,
            updatedAt: new Date(),
          } as const;
          if (input.departmentId) {
            const [updated] = await transaction
              .update(workspaceDepartments)
              .set(values)
              .where(
                and(
                  eq(workspaceDepartments.workspaceId, input.principal.workspaceId),
                  eq(workspaceDepartments.id, input.departmentId),
                ),
              )
              .returning({ id: workspaceDepartments.id });
            if (!updated) throw new PersistenceError("not_found", "部门不存在");
          } else {
            await transaction.insert(workspaceDepartments).values({ id: departmentId, ...values });
          }
          await appendAuditEvent(transaction, {
            workspaceId: input.principal.workspaceId,
            principalActorId: input.principal.actorId,
            membershipId: input.principal.membershipId,
            action: input.departmentId ? "department.updated" : "department.created",
            resourceType: "department",
            resourceId: departmentId,
            outcome: "succeeded",
            metadata: { name: input.name, code: input.code },
            requestId: input.requestId,
          });
        },
      );
      return departmentId;
    } catch (error) {
      if (isUniqueViolation(error)) {
        throw new PersistenceError("conflict", "部门编码已被使用", { cause: error });
      }
      throw error;
    }
  }

  async updateMemberOrganization(input: {
    principal: MembershipContext;
    membershipId: string;
    departmentId: string | null;
    jobTitle: string;
    requestId: string;
  }): Promise<void> {
    if (input.principal.role !== "owner" && input.principal.role !== "admin") {
      throw new PersistenceError("access_denied", "当前成员无权调整组织归属");
    }
    assertUuid(input.membershipId, "membershipId");
    if (input.departmentId) assertUuid(input.departmentId, "departmentId");
    await withWorkspaceTransaction(
      this.client.db,
      {
        workspaceId: input.principal.workspaceId,
        actorId: input.principal.actorId,
        requestId: input.requestId,
      },
      async (transaction) => {
        if (input.departmentId) {
          const [department] = await transaction
            .select({ id: workspaceDepartments.id })
            .from(workspaceDepartments)
            .where(
              and(
                eq(workspaceDepartments.workspaceId, input.principal.workspaceId),
                eq(workspaceDepartments.id, input.departmentId),
                eq(workspaceDepartments.status, "active"),
              ),
            );
          if (!department) throw new PersistenceError("not_found", "部门不存在或已停用");
        }
        const [updated] = await transaction
          .update(workspaceMemberships)
          .set({
            departmentId: input.departmentId,
            jobTitle: input.jobTitle.trim(),
            updatedAt: new Date(),
          })
          .where(
            and(
              eq(workspaceMemberships.workspaceId, input.principal.workspaceId),
              eq(workspaceMemberships.id, input.membershipId),
              eq(workspaceMemberships.status, "active"),
            ),
          )
          .returning({ id: workspaceMemberships.id });
        if (!updated) throw new PersistenceError("not_found", "成员不存在");
        await appendAuditEvent(transaction, {
          workspaceId: input.principal.workspaceId,
          principalActorId: input.principal.actorId,
          membershipId: input.principal.membershipId,
          action: "member.organization.updated",
          resourceType: "membership",
          resourceId: input.membershipId,
          outcome: "succeeded",
          metadata: {
            departmentId: input.departmentId,
            jobTitle: input.jobTitle.trim(),
          },
          requestId: input.requestId,
        });
      },
    );
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
        await appendAuditEvent(transaction, {
          workspaceId: input.principal.workspaceId,
          principalActorId: input.principal.actorId,
          membershipId: input.principal.membershipId,
          action: "member.role.updated",
          resourceType: "membership",
          resourceId: target.id,
          outcome: "succeeded",
          metadata: { role: input.role },
          requestId: input.requestId,
        });
      },
    );
  }

  async updateMemberStatus(input: {
    principal: MembershipContext;
    membershipId: string;
    status: "active" | "suspended";
    requestId: string;
  }): Promise<void> {
    assertUuid(input.membershipId, "membershipId");
    if (input.principal.role !== "owner" && input.principal.role !== "admin") {
      throw new PersistenceError("access_denied", "当前成员无权调整成员状态");
    }
    await withWorkspaceTransaction(
      this.client.db,
      {
        workspaceId: input.principal.workspaceId,
        actorId: input.principal.actorId,
        requestId: input.requestId,
      },
      async (transaction) => {
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
        if (!target || target.status === "left") {
          throw new PersistenceError("not_found", "目标成员不存在");
        }
        if (target.id === input.principal.membershipId && input.status === "suspended") {
          throw new PersistenceError("invalid_context", "不能停用自己的成员身份");
        }
        if (target.isOwner && input.status === "suspended") {
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
        await transaction
          .update(workspaceMemberships)
          .set({ status: input.status, updatedAt: new Date() })
          .where(eq(workspaceMemberships.id, target.id));
        await appendAuditEvent(transaction, {
          workspaceId: input.principal.workspaceId,
          principalActorId: input.principal.actorId,
          membershipId: input.principal.membershipId,
          action: "member.status.updated",
          resourceType: "membership",
          resourceId: target.id,
          outcome: "succeeded",
          metadata: { status: input.status },
          requestId: input.requestId,
        });
      },
    );
  }

  async updateDisplayNameForUser(input: {
    userId: string;
    name: string;
    requestId: string;
  }): Promise<void> {
    const workspacesForUser = await this.listWorkspacesForUser(input.userId);
    for (const workspace of workspacesForUser) {
      await withWorkspaceTransaction(
        this.client.db,
        {
          workspaceId: workspace.id,
          actorId: workspace.actorId,
          requestId: input.requestId,
        },
        async (transaction) => {
          await transaction
            .update(actors)
            .set({ displayName: input.name, updatedAt: new Date() })
            .where(and(eq(actors.workspaceId, workspace.id), eq(actors.id, workspace.actorId)));
        },
      );
    }
  }
}
