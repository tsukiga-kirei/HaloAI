CREATE TABLE "system_tenant_invitations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"token_digest" text NOT NULL,
	"tenant_name" text NOT NULL,
	"tenant_slug" varchar(63) NOT NULL,
	"default_locale" varchar(16) NOT NULL,
	"time_zone" varchar(64) NOT NULL,
	"administrator_email" text NOT NULL,
	"invited_by_user_id" uuid NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"accepted_by_user_id" uuid,
	"accepted_at" timestamp with time zone,
	"revoked_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "system_tenant_invitations_acceptance_check" CHECK (("system_tenant_invitations"."accepted_at" is null and "system_tenant_invitations"."accepted_by_user_id" is null) or ("system_tenant_invitations"."accepted_at" is not null and "system_tenant_invitations"."accepted_by_user_id" is not null))
);
--> statement-breakpoint
ALTER TABLE "system_tenant_invitations" ADD CONSTRAINT "system_tenant_invitations_invited_by_user_id_users_id_fk" FOREIGN KEY ("invited_by_user_id") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "system_tenant_invitations" ADD CONSTRAINT "system_tenant_invitations_accepted_by_user_id_users_id_fk" FOREIGN KEY ("accepted_by_user_id") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "system_tenant_invitations_token_digest_unique" ON "system_tenant_invitations" USING btree ("token_digest");--> statement-breakpoint
CREATE UNIQUE INDEX "system_tenant_invitations_pending_slug_unique" ON "system_tenant_invitations" USING btree ("tenant_slug") WHERE "system_tenant_invitations"."accepted_at" is null and "system_tenant_invitations"."revoked_at" is null;--> statement-breakpoint
CREATE INDEX "system_tenant_invitations_email_expires_idx" ON "system_tenant_invitations" USING btree ("administrator_email","expires_at");
--> statement-breakpoint

COMMENT ON TABLE system_tenant_invitations IS '未注册默认管理员的租户激活邀请，只保存令牌摘要';
COMMENT ON COLUMN system_tenant_invitations.token_digest IS '一次性激活令牌 SHA-256 摘要';
COMMENT ON COLUMN system_tenant_invitations.administrator_email IS '激活后成为 Owner 的绑定邮箱';
--> statement-breakpoint

/**
 * 系统管理员只能读取成员治理元数据。函数不连接房间、消息、文档或模型上下文，且每次调用
 * 都重新验证独立平台授权，不能由 Workspace Owner 身份推导。
 */
CREATE FUNCTION haloai_system_list_tenant_members(
  p_user_id uuid,
  p_workspace_id uuid,
  p_query text,
  p_limit integer,
  p_offset integer
)
RETURNS TABLE (
  membership_id uuid,
  actor_id uuid,
  member_name text,
  member_email text,
  role_key text,
  membership_status membership_status,
  department_name text,
  job_title varchar,
  joined_at timestamptz,
  total_count bigint
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = pg_catalog, public
STABLE
AS $$
  SELECT
    membership.id,
    actor.id,
    actor.display_name,
    app_user.primary_email,
    coalesce(access_role.built_in, CASE WHEN membership.is_owner THEN 'owner' ELSE 'member' END),
    membership.status,
    department.name,
    membership.job_title,
    membership.joined_at,
    count(*) OVER ()
  FROM public.workspace_memberships membership
  JOIN public.human_actors human_actor
    ON human_actor.workspace_id = membership.workspace_id
   AND human_actor.actor_id = membership.human_actor_id
  JOIN public.actors actor
    ON actor.workspace_id = human_actor.workspace_id
   AND actor.id = human_actor.actor_id
  JOIN public.users app_user ON app_user.id = human_actor.user_id
  LEFT JOIN public.workspace_departments department
    ON department.workspace_id = membership.workspace_id
   AND department.id = membership.department_id
  LEFT JOIN LATERAL (
    SELECT role.built_in
    FROM public.actor_role_assignments assignment
    JOIN public.access_roles role
      ON role.workspace_id = assignment.workspace_id
     AND role.id = assignment.role_id
    WHERE assignment.workspace_id = membership.workspace_id
      AND assignment.actor_id = membership.human_actor_id
      AND assignment.scope = 'workspace'
      AND assignment.scope_id = membership.workspace_id
      AND assignment.status = 'active'
      AND role.built_in IS NOT NULL
    ORDER BY CASE role.built_in
      WHEN 'owner' THEN 1 WHEN 'admin' THEN 2 WHEN 'member' THEN 3 ELSE 4
    END
    LIMIT 1
  ) access_role ON true
  WHERE public.haloai_is_system_administrator(p_user_id)
    AND membership.workspace_id = p_workspace_id
    AND (
      coalesce(nullif(trim(p_query), ''), '') = ''
      OR actor.display_name ILIKE '%' || trim(p_query) || '%'
      OR app_user.primary_email ILIKE '%' || trim(p_query) || '%'
      OR coalesce(department.name, '') ILIKE '%' || trim(p_query) || '%'
      OR membership.job_title ILIKE '%' || trim(p_query) || '%'
    )
  ORDER BY membership.created_at, membership.id
  LIMIT greatest(1, least(p_limit, 100))
  OFFSET greatest(p_offset, 0)
$$;
--> statement-breakpoint

/**
 * 已注册邮箱沿用现有账户凭据并立即创建租户；未注册邮箱只写入摘要邀请。这里绝不创建密码，
 * 也不在激活前创建缺少 Owner 的 Workspace。
 */
CREATE FUNCTION haloai_system_prepare_tenant(
  p_user_id uuid,
  p_name text,
  p_slug varchar,
  p_default_locale varchar,
  p_time_zone varchar,
  p_default_administrator_email text,
  p_invitation_id uuid,
  p_token_digest text,
  p_expires_at timestamptz
)
RETURNS TABLE (workspace_id uuid, invitation_id uuid)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $$
DECLARE
  v_existing_user_id uuid;
  v_workspace_id uuid;
BEGIN
  IF NOT public.haloai_is_system_administrator(p_user_id) THEN
    RETURN;
  END IF;

  SELECT app_user.id INTO v_existing_user_id
  FROM public.users app_user
  WHERE lower(app_user.primary_email) = lower(trim(p_default_administrator_email))
    AND app_user.status = 'active'
  LIMIT 1;

  IF v_existing_user_id IS NOT NULL THEN
    v_workspace_id := public.haloai_system_create_tenant(
      p_user_id,
      p_name,
      p_slug,
      p_default_locale,
      p_time_zone,
      p_default_administrator_email
    );
    RETURN QUERY SELECT v_workspace_id, NULL::uuid;
    RETURN;
  END IF;

  UPDATE public.system_tenant_invitations
  SET revoked_at = now(), updated_at = now()
  WHERE tenant_slug = p_slug
    AND accepted_at IS NULL
    AND revoked_at IS NULL;

  INSERT INTO public.system_tenant_invitations (
    id, token_digest, tenant_name, tenant_slug, default_locale, time_zone,
    administrator_email, invited_by_user_id, expires_at
  ) VALUES (
    p_invitation_id, p_token_digest, p_name, p_slug, p_default_locale, p_time_zone,
    lower(trim(p_default_administrator_email)), p_user_id, p_expires_at
  );
  RETURN QUERY SELECT NULL::uuid, p_invitation_id;
END
$$;
--> statement-breakpoint

CREATE FUNCTION haloai_system_resolve_tenant_invitation(p_token_digest text)
RETURNS TABLE (tenant_name text, administrator_email text, expires_at timestamptz)
LANGUAGE sql
SECURITY DEFINER
SET search_path = pg_catalog, public
STABLE
AS $$
  SELECT invitation.tenant_name, invitation.administrator_email, invitation.expires_at
  FROM public.system_tenant_invitations invitation
  WHERE invitation.token_digest = p_token_digest
    AND invitation.accepted_at IS NULL
    AND invitation.revoked_at IS NULL
    AND invitation.expires_at > now()
  LIMIT 1
$$;
--> statement-breakpoint

CREATE FUNCTION haloai_system_accept_tenant_invitation(
  p_user_id uuid,
  p_email text,
  p_token_digest text
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $$
DECLARE
  v_invitation public.system_tenant_invitations%ROWTYPE;
  v_workspace_id uuid;
BEGIN
  SELECT invitation.* INTO v_invitation
  FROM public.system_tenant_invitations invitation
  WHERE invitation.token_digest = p_token_digest
  FOR UPDATE;

  IF v_invitation.id IS NULL
    OR v_invitation.accepted_at IS NOT NULL
    OR v_invitation.revoked_at IS NOT NULL
    OR v_invitation.expires_at <= now()
    OR lower(v_invitation.administrator_email) <> lower(trim(p_email))
    OR NOT EXISTS (
      SELECT 1 FROM public.users app_user
      WHERE app_user.id = p_user_id
        AND lower(app_user.primary_email) = lower(trim(p_email))
        AND app_user.status = 'active'
    )
  THEN
    RETURN NULL;
  END IF;

  v_workspace_id := public.haloai_system_create_tenant(
    v_invitation.invited_by_user_id,
    v_invitation.tenant_name,
    v_invitation.tenant_slug,
    v_invitation.default_locale,
    v_invitation.time_zone,
    v_invitation.administrator_email
  );
  IF v_workspace_id IS NULL THEN
    RETURN NULL;
  END IF;

  UPDATE public.system_tenant_invitations
  SET accepted_by_user_id = p_user_id, accepted_at = now(), updated_at = now()
  WHERE id = v_invitation.id;
  RETURN v_workspace_id;
END
$$;
--> statement-breakpoint

REVOKE ALL ON FUNCTION haloai_system_list_tenant_members(uuid, uuid, text, integer, integer) FROM public;
REVOKE ALL ON FUNCTION haloai_system_prepare_tenant(uuid, text, varchar, varchar, varchar, text, uuid, text, timestamptz) FROM public;
REVOKE ALL ON FUNCTION haloai_system_resolve_tenant_invitation(text) FROM public;
REVOKE ALL ON FUNCTION haloai_system_accept_tenant_invitation(uuid, text, text) FROM public;
--> statement-breakpoint

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'haloai_app') THEN
    GRANT EXECUTE ON FUNCTION haloai_system_list_tenant_members(uuid, uuid, text, integer, integer) TO haloai_app;
    GRANT EXECUTE ON FUNCTION haloai_system_prepare_tenant(uuid, text, varchar, varchar, varchar, text, uuid, text, timestamptz) TO haloai_app;
    GRANT EXECUTE ON FUNCTION haloai_system_resolve_tenant_invitation(text) TO haloai_app;
    GRANT EXECUTE ON FUNCTION haloai_system_accept_tenant_invitation(uuid, text, text) TO haloai_app;
  END IF;
END
$$;
