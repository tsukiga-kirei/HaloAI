-- 本地自定义角色与系统治理联调数据

-- 1. 预置 21 项协议级权限能力字典
INSERT INTO capabilities (key, description_key, risk) VALUES
  ('workspace.read', 'capWorkspaceReadDesc', 'low'),
  ('workspace.manage', 'capWorkspaceManageDesc', 'high'),
  ('workspace.security.manage', 'capWorkspaceSecurityManageDesc', 'critical'),
  ('member.invite', 'capMemberInviteDesc', 'medium'),
  ('member.manage', 'capMemberManageDesc', 'high'),
  ('agent.profile.read', 'capAgentProfileReadDesc', 'low'),
  ('agent.profile.create', 'capAgentProfileCreateDesc', 'medium'),
  ('agent.profile.publish', 'capAgentProfilePublishDesc', 'high'),
  ('agent.invoke', 'capAgentInvokeDesc', 'medium'),
  ('room.read', 'capRoomReadDesc', 'low'),
  ('room.manage', 'capRoomManageDesc', 'medium'),
  ('room.message.create', 'capRoomMessageCreateDesc', 'low'),
  ('document.read', 'capDocumentReadDesc', 'low'),
  ('document.edit', 'capDocumentEditDesc', 'medium'),
  ('document.proposal.create', 'capDocumentProposalCreateDesc', 'low'),
  ('document.proposal.review', 'capDocumentProposalReviewDesc', 'high'),
  ('document.publish', 'capDocumentPublishDesc', 'high'),
  ('integration.tool.read.execute', 'capIntegrationToolReadExecuteDesc', 'medium'),
  ('integration.tool.write.execute', 'capIntegrationToolWriteExecuteDesc', 'high'),
  ('approval.request', 'capApprovalRequestDesc', 'low'),
  ('approval.review', 'capApprovalReviewDesc', 'critical'),
  ('audit.read', 'capAuditReadDesc', 'high')
ON CONFLICT (key) DO NOTHING;

-- 2. 种子自定义角色：技术主管与安全合规员
INSERT INTO access_roles (
  id, workspace_id, key, name, description, status, built_in
) VALUES
  (
    '00000000-0000-4000-8000-000000000651',
    '00000000-0000-4000-8000-000000000101',
    'tech_lead',
    '技术负责人',
    '负责架构设计、AI 协作者审查与核心代码/文档提案合并。',
    'active',
    NULL
  ),
  (
    '00000000-0000-4000-8000-000000000652',
    '00000000-0000-4000-8000-000000000101',
    'compliance_officer',
    '合规与审计员',
    '负责工作空间安全策略审计、流水查看与高风险审批审查。',
    'active',
    NULL
  )
ON CONFLICT (workspace_id, key) DO UPDATE SET
  name = excluded.name,
  description = excluded.description,
  status = excluded.status,
  updated_at = now();

-- 3. 角色权限能力授予
INSERT INTO role_capability_grants (
  id, workspace_id, role_id, capability_key, effect, granted_by_actor_id
) VALUES
  ('00000000-0000-4000-8000-000000000661', '00000000-0000-4000-8000-000000000101', '00000000-0000-4000-8000-000000000651', 'workspace.read', 'allow', '00000000-0000-4000-8000-000000000201'),
  ('00000000-0000-4000-8000-000000000662', '00000000-0000-4000-8000-000000000101', '00000000-0000-4000-8000-000000000651', 'agent.profile.create', 'allow', '00000000-0000-4000-8000-000000000201'),
  ('00000000-0000-4000-8000-000000000663', '00000000-0000-4000-8000-000000000101', '00000000-0000-4000-8000-000000000651', 'room.manage', 'allow', '00000000-0000-4000-8000-000000000201'),
  ('00000000-0000-4000-8000-000000000664', '00000000-0000-4000-8000-000000000101', '00000000-0000-4000-8000-000000000651', 'document.proposal.review', 'allow', '00000000-0000-4000-8000-000000000201'),
  ('00000000-0000-4000-8000-000000000665', '00000000-0000-4000-8000-000000000101', '00000000-0000-4000-8000-000000000652', 'workspace.read', 'allow', '00000000-0000-4000-8000-000000000201'),
  ('00000000-0000-4000-8000-000000000666', '00000000-0000-4000-8000-000000000101', '00000000-0000-4000-8000-000000000652', 'audit.read', 'allow', '00000000-0000-4000-8000-000000000201'),
  ('00000000-0000-4000-8000-000000000667', '00000000-0000-4000-8000-000000000101', '00000000-0000-4000-8000-000000000652', 'approval.review', 'allow', '00000000-0000-4000-8000-000000000201')
ON CONFLICT (workspace_id, role_id, capability_key) DO NOTHING;

-- 4. 成员角色分配（将技术主管角色授予 Mina）
INSERT INTO actor_role_assignments (
  id, workspace_id, actor_id, role_id, scope, scope_id, status, granted_by_actor_id
) VALUES (
  '00000000-0000-4000-8000-000000000671',
  '00000000-0000-4000-8000-000000000101',
  '00000000-0000-4000-8000-000000000202',
  '00000000-0000-4000-8000-000000000651',
  'workspace',
  '00000000-0000-4000-8000-000000000101',
  'active',
  '00000000-0000-4000-8000-000000000201'
)
ON CONFLICT (workspace_id, actor_id, role_id, scope, scope_id) DO NOTHING;

-- 5. 平台系统公告与租户配额（通过 system_settings 表持久化）
INSERT INTO system_settings (key, value)
VALUES
  (
    'system_announcements',
    '[{"id":"00000000-0000-4000-8000-000000000681","title":"HaloAI 平台版本升级通知","content":"平台已全面上线 21 项细粒度权限矩阵、空间所有权转让与深度监控体系。","level":"info","active":true,"startsAt":"2026-08-21T00:00:00.000Z","createdAt":"2026-08-21T00:00:00.000Z"}]'
  ),
  (
    'tenant_quota_00000000-0000-4000-8000-000000000101',
    '{"maxMembers":50,"maxStorageBytes":107374182400,"maxMonthlyBudgetMicrocents":500000000}'
  )
ON CONFLICT (key) DO UPDATE SET value = excluded.value, updated_at = now();
