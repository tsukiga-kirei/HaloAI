import { randomUUID } from "node:crypto";
import { and, eq, sql } from "drizzle-orm";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { createDatabaseClient, type DatabaseClient } from "../client";
import {
  actors,
  humanActors,
  roomMemberships,
  rooms,
  users,
  workspaceMemberships,
  workspaces,
} from "../schema/index";
import { withWorkspaceTransaction } from "../workspace-transaction";
import { CollaborationRepository } from "./collaboration-repository";

const applicationUrl = process.env.DATABASE_TEST_URL;
const adminUrl = process.env.DATABASE_TEST_ADMIN_URL;

interface SeededWorkspace {
  readonly userId: string;
  readonly workspaceId: string;
  readonly actorId: string;
}

const describeWithDatabase = applicationUrl && adminUrl ? describe : describe.skip;

describeWithDatabase("协作 Repository PostgreSQL 集成", () => {
  let admin: DatabaseClient;
  let application: DatabaseClient;
  const seeded: SeededWorkspace[] = [];

  async function seedWorkspace(label: string): Promise<SeededWorkspace> {
    const userId = randomUUID();
    const workspaceId = randomUUID();
    const actorId = randomUUID();
    await admin.db.transaction(async (transaction) => {
      await transaction.insert(users).values({
        id: userId,
        name: `${label} User`,
        email: `${label}-${userId}@example.invalid`,
      });
      await transaction.insert(workspaces).values({
        id: workspaceId,
        slug: `${label}-${workspaceId}`,
        name: `${label} 工作空间`,
        createdByUserId: userId,
      });
      await transaction.insert(actors).values({
        id: actorId,
        workspaceId,
        kind: "human",
        displayName: `${label} 成员`,
        handle: `${label}-${actorId}`,
      });
      await transaction.insert(humanActors).values({ actorId, workspaceId, userId });
      await transaction.insert(workspaceMemberships).values({
        workspaceId,
        humanActorId: actorId,
        status: "active",
        isOwner: true,
        joinedAt: new Date(),
      });
    });
    const result = { userId, workspaceId, actorId };
    seeded.push(result);
    return result;
  }

  beforeAll(async () => {
    admin = createDatabaseClient({
      url: adminUrl!,
      applicationName: "haloai-db-integration-admin",
      maxConnections: 2,
    });
    application = createDatabaseClient({
      url: applicationUrl!,
      applicationName: "haloai-db-integration-app",
      maxConnections: 4,
    });
  });

  afterAll(async () => {
    if (admin) {
      for (const item of seeded) {
        await admin.db.delete(workspaces).where(eq(workspaces.id, item.workspaceId));
        await admin.db.delete(users).where(eq(users.id, item.userId));
      }
    }
    await Promise.all([admin?.close(), application?.close()]);
  });

  it("应用角色不拥有 BYPASSRLS，且无上下文查询返回空集", async () => {
    const [role] = await application.connection<
      {
        rolbypassrls: boolean;
        can_create_in_public: boolean;
        table_owner: string;
        current_role: string;
      }[]
    >`
      select
        roles.rolbypassrls,
        has_schema_privilege(current_user, 'public', 'CREATE') as can_create_in_public,
        pg_get_userbyid(classes.relowner) as table_owner,
        current_user as current_role
      from pg_roles roles
      cross join pg_class classes
      where roles.rolname = current_user and classes.oid = 'public.rooms'::regclass
    `;
    expect(role?.rolbypassrls).toBe(false);
    expect(role?.can_create_in_public).toBe(false);
    expect(role?.current_role).not.toBe(role?.table_owner);
    expect(await application.db.select().from(rooms)).toEqual([]);
  });

  it("创建项目与房间，并把并发幂等消息只保存一次", async () => {
    const context = await seedWorkspace("primary");
    const room = await withWorkspaceTransaction(application.db, context, async (transaction) => {
      const repository = new CollaborationRepository(
        transaction,
        context.workspaceId,
        context.actorId,
      );
      const project = await repository.createProject({ name: "Alpha 验证" });
      return repository.createRoom({ projectId: project.id, name: "发布讨论" });
    });

    const clientMutationId = randomUUID();
    const append = () =>
      withWorkspaceTransaction(application.db, context, async (transaction) => {
        const repository = new CollaborationRepository(
          transaction,
          context.workspaceId,
          context.actorId,
        );
        return repository.appendMessage({
          roomId: room.id,
          clientMutationId,
          parts: [{ type: "text", data: { text: "第一条持久消息" } }],
        });
      });
    const results = await Promise.all([append(), append()]);
    expect(results.filter((result) => result.deduplicated)).toHaveLength(1);
    expect(new Set(results.map((result) => result.message.id)).size).toBe(1);

    const page = await withWorkspaceTransaction(application.db, context, async (transaction) =>
      new CollaborationRepository(transaction, context.workspaceId, context.actorId).listMessages(
        room.id,
      ),
    );
    expect(page.items).toHaveLength(1);
    expect(page.items[0]?.sequence).toBe(1);
  });

  it("跨工作空间上下文无法读取另一工作空间房间", async () => {
    const owner = await seedWorkspace("owner");
    const outsider = await seedWorkspace("outsider");
    const room = await withWorkspaceTransaction(application.db, owner, async (transaction) => {
      const repository = new CollaborationRepository(transaction, owner.workspaceId, owner.actorId);
      const project = await repository.createProject({ name: "隔离验证" });
      return repository.createRoom({ projectId: project.id, name: "私有房间" });
    });

    await expect(
      withWorkspaceTransaction(application.db, outsider, async (transaction) =>
        new CollaborationRepository(
          transaction,
          outsider.workspaceId,
          outsider.actorId,
        ).listMessages(room.id),
      ),
    ).rejects.toMatchObject({ code: "access_denied" });

    const [visible] = await withWorkspaceTransaction(
      application.db,
      outsider,
      async (transaction) =>
        transaction
          .select({ id: rooms.id })
          .from(rooms)
          .where(and(eq(rooms.workspaceId, owner.workspaceId), eq(rooms.id, room.id))),
    );
    expect(visible).toBeUndefined();
  });

  it("SET LOCAL 不会泄漏到连接池后续事务", async () => {
    const context = await seedWorkspace("context");
    await withWorkspaceTransaction(application.db, context, async (transaction) => {
      const rows = await transaction.execute(sql`
        select current_setting('haloai.workspace_id', true) as workspace_id
      `);
      const row = rows[0] as { workspace_id: string } | undefined;
      expect(row?.workspace_id).toBe(context.workspaceId);
    });

    const rows = await application.db.execute(sql`
      select nullif(current_setting('haloai.workspace_id', true), '') as workspace_id
    `);
    const row = rows[0] as { workspace_id: string | null } | undefined;
    expect(row?.workspace_id).toBeNull();
  });

  it("被移出房间的成员无法继续追加消息", async () => {
    const context = await seedWorkspace("revoked");
    const room = await withWorkspaceTransaction(application.db, context, async (transaction) => {
      const repository = new CollaborationRepository(
        transaction,
        context.workspaceId,
        context.actorId,
      );
      const project = await repository.createProject({ name: "撤权验证" });
      return repository.createRoom({ projectId: project.id, name: "撤权房间" });
    });
    await withWorkspaceTransaction(application.db, context, async (transaction) => {
      await transaction
        .update(roomMemberships)
        .set({ status: "left", leftAt: new Date() })
        .where(
          and(
            eq(roomMemberships.workspaceId, context.workspaceId),
            eq(roomMemberships.roomId, room.id),
            eq(roomMemberships.actorId, context.actorId),
          ),
        );
    });

    await expect(
      withWorkspaceTransaction(application.db, context, async (transaction) =>
        new CollaborationRepository(
          transaction,
          context.workspaceId,
          context.actorId,
        ).appendMessage({
          roomId: room.id,
          clientMutationId: randomUUID(),
          parts: [{ type: "text", data: { text: "不应写入" } }],
        }),
      ),
    ).rejects.toMatchObject({ code: "access_denied" });
  });
});
