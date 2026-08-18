CREATE TYPE "public"."model_allocation_status" AS ENUM('active', 'revoked');--> statement-breakpoint
CREATE TYPE "public"."platform_model_api_format" AS ENUM('openai_chat_completions', 'openai_responses', 'anthropic_messages', 'google_generate_content');--> statement-breakpoint
CREATE TYPE "public"."platform_model_status" AS ENUM('active', 'disabled');--> statement-breakpoint
CREATE TYPE "public"."system_administrator_status" AS ENUM('active', 'suspended');--> statement-breakpoint
CREATE TABLE "platform_models" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"provider" varchar(120) NOT NULL,
	"api_format" "platform_model_api_format" NOT NULL,
	"remote_model_id" varchar(200) NOT NULL,
	"base_url" text,
	"context_window" integer,
	"status" "platform_model_status" DEFAULT 'active' NOT NULL,
	"secret_ciphertext" text,
	"secret_iv" varchar(64),
	"secret_tag" varchar(64),
	"secret_key_version" varchar(64),
	"secret_hint" varchar(16),
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "platform_models_context_window_check" CHECK ("platform_models"."context_window" is null or "platform_models"."context_window" > 0),
	CONSTRAINT "platform_models_secret_tuple_check" CHECK (num_nonnulls("platform_models"."secret_ciphertext", "platform_models"."secret_iv", "platform_models"."secret_tag", "platform_models"."secret_key_version", "platform_models"."secret_hint") in (0, 5))
);
--> statement-breakpoint
CREATE TABLE "system_administrators" (
	"user_id" uuid PRIMARY KEY NOT NULL,
	"status" "system_administrator_status" DEFAULT 'active' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "system_settings" (
	"key" varchar(80) PRIMARY KEY NOT NULL,
	"value" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "system_settings_key_check" CHECK ("system_settings"."key" <> '')
);
--> statement-breakpoint
CREATE TABLE "workspace_model_allocations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"workspace_id" uuid NOT NULL,
	"model_id" uuid NOT NULL,
	"status" "model_allocation_status" DEFAULT 'active' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "system_administrators" ADD CONSTRAINT "system_administrators_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "workspace_model_allocations" ADD CONSTRAINT "workspace_model_allocations_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "workspace_model_allocations" ADD CONSTRAINT "workspace_model_allocations_model_id_platform_models_id_fk" FOREIGN KEY ("model_id") REFERENCES "public"."platform_models"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "platform_models_provider_remote_unique" ON "platform_models" USING btree ("provider","api_format","remote_model_id");--> statement-breakpoint
CREATE INDEX "platform_models_status_updated_idx" ON "platform_models" USING btree ("status","updated_at");--> statement-breakpoint
CREATE INDEX "system_administrators_status_idx" ON "system_administrators" USING btree ("status");--> statement-breakpoint
CREATE UNIQUE INDEX "workspace_model_allocations_unique" ON "workspace_model_allocations" USING btree ("workspace_id","model_id");--> statement-breakpoint
CREATE INDEX "workspace_model_allocations_workspace_status_idx" ON "workspace_model_allocations" USING btree ("workspace_id","status");--> statement-breakpoint

COMMENT ON TABLE "system_administrators" IS '独立的平台管理员授权，不从工作空间角色推导';
COMMENT ON TABLE "platform_models" IS '平台模型目录，密钥只保存 AES-256-GCM 密文';
COMMENT ON TABLE "workspace_model_allocations" IS '平台模型到租户的可用授权，不授予租户内容访问';
COMMENT ON TABLE "system_settings" IS '真正可在运行期生效的平台默认设置';
COMMENT ON COLUMN "platform_models"."api_format" IS '远端模型请求与响应协议格式';
COMMENT ON COLUMN "platform_models"."secret_ciphertext" IS 'API Key 的 AES-256-GCM 密文';
COMMENT ON COLUMN "platform_models"."secret_iv" IS '每次加密独立生成的随机 IV';
COMMENT ON COLUMN "platform_models"."secret_tag" IS 'AES-GCM 认证标签';
COMMENT ON COLUMN "platform_models"."secret_key_version" IS '用于轮换主密钥的版本标识';
--> statement-breakpoint

-- 平台身份与跨租户目录必须在数据库边界再次校验，应用角色不能直接绕过租户 RLS 扫描工作区。
CREATE FUNCTION haloai_is_system_administrator(p_user_id uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = pg_catalog, public
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.system_administrators administrator
    JOIN public.users app_user ON app_user.id = administrator.user_id
    WHERE administrator.user_id = p_user_id
      AND administrator.status = 'active'
      AND app_user.status = 'active'
  )
$$;
--> statement-breakpoint

CREATE FUNCTION haloai_system_overview(p_user_id uuid)
RETURNS TABLE (
  tenant_total bigint,
  active_tenant_total bigint,
  model_total bigint,
  active_model_total bigint
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = pg_catalog, public
STABLE
AS $$
  SELECT
    (SELECT count(*) FROM public.workspaces),
    (SELECT count(*) FROM public.workspaces WHERE status = 'active'),
    (SELECT count(*) FROM public.platform_models),
    (SELECT count(*) FROM public.platform_models WHERE status = 'active')
  WHERE public.haloai_is_system_administrator(p_user_id)
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
    count(membership.id) FILTER (WHERE membership.status = 'active'),
    workspace.created_at,
    count(*) OVER ()
  FROM public.workspaces workspace
  LEFT JOIN public.workspace_memberships membership
    ON membership.workspace_id = workspace.id
  WHERE public.haloai_is_system_administrator(p_user_id)
    AND (
      coalesce(nullif(trim(p_query), ''), '') = ''
      OR workspace.name ILIKE '%' || trim(p_query) || '%'
      OR workspace.slug ILIKE '%' || trim(p_query) || '%'
    )
  GROUP BY workspace.id
  ORDER BY workspace.created_at DESC, workspace.id
  LIMIT greatest(1, least(p_limit, 100))
  OFFSET greatest(p_offset, 0)
$$;
--> statement-breakpoint

CREATE FUNCTION haloai_system_update_tenant(
  p_user_id uuid,
  p_workspace_id uuid,
  p_status workspace_status,
  p_default_locale varchar,
  p_time_zone varchar
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $$
BEGIN
  IF NOT public.haloai_is_system_administrator(p_user_id) THEN
    RETURN false;
  END IF;
  UPDATE public.workspaces
  SET status = p_status,
      default_locale = p_default_locale,
      time_zone = p_time_zone,
      updated_at = now()
  WHERE id = p_workspace_id;
  RETURN FOUND;
END
$$;
--> statement-breakpoint

CREATE FUNCTION haloai_system_list_model_allocations(p_user_id uuid)
RETURNS TABLE (
  allocation_id uuid,
  model_id uuid,
  workspace_id uuid,
  workspace_name text,
  allocation_status model_allocation_status
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = pg_catalog, public
STABLE
AS $$
  SELECT allocation.id,
         allocation.model_id,
         allocation.workspace_id,
         workspace.name,
         allocation.status
  FROM public.workspace_model_allocations allocation
  JOIN public.workspaces workspace ON workspace.id = allocation.workspace_id
  WHERE public.haloai_is_system_administrator(p_user_id)
  ORDER BY workspace.name, allocation.created_at
$$;
--> statement-breakpoint

CREATE FUNCTION haloai_system_set_model_allocation(
  p_user_id uuid,
  p_model_id uuid,
  p_workspace_id uuid,
  p_enabled boolean
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $$
BEGIN
  IF NOT public.haloai_is_system_administrator(p_user_id) THEN
    RETURN false;
  END IF;
  INSERT INTO public.workspace_model_allocations (workspace_id, model_id, status)
  VALUES (p_workspace_id, p_model_id, CASE WHEN p_enabled THEN 'active'::model_allocation_status ELSE 'revoked'::model_allocation_status END)
  ON CONFLICT (workspace_id, model_id)
  DO UPDATE SET status = excluded.status, updated_at = now();
  RETURN true;
END
$$;
--> statement-breakpoint

REVOKE ALL ON FUNCTION haloai_is_system_administrator(uuid) FROM public;
REVOKE ALL ON FUNCTION haloai_system_overview(uuid) FROM public;
REVOKE ALL ON FUNCTION haloai_system_list_tenants(uuid, text, integer, integer) FROM public;
REVOKE ALL ON FUNCTION haloai_system_update_tenant(uuid, uuid, workspace_status, varchar, varchar) FROM public;
REVOKE ALL ON FUNCTION haloai_system_list_model_allocations(uuid) FROM public;
REVOKE ALL ON FUNCTION haloai_system_set_model_allocation(uuid, uuid, uuid, boolean) FROM public;
--> statement-breakpoint

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'haloai_app') THEN
    GRANT SELECT, INSERT, UPDATE ON platform_models, workspace_model_allocations, system_settings TO haloai_app;
    GRANT EXECUTE ON FUNCTION haloai_is_system_administrator(uuid) TO haloai_app;
    GRANT EXECUTE ON FUNCTION haloai_system_overview(uuid) TO haloai_app;
    GRANT EXECUTE ON FUNCTION haloai_system_list_tenants(uuid, text, integer, integer) TO haloai_app;
    GRANT EXECUTE ON FUNCTION haloai_system_update_tenant(uuid, uuid, workspace_status, varchar, varchar) TO haloai_app;
    GRANT EXECUTE ON FUNCTION haloai_system_list_model_allocations(uuid) TO haloai_app;
    GRANT EXECUTE ON FUNCTION haloai_system_set_model_allocation(uuid, uuid, uuid, boolean) TO haloai_app;
  END IF;
END
$$;
