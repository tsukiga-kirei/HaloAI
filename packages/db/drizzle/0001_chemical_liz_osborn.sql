CREATE TABLE "auth_accounts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"account_id" text NOT NULL,
	"provider_id" text NOT NULL,
	"user_id" uuid NOT NULL,
	"access_token" text,
	"refresh_token" text,
	"id_token" text,
	"access_token_expires_at" timestamp with time zone,
	"refresh_token_expires_at" timestamp with time zone,
	"scope" text,
	"password" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "auth_sessions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"token" text NOT NULL,
	"user_id" uuid NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"ip_address" text,
	"user_agent" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "auth_verifications" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"identifier" text NOT NULL,
	"value" text NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "workspace_invitations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"workspace_id" uuid NOT NULL,
	"email" text NOT NULL,
	"requested_role" varchar(32) NOT NULL,
	"token_digest" text NOT NULL,
	"invited_by_actor_id" uuid NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"accepted_by_user_id" uuid,
	"accepted_at" timestamp with time zone,
	"revoked_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "workspace_invitations_role_check" CHECK ("workspace_invitations"."requested_role" in ('admin', 'member', 'guest')),
	CONSTRAINT "workspace_invitations_acceptance_check" CHECK (("workspace_invitations"."accepted_at" is null and "workspace_invitations"."accepted_by_user_id" is null) or ("workspace_invitations"."accepted_at" is not null and "workspace_invitations"."accepted_by_user_id" is not null))
);
--> statement-breakpoint
ALTER TABLE "workspace_invitations" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "name" text DEFAULT 'HaloAI User' NOT NULL;--> statement-breakpoint
ALTER TABLE "users" ALTER COLUMN "name" DROP DEFAULT;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "email_verified" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "image" text;--> statement-breakpoint
ALTER TABLE "auth_accounts" ADD CONSTRAINT "auth_accounts_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "auth_sessions" ADD CONSTRAINT "auth_sessions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "workspace_invitations" ADD CONSTRAINT "workspace_invitations_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "workspace_invitations" ADD CONSTRAINT "workspace_invitations_accepted_by_user_id_users_id_fk" FOREIGN KEY ("accepted_by_user_id") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "workspace_invitations" ADD CONSTRAINT "workspace_invitations_inviter_fk" FOREIGN KEY ("workspace_id","invited_by_actor_id") REFERENCES "public"."actors"("workspace_id","id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "auth_accounts_provider_account_unique" ON "auth_accounts" USING btree ("provider_id","account_id");--> statement-breakpoint
CREATE INDEX "auth_accounts_user_idx" ON "auth_accounts" USING btree ("user_id");--> statement-breakpoint
CREATE UNIQUE INDEX "auth_sessions_token_unique" ON "auth_sessions" USING btree ("token");--> statement-breakpoint
CREATE INDEX "auth_sessions_user_expires_idx" ON "auth_sessions" USING btree ("user_id","expires_at");--> statement-breakpoint
CREATE INDEX "auth_verifications_identifier_idx" ON "auth_verifications" USING btree ("identifier","expires_at");--> statement-breakpoint
CREATE UNIQUE INDEX "workspace_invitations_token_digest_unique" ON "workspace_invitations" USING btree ("token_digest");--> statement-breakpoint
CREATE INDEX "workspace_invitations_email_idx" ON "workspace_invitations" USING btree ("email","expires_at");--> statement-breakpoint
CREATE INDEX "workspace_invitations_workspace_idx" ON "workspace_invitations" USING btree ("workspace_id","created_at");--> statement-breakpoint
CREATE POLICY "workspace_invitations_tenant" ON "workspace_invitations" AS PERMISSIVE FOR ALL TO public USING ("workspace_invitations"."workspace_id" = nullif(current_setting('haloai.workspace_id', true), '')::uuid) WITH CHECK ("workspace_invitations"."workspace_id" = nullif(current_setting('haloai.workspace_id', true), '')::uuid);
--> statement-breakpoint

-- 认证角色只接触认证表与全局用户表，业务角色不能读取密码哈希或会话令牌。
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'haloai_auth') THEN
    GRANT USAGE ON SCHEMA public TO haloai_auth;
    GRANT SELECT, INSERT, UPDATE, DELETE ON users, auth_accounts, auth_sessions, auth_verifications TO haloai_auth;
  END IF;
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'haloai_app') THEN
    GRANT SELECT, INSERT, UPDATE, DELETE ON workspace_invitations TO haloai_app;
  END IF;
END
$$;
--> statement-breakpoint
CREATE POLICY users_auth_access ON users AS PERMISSIVE FOR ALL TO haloai_auth USING (true) WITH CHECK (true);
--> statement-breakpoint

-- 跨工作区发现只能由服务端从已验证会话传入 user_id；函数仅返回进入工作区所需的最小字段。
CREATE FUNCTION haloai_list_user_workspaces(p_user_id uuid)
RETURNS TABLE (
  workspace_id uuid,
  workspace_slug varchar,
  workspace_name text,
  actor_id uuid,
  membership_id uuid,
  role_key text
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = pg_catalog, public
STABLE
AS $$
  SELECT w.id,
         w.slug,
         w.name,
         ha.actor_id,
         wm.id,
         CASE WHEN wm.is_owner THEN 'owner' ELSE COALESCE(ar.built_in, 'member') END
  FROM public.human_actors ha
  JOIN public.workspace_memberships wm
    ON wm.workspace_id = ha.workspace_id AND wm.human_actor_id = ha.actor_id
  JOIN public.workspaces w ON w.id = ha.workspace_id
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
  WHERE ha.user_id = p_user_id
    AND wm.status = 'active'
    AND w.status = 'active'
  ORDER BY w.name, w.id
$$;
--> statement-breakpoint

CREATE FUNCTION haloai_resolve_membership(p_user_id uuid, p_workspace_id uuid)
RETURNS TABLE (workspace_id uuid, actor_id uuid, membership_id uuid, role_key text)
LANGUAGE sql
SECURITY DEFINER
SET search_path = pg_catalog, public
STABLE
AS $$
  SELECT ha.workspace_id,
         ha.actor_id,
         wm.id,
         CASE WHEN wm.is_owner THEN 'owner' ELSE COALESCE(ar.built_in, 'member') END
  FROM public.human_actors ha
  JOIN public.workspace_memberships wm
    ON wm.workspace_id = ha.workspace_id AND wm.human_actor_id = ha.actor_id
  JOIN public.workspaces w ON w.id = ha.workspace_id
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
  WHERE ha.user_id = p_user_id
    AND ha.workspace_id = p_workspace_id
    AND wm.status = 'active'
    AND w.status = 'active'
  LIMIT 1
$$;
--> statement-breakpoint

-- 邀请解析不返回令牌摘要，并且保持错误不可枚举；邮箱归属与过期状态仍由事务内再次校验。
CREATE FUNCTION haloai_resolve_invitation(p_token_digest text)
RETURNS TABLE (
  invitation_id uuid,
  workspace_id uuid,
  email text,
  requested_role varchar,
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
  SELECT i.id, i.workspace_id, i.email, i.requested_role, i.invited_by_actor_id,
         i.expires_at, i.accepted_by_user_id, i.accepted_at, i.revoked_at
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
         wm.status,
         wm.joined_at
  FROM public.workspace_memberships wm
  JOIN public.human_actors ha
    ON ha.workspace_id = wm.workspace_id AND ha.actor_id = wm.human_actor_id
  JOIN public.actors a
    ON a.workspace_id = ha.workspace_id AND a.id = ha.actor_id
  JOIN public.users u ON u.id = ha.user_id
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

REVOKE ALL ON FUNCTION haloai_list_user_workspaces(uuid) FROM public;
REVOKE ALL ON FUNCTION haloai_resolve_membership(uuid, uuid) FROM public;
REVOKE ALL ON FUNCTION haloai_resolve_invitation(text) FROM public;
REVOKE ALL ON FUNCTION haloai_list_workspace_members(uuid, uuid) FROM public;
--> statement-breakpoint
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'haloai_app') THEN
    GRANT EXECUTE ON FUNCTION haloai_list_user_workspaces(uuid) TO haloai_app;
    GRANT EXECUTE ON FUNCTION haloai_resolve_membership(uuid, uuid) TO haloai_app;
    GRANT EXECUTE ON FUNCTION haloai_resolve_invitation(text) TO haloai_app;
    GRANT EXECUTE ON FUNCTION haloai_list_workspace_members(uuid, uuid) TO haloai_app;
  END IF;
END
$$;
