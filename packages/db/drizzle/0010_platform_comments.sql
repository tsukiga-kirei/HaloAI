-- 为后续加入的平台与组织表补齐中文 COMMENT。不改变列类型、约束或数据。

COMMENT ON COLUMN "system_administrators"."user_id" IS '平台管理员登录用户；不能由 Workspace Owner 推导';
COMMENT ON COLUMN "system_administrators"."status" IS 'active 才允许进入系统后台';
COMMENT ON COLUMN "system_administrators"."created_at" IS '创建时间';
COMMENT ON COLUMN "system_administrators"."updated_at" IS '最后更新时间';

COMMENT ON COLUMN "platform_models"."id" IS '主键';
COMMENT ON COLUMN "platform_models"."name" IS '目录显示名称';
COMMENT ON COLUMN "platform_models"."provider" IS '供应商标识';
COMMENT ON COLUMN "platform_models"."remote_model_id" IS '远端模型 ID';
COMMENT ON COLUMN "platform_models"."base_url" IS '可选的供应商接入地址';
COMMENT ON COLUMN "platform_models"."context_window" IS '上下文窗口 token 上限';
COMMENT ON COLUMN "platform_models"."status" IS '平台目录启停状态';
COMMENT ON COLUMN "platform_models"."created_at" IS '创建时间';
COMMENT ON COLUMN "platform_models"."updated_at" IS '最后更新时间';

COMMENT ON COLUMN "workspace_model_allocations"."id" IS '主键';
COMMENT ON COLUMN "workspace_model_allocations"."workspace_id" IS '被授权使用该模型的租户';
COMMENT ON COLUMN "workspace_model_allocations"."model_id" IS '平台模型目录项';
COMMENT ON COLUMN "workspace_model_allocations"."status" IS '分配状态；收回用 revoked 而不是删除事实';
COMMENT ON COLUMN "workspace_model_allocations"."created_at" IS '创建时间';
COMMENT ON COLUMN "workspace_model_allocations"."updated_at" IS '最后更新时间';

COMMENT ON COLUMN "system_settings"."key" IS '平台设置键';
COMMENT ON COLUMN "system_settings"."value" IS '已生效的设置值';
COMMENT ON COLUMN "system_settings"."created_at" IS '创建时间';
COMMENT ON COLUMN "system_settings"."updated_at" IS '最后更新时间';

COMMENT ON COLUMN "system_tenant_invitations"."id" IS '主键';
COMMENT ON COLUMN "system_tenant_invitations"."tenant_name" IS '激活后创建的租户名称';
COMMENT ON COLUMN "system_tenant_invitations"."tenant_slug" IS '激活后创建的租户 slug';
COMMENT ON COLUMN "system_tenant_invitations"."default_locale" IS '新租户默认语言';
COMMENT ON COLUMN "system_tenant_invitations"."time_zone" IS '新租户默认时区';
COMMENT ON COLUMN "system_tenant_invitations"."invited_by_user_id" IS '发出邀请的系统管理员';
COMMENT ON COLUMN "system_tenant_invitations"."expires_at" IS '邀请过期时间';
COMMENT ON COLUMN "system_tenant_invitations"."accepted_by_user_id" IS '完成激活的用户';
COMMENT ON COLUMN "system_tenant_invitations"."accepted_at" IS '激活时间';
COMMENT ON COLUMN "system_tenant_invitations"."revoked_at" IS '撤销时间';
COMMENT ON COLUMN "system_tenant_invitations"."created_at" IS '创建时间';
COMMENT ON COLUMN "system_tenant_invitations"."updated_at" IS '最后更新时间';

COMMENT ON COLUMN "workspace_departments"."id" IS '主键';
COMMENT ON COLUMN "workspace_departments"."workspace_id" IS '所属工作空间';
COMMENT ON COLUMN "workspace_departments"."parent_id" IS '上级部门；空表示根部门';
COMMENT ON COLUMN "workspace_departments"."name" IS '部门名称';
COMMENT ON COLUMN "workspace_departments"."code" IS '工作空间内唯一的部门编码';
COMMENT ON COLUMN "workspace_departments"."description" IS '部门说明';
COMMENT ON COLUMN "workspace_departments"."manager_actor_id" IS '部门负责人 Actor；不授予额外权限';
COMMENT ON COLUMN "workspace_departments"."status" IS '部门状态';
COMMENT ON COLUMN "workspace_departments"."sort_order" IS '同级排序';
COMMENT ON COLUMN "workspace_departments"."created_at" IS '创建时间';
COMMENT ON COLUMN "workspace_departments"."updated_at" IS '最后更新时间';
COMMENT ON COLUMN "workspace_invitations"."department_id" IS '邀请时预填的主部门';
COMMENT ON COLUMN "workspace_invitations"."job_title" IS '邀请时预填的岗位名称';
