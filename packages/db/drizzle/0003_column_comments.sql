-- 为已有表补充中文字段注释，便于数据库工具与运维审阅。不改变列类型或约束。
COMMENT ON TABLE "users" IS '跨工作空间的人类登录身份，不含密码与会话';
COMMENT ON COLUMN "users"."id" IS '用户主键';
COMMENT ON COLUMN "users"."name" IS '显示名称';
COMMENT ON COLUMN "users"."primary_email" IS '主邮箱，登录与邀请校验使用';
COMMENT ON COLUMN "users"."email_verified" IS '主邮箱是否已验证';
COMMENT ON COLUMN "users"."email_verified_at" IS '邮箱验证时间；兼容旧数据后可移除';
COMMENT ON COLUMN "users"."image" IS '头像引用';
COMMENT ON COLUMN "users"."preferred_locale" IS '界面语言偏好';
COMMENT ON COLUMN "users"."time_zone" IS '用户时区';
COMMENT ON COLUMN "users"."status" IS '账户状态：active / suspended / deleted';
COMMENT ON COLUMN "users"."deleted_at" IS '软删除时间';
COMMENT ON COLUMN "users"."created_at" IS '创建时间';
COMMENT ON COLUMN "users"."updated_at" IS '最后更新时间';

COMMENT ON TABLE "workspaces" IS '租户根，id 即 workspace_id';
COMMENT ON COLUMN "workspaces"."id" IS '工作空间主键';
COMMENT ON COLUMN "workspaces"."slug" IS '对外短地址';
COMMENT ON COLUMN "workspaces"."name" IS '工作空间显示名称';
COMMENT ON COLUMN "workspaces"."status" IS '工作空间状态';
COMMENT ON COLUMN "workspaces"."default_locale" IS '默认界面语言';
COMMENT ON COLUMN "workspaces"."time_zone" IS '工作空间时区';
COMMENT ON COLUMN "workspaces"."retention_policy_version" IS '保留策略版本';
COMMENT ON COLUMN "workspaces"."created_by_user_id" IS '创建人用户 ID';
COMMENT ON COLUMN "workspaces"."archived_at" IS '归档时间';

COMMENT ON TABLE "actors" IS '工作空间内的人、AI 或系统主体';
COMMENT ON COLUMN "actors"."id" IS 'Actor 主键';
COMMENT ON COLUMN "actors"."workspace_id" IS '所属工作空间';
COMMENT ON COLUMN "actors"."kind" IS '主体类型：human / agent / system';
COMMENT ON COLUMN "actors"."status" IS '主体状态';
COMMENT ON COLUMN "actors"."display_name" IS '显示名称';
COMMENT ON COLUMN "actors"."handle" IS '工作空间内唯一句柄';
COMMENT ON COLUMN "actors"."avatar_reference" IS '头像引用';

COMMENT ON TABLE "human_actors" IS '人类用户与租户 Actor 的一对一绑定';
COMMENT ON COLUMN "human_actors"."actor_id" IS '对应 actors 主键';
COMMENT ON COLUMN "human_actors"."workspace_id" IS '所属工作空间';
COMMENT ON COLUMN "human_actors"."user_id" IS '绑定的登录用户';

COMMENT ON TABLE "workspace_memberships" IS '工作空间成员资格与 Owner 标记';
COMMENT ON COLUMN "workspace_memberships"."id" IS '成员资格主键';
COMMENT ON COLUMN "workspace_memberships"."workspace_id" IS '所属工作空间';
COMMENT ON COLUMN "workspace_memberships"."human_actor_id" IS '人类 Actor';
COMMENT ON COLUMN "workspace_memberships"."status" IS '成员状态';
COMMENT ON COLUMN "workspace_memberships"."is_owner" IS '是否为工作空间所有者';

COMMENT ON TABLE "projects" IS '工作空间内的项目容器';
COMMENT ON COLUMN "projects"."id" IS '项目主键';
COMMENT ON COLUMN "projects"."workspace_id" IS '所属工作空间';
COMMENT ON COLUMN "projects"."name" IS '项目名称';
COMMENT ON COLUMN "projects"."status" IS '项目状态';

COMMENT ON TABLE "rooms" IS '项目房间，承载对话与协作目标';
COMMENT ON COLUMN "rooms"."id" IS '房间主键';
COMMENT ON COLUMN "rooms"."workspace_id" IS '所属工作空间';
COMMENT ON COLUMN "rooms"."project_id" IS '所属项目';
COMMENT ON COLUMN "rooms"."name" IS '房间名称';
COMMENT ON COLUMN "rooms"."goal" IS '房间目标';
COMMENT ON COLUMN "rooms"."status" IS '房间状态';

COMMENT ON TABLE "messages" IS '房间消息事实，仅追加';
COMMENT ON COLUMN "messages"."id" IS '消息主键';
COMMENT ON COLUMN "messages"."workspace_id" IS '所属工作空间';
COMMENT ON COLUMN "messages"."room_id" IS '所属房间';
COMMENT ON COLUMN "messages"."author_actor_id" IS '作者 Actor';
COMMENT ON COLUMN "messages"."kind" IS '消息类型';
COMMENT ON COLUMN "messages"."status" IS '消息状态';

COMMENT ON TABLE "documents" IS '共享文档元数据';
COMMENT ON COLUMN "documents"."id" IS '文档主键';
COMMENT ON COLUMN "documents"."workspace_id" IS '所属工作空间';
COMMENT ON COLUMN "documents"."title" IS '文档标题';
COMMENT ON COLUMN "documents"."status" IS '文档状态';
COMMENT ON COLUMN "documents"."owner_actor_id" IS '负责人 Actor';

COMMENT ON TABLE "auth_accounts" IS '认证组件独占的账户凭据，业务代码不得读取密码哈希';
COMMENT ON COLUMN "auth_accounts"."id" IS '认证账户主键';
COMMENT ON COLUMN "auth_accounts"."user_id" IS '绑定的用户';
COMMENT ON COLUMN "auth_accounts"."provider_id" IS '认证提供者';
COMMENT ON COLUMN "auth_accounts"."password" IS '密码哈希，仅认证角色可访问';

COMMENT ON TABLE "auth_sessions" IS '登录会话，token 为高熵不透明凭据';
COMMENT ON COLUMN "auth_sessions"."id" IS '会话主键';
COMMENT ON COLUMN "auth_sessions"."token" IS '会话令牌';
COMMENT ON COLUMN "auth_sessions"."user_id" IS '会话所属用户';
COMMENT ON COLUMN "auth_sessions"."expires_at" IS '过期时间';

COMMENT ON TABLE "agent_profiles" IS '具名 AI 人设，与登录会话分离';
COMMENT ON COLUMN "agent_profiles"."id" IS '人设主键';
COMMENT ON COLUMN "agent_profiles"."workspace_id" IS '所属工作空间';
COMMENT ON COLUMN "agent_profiles"."name" IS 'AI 显示名称';
COMMENT ON COLUMN "agent_profiles"."status" IS '人设状态';

COMMENT ON TABLE "audit_events" IS '可审计操作记录';
COMMENT ON COLUMN "audit_events"."id" IS '审计事件主键';
COMMENT ON COLUMN "audit_events"."workspace_id" IS '所属工作空间';
COMMENT ON COLUMN "audit_events"."action" IS '动作标识';
COMMENT ON COLUMN "audit_events"."effective_principal_actor_id" IS '实际生效的操作主体';
COMMENT ON COLUMN "audit_events"."outcome" IS '结果';

COMMENT ON TABLE "approvals" IS '高风险操作的人工审批';
COMMENT ON COLUMN "approvals"."id" IS '审批主键';
COMMENT ON COLUMN "approvals"."workspace_id" IS '所属工作空间';
COMMENT ON COLUMN "approvals"."status" IS '审批状态';
COMMENT ON COLUMN "approvals"."requested_by_actor_id" IS '申请人';

COMMENT ON TABLE "auth_verifications" IS '邮箱验证与密码重置的短期凭据';
COMMENT ON COLUMN "auth_verifications"."identifier" IS '验证对象，通常为邮箱';
COMMENT ON COLUMN "auth_verifications"."value" IS '一次性验证值';
COMMENT ON COLUMN "auth_verifications"."expires_at" IS '过期时间';

COMMENT ON TABLE "workspace_invitations" IS '工作空间邀请，绑定邮箱与角色';
COMMENT ON COLUMN "workspace_invitations"."workspace_id" IS '所属工作空间';
COMMENT ON COLUMN "workspace_invitations"."email" IS '被邀请人邮箱';
COMMENT ON COLUMN "workspace_invitations"."requested_role" IS '接受后授予的访问角色';

COMMENT ON TABLE "access_roles" IS '工作空间内的访问角色，与 Actor 和人设分离';
COMMENT ON COLUMN "access_roles"."key" IS '角色稳定键';
COMMENT ON COLUMN "access_roles"."name" IS '角色显示名';

COMMENT ON TABLE "capabilities" IS '可授予的能力目录';
COMMENT ON COLUMN "capabilities"."key" IS '能力稳定键';

COMMENT ON TABLE "agent_runs" IS '一次 Agent 运行的耐久记录';
COMMENT ON COLUMN "agent_runs"."workspace_id" IS '所属工作空间';
COMMENT ON COLUMN "agent_runs"."status" IS '运行状态';
COMMENT ON COLUMN "agent_runs"."delegated_by_actor_id" IS '委托人 Actor';

COMMENT ON TABLE "outbox_events" IS '可靠投递的领域事件发件箱';
COMMENT ON COLUMN "outbox_events"."event_type" IS '事件类型';
COMMENT ON COLUMN "outbox_events"."payload" IS '事件载荷';

COMMENT ON TABLE "yjs_updates" IS '协作文档的 Yjs 增量更新';
COMMENT ON COLUMN "yjs_updates"."document_id" IS '所属文档';
COMMENT ON COLUMN "yjs_updates"."update" IS '二进制增量';

COMMENT ON TABLE "document_proposals" IS '文档修改提案，采纳前不进入正文';
COMMENT ON COLUMN "document_proposals"."document_id" IS '目标文档';
COMMENT ON COLUMN "document_proposals"."status" IS '提案状态';
