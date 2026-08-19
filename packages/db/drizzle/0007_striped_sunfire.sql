CREATE TABLE "workspace_departments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"workspace_id" uuid NOT NULL,
	"parent_id" uuid,
	"name" text NOT NULL,
	"code" varchar(64) NOT NULL,
	"description" text DEFAULT '' NOT NULL,
	"manager_actor_id" uuid,
	"status" varchar(16) DEFAULT 'active' NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "workspace_departments_status_check" CHECK ("workspace_departments"."status" in ('active', 'disabled')),
	CONSTRAINT "workspace_departments_parent_self_check" CHECK ("workspace_departments"."parent_id" is null or "workspace_departments"."parent_id" <> "workspace_departments"."id")
);
--> statement-breakpoint
ALTER TABLE "workspace_departments" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "workspace_memberships" ADD COLUMN "department_id" uuid;--> statement-breakpoint
ALTER TABLE "workspace_memberships" ADD COLUMN "job_title" varchar(120) DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE "workspace_invitations" ADD COLUMN "department_id" uuid;--> statement-breakpoint
ALTER TABLE "workspace_invitations" ADD COLUMN "job_title" varchar(120) DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE "workspace_departments" ADD CONSTRAINT "workspace_departments_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "workspace_departments_workspace_id_unique" ON "workspace_departments" USING btree ("workspace_id","id");--> statement-breakpoint
ALTER TABLE "workspace_departments" ADD CONSTRAINT "workspace_departments_parent_fk" FOREIGN KEY ("workspace_id","parent_id") REFERENCES "public"."workspace_departments"("workspace_id","id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "workspace_departments" ADD CONSTRAINT "workspace_departments_manager_fk" FOREIGN KEY ("workspace_id","manager_actor_id") REFERENCES "public"."actors"("workspace_id","id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "workspace_departments_workspace_code_unique" ON "workspace_departments" USING btree ("workspace_id","code");--> statement-breakpoint
CREATE INDEX "workspace_departments_tree_idx" ON "workspace_departments" USING btree ("workspace_id","parent_id","sort_order");--> statement-breakpoint
ALTER TABLE "workspace_memberships" ADD CONSTRAINT "workspace_memberships_department_fk" FOREIGN KEY ("workspace_id","department_id") REFERENCES "public"."workspace_departments"("workspace_id","id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "workspace_invitations" ADD CONSTRAINT "workspace_invitations_department_fk" FOREIGN KEY ("workspace_id","department_id") REFERENCES "public"."workspace_departments"("workspace_id","id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
CREATE POLICY "workspace_departments_tenant" ON "workspace_departments" AS PERMISSIVE FOR ALL TO public USING ("workspace_departments"."workspace_id" = nullif(current_setting('haloai.workspace_id', true), '')::uuid) WITH CHECK ("workspace_departments"."workspace_id" = nullif(current_setting('haloai.workspace_id', true), '')::uuid);
--> statement-breakpoint

COMMENT ON TABLE workspace_departments IS '工作空间内的组织部门，仅表达归属，不直接授予权限';
COMMENT ON COLUMN workspace_memberships.department_id IS '成员主部门；部门归属不得隐式扩大访问权限';
COMMENT ON COLUMN workspace_memberships.job_title IS '成员在当前工作空间内的岗位名称';
--> statement-breakpoint

DROP FUNCTION haloai_resolve_invitation(text);
DROP FUNCTION haloai_list_workspace_members(uuid, uuid);
DROP FUNCTION haloai_system_list_tenants(uuid, text, integer, integer);
--> statement-breakpoint

CREATE FUNCTION haloai_resolve_invitation(p_token_digest text)
RETURNS TABLE (
  invitation_id uuid,
  workspace_id uuid,
  email text,
  requested_role varchar,
  department_id uuid,
  job_title varchar,
  invited_by_actor_id uuid,
  expires_at timestamptz,
  accepted_by_user_id uuid,
  accepted_at timestamptz,
  revoked_at timestamptz
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = pg_catalog, public
STABLE
AS $$
  SELECT i.id, i.workspace_id, i.email, i.requested_role, i.department_id, i.job_title,
         i.invited_by_actor_id, i.expires_at, i.accepted_by_user_id, i.accepted_at, i.revoked_at
  FROM public.workspace_invitations i
  WHERE i.token_digest = p_token_digest
  LIMIT 1
$$;
--> statement-breakpoint

CREATE FUNCTION haloai_list_workspace_members(p_user_id uuid, p_workspace_id uuid)
RETURNS TABLE (
  membership_id uuid,
  actor_id uuid,
  member_name text,
  member_email text,
  role_key text,
  department_id uuid,
  department_name text,
  job_title varchar,
  membership_status membership_status,
  joined_at timestamptz
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = pg_catalog, public
STABLE
AS $$
  SELECT wm.id,
         ha.actor_id,
         a.display_name,
         u.primary_email,
         CASE WHEN wm.is_owner THEN 'owner' ELSE COALESCE(ar.built_in, 'member') END,
         wm.department_id,
         department.name,
         wm.job_title,
         wm.status,
         wm.joined_at
  FROM public.workspace_memberships wm
  JOIN public.human_actors ha
    ON ha.workspace_id = wm.workspace_id AND ha.actor_id = wm.human_actor_id
  JOIN public.actors a
    ON a.workspace_id = ha.workspace_id AND a.id = ha.actor_id
  JOIN public.users u ON u.id = ha.user_id
  LEFT JOIN public.workspace_departments department
    ON department.workspace_id = wm.workspace_id AND department.id = wm.department_id
  LEFT JOIN LATERAL (
    SELECT role.built_in
    FROM public.actor_role_assignments assignment
    JOIN public.access_roles role
      ON role.workspace_id = assignment.workspace_id AND role.id = assignment.role_id
    WHERE assignment.workspace_id = ha.workspace_id
      AND assignment.actor_id = ha.actor_id
      AND assignment.scope = 'workspace'
      AND assignment.scope_id = ha.workspace_id
      AND assignment.status = 'active'
    ORDER BY assignment.created_at DESC
    LIMIT 1
  ) ar ON true
  WHERE wm.workspace_id = p_workspace_id
    AND EXISTS (
      SELECT 1
      FROM public.human_actors requester_actor
      JOIN public.workspace_memberships requester_membership
        ON requester_membership.workspace_id = requester_actor.workspace_id
       AND requester_membership.human_actor_id = requester_actor.actor_id
      LEFT JOIN public.actor_role_assignments requester_assignment
        ON requester_assignment.workspace_id = requester_actor.workspace_id
       AND requester_assignment.actor_id = requester_actor.actor_id
       AND requester_assignment.scope = 'workspace'
       AND requester_assignment.scope_id = requester_actor.workspace_id
       AND requester_assignment.status = 'active'
      LEFT JOIN public.access_roles requester_role
        ON requester_role.workspace_id = requester_assignment.workspace_id
       AND requester_role.id = requester_assignment.role_id
      WHERE requester_actor.user_id = p_user_id
        AND requester_actor.workspace_id = p_workspace_id
        AND requester_membership.status = 'active'
        AND (requester_membership.is_owner OR requester_role.built_in = 'admin')
    )
  ORDER BY wm.created_at, wm.id
$$;
--> statement-breakpoint

CREATE FUNCTION haloai_system_list_tenants(
  p_user_id uuid,
  p_query text,
  p_limit integer,
  p_offset integer
)
RETURNS TABLE (
  workspace_id uuid,
  workspace_slug varchar,
  workspace_name text,
  workspace_status workspace_status,
  default_locale varchar,
  time_zone varchar,
  member_count bigint,
  department_count bigint,
  default_administrator_name text,
  default_administrator_email text,
  created_at timestamptz,
  total_count bigint
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = pg_catalog, public
STABLE
AS $$
  SELECT
    workspace.id,
    workspace.slug,
    workspace.name,
    workspace.status,
    workspace.default_locale,
    workspace.time_zone,
    count(DISTINCT membership.id) FILTER (WHERE membership.status = 'active'),
    count(DISTINCT department.id) FILTER (WHERE department.status = 'active'),
    administrator.name,
    administrator.primary_email,
    workspace.created_at,
    count(*) OVER ()
  FROM public.workspaces workspace
  JOIN public.users administrator ON administrator.id = workspace.created_by_user_id
  LEFT JOIN public.workspace_memberships membership ON membership.workspace_id = workspace.id
  LEFT JOIN public.workspace_departments department ON department.workspace_id = workspace.id
  WHERE public.haloai_is_system_administrator(p_user_id)
    AND (
      coalesce(nullif(trim(p_query), ''), '') = ''
      OR workspace.name ILIKE '%' || trim(p_query) || '%'
      OR workspace.slug ILIKE '%' || trim(p_query) || '%'
      OR administrator.name ILIKE '%' || trim(p_query) || '%'
      OR administrator.primary_email ILIKE '%' || trim(p_query) || '%'
    )
  GROUP BY workspace.id, administrator.id
  ORDER BY workspace.created_at DESC, workspace.id
  LIMIT greatest(1, least(p_limit, 100))
  OFFSET greatest(p_offset, 0)
$$;
--> statement-breakpoint

/**
 * 创建租户属于平台级高影响写入。函数同时验证独立系统管理员身份，并在一个事务中建立
 * 默认部门、默认管理员 Actor、Owner 成员关系和内置角色，避免出现没有 Owner 的半成品租户。
 */
CREATE FUNCTION haloai_system_create_tenant(
  p_user_id uuid,
  p_name text,
  p_slug varchar,
  p_default_locale varchar,
  p_time_zone varchar,
  p_default_administrator_email text
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $$
DECLARE
  v_workspace_id uuid := gen_random_uuid();
  v_actor_id uuid := gen_random_uuid();
  v_membership_id uuid := gen_random_uuid();
  v_department_id uuid := gen_random_uuid();
  v_owner_role_id uuid := gen_random_uuid();
  v_administrator_id uuid;
  v_administrator_name text;
BEGIN
  IF NOT public.haloai_is_system_administrator(p_user_id) THEN
    RETURN NULL;
  END IF;

  SELECT app_user.id, app_user.name
  INTO v_administrator_id, v_administrator_name
  FROM public.users app_user
  WHERE lower(app_user.primary_email) = lower(trim(p_default_administrator_email))
    AND app_user.status = 'active'
  LIMIT 1;
  IF v_administrator_id IS NULL THEN
    RETURN NULL;
  END IF;

  INSERT INTO public.workspaces
    (id, slug, name, status, default_locale, time_zone, created_by_user_id)
  VALUES
    (v_workspace_id, p_slug, p_name, 'active', p_default_locale, p_time_zone, v_administrator_id);
  INSERT INTO public.actors
    (id, workspace_id, kind, status, display_name, handle)
  VALUES
    (v_actor_id, v_workspace_id, 'human', 'active', v_administrator_name, 'user-' || left(v_administrator_id::text, 8));
  INSERT INTO public.human_actors (actor_id, workspace_id, user_id)
  VALUES (v_actor_id, v_workspace_id, v_administrator_id);
  INSERT INTO public.workspace_departments
    (id, workspace_id, name, code, description, manager_actor_id, status, sort_order)
  VALUES
    (v_department_id, v_workspace_id, '默认部门', 'default', '', v_actor_id, 'active', 0);
  INSERT INTO public.workspace_memberships
    (id, workspace_id, human_actor_id, status, is_owner, department_id, job_title, joined_at)
  VALUES
    (v_membership_id, v_workspace_id, v_actor_id, 'active', true, v_department_id, '空间负责人', now());

  INSERT INTO public.access_roles (id, workspace_id, key, name, description, built_in)
  VALUES
    (v_owner_role_id, v_workspace_id, 'owner', '所有者', '管理工作区、成员、角色与关键安全设置', 'owner'),
    (gen_random_uuid(), v_workspace_id, 'admin', '管理员', '管理成员和日常工作区配置', 'admin'),
    (gen_random_uuid(), v_workspace_id, 'member', '成员', '参与协作、对话与文档工作', 'member'),
    (gen_random_uuid(), v_workspace_id, 'guest', '访客', '仅访问明确授权的协作内容', 'guest');
  INSERT INTO public.actor_role_assignments
    (workspace_id, actor_id, role_id, scope, scope_id, status, granted_by_actor_id)
  VALUES
    (v_workspace_id, v_actor_id, v_owner_role_id, 'workspace', v_workspace_id, 'active', v_actor_id);

  RETURN v_workspace_id;
END
$$;
--> statement-breakpoint

REVOKE ALL ON FUNCTION haloai_resolve_invitation(text) FROM public;
REVOKE ALL ON FUNCTION haloai_list_workspace_members(uuid, uuid) FROM public;
REVOKE ALL ON FUNCTION haloai_system_list_tenants(uuid, text, integer, integer) FROM public;
REVOKE ALL ON FUNCTION haloai_system_create_tenant(uuid, text, varchar, varchar, varchar, text) FROM public;
--> statement-breakpoint

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'haloai_app') THEN
    GRANT SELECT, INSERT, UPDATE, DELETE ON workspace_departments TO haloai_app;
    GRANT EXECUTE ON FUNCTION haloai_resolve_invitation(text) TO haloai_app;
    GRANT EXECUTE ON FUNCTION haloai_list_workspace_members(uuid, uuid) TO haloai_app;
    GRANT EXECUTE ON FUNCTION haloai_system_list_tenants(uuid, text, integer, integer) TO haloai_app;
    GRANT EXECUTE ON FUNCTION haloai_system_create_tenant(uuid, text, varchar, varchar, varchar, text) TO haloai_app;
  END IF;
END
$$;
