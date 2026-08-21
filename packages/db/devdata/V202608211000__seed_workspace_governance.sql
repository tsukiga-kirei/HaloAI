-- 治理联调数据：一条已分配模型与若干仅追加审计事件。不含密钥明文、prompt 或工具参数。
INSERT INTO platform_models (
  id, name, provider, api_format, remote_model_id, base_url, context_window, status
) VALUES (
  '00000000-0000-4000-8000-000000000801',
  'Pilot Chat',
  'openai',
  'openai_chat_completions',
  'gpt-4.1-mini',
  NULL,
  128000,
  'active'
)
ON CONFLICT (provider, api_format, remote_model_id) DO UPDATE SET
  name = excluded.name,
  context_window = excluded.context_window,
  status = excluded.status,
  updated_at = now();

INSERT INTO workspace_model_allocations (
  id, workspace_id, model_id, status
) VALUES (
  '00000000-0000-4000-8000-000000000811',
  '00000000-0000-4000-8000-000000000101',
  '00000000-0000-4000-8000-000000000801',
  'active'
)
ON CONFLICT (workspace_id, model_id) DO UPDATE SET
  status = excluded.status,
  updated_at = now();

INSERT INTO audit_events (
  id,
  workspace_id,
  effective_principal_actor_id,
  workspace_membership_id,
  trace_id,
  action,
  resource_type,
  resource_id,
  decision,
  policy_version,
  outcome,
  sanitized_metadata,
  occurred_at
) VALUES
  (
    '00000000-0000-4000-8000-000000000901',
    '00000000-0000-4000-8000-000000000101',
    '00000000-0000-4000-8000-000000000201',
    '00000000-0000-4000-8000-000000000501',
    '00000000-0000-4000-8000-000000000911',
    'workspace.created',
    'workspace',
    '00000000-0000-4000-8000-000000000101',
    'allow',
    'v1',
    'succeeded',
    '{"name":"HaloAI Alpha","slug":"haloai-alpha"}'::jsonb,
    '2026-08-13 00:00:00+00'
  ),
  (
    '00000000-0000-4000-8000-000000000902',
    '00000000-0000-4000-8000-000000000101',
    '00000000-0000-4000-8000-000000000201',
    '00000000-0000-4000-8000-000000000501',
    '00000000-0000-4000-8000-000000000912',
    'member.invited',
    'invitation',
    '00000000-0000-4000-8000-000000000502',
    'allow',
    'v1',
    'succeeded',
    '{"email":"mina@haloai.dev","role":"member"}'::jsonb,
    '2026-08-13 00:10:00+00'
  ),
  (
    '00000000-0000-4000-8000-000000000903',
    '00000000-0000-4000-8000-000000000101',
    '00000000-0000-4000-8000-000000000202',
    '00000000-0000-4000-8000-000000000502',
    '00000000-0000-4000-8000-000000000913',
    'member.joined',
    'membership',
    '00000000-0000-4000-8000-000000000502',
    'allow',
    'v1',
    'succeeded',
    '{"email":"mina@haloai.dev","role":"member"}'::jsonb,
    '2026-08-13 00:20:00+00'
  ),
  (
    '00000000-0000-4000-8000-000000000904',
    '00000000-0000-4000-8000-000000000101',
    '00000000-0000-4000-8000-000000000201',
    '00000000-0000-4000-8000-000000000501',
    '00000000-0000-4000-8000-000000000914',
    'department.created',
    'department',
    '00000000-0000-4000-8000-000000000701',
    'allow',
    'v1',
    'succeeded',
    '{"name":"产品与设计","code":"product-design"}'::jsonb,
    '2026-08-19 02:00:00+00'
  ),
  (
    '00000000-0000-4000-8000-000000000905',
    '00000000-0000-4000-8000-000000000101',
    '00000000-0000-4000-8000-000000000201',
    '00000000-0000-4000-8000-000000000501',
    '00000000-0000-4000-8000-000000000915',
    'member.organization.updated',
    'membership',
    '00000000-0000-4000-8000-000000000503',
    'allow',
    'v1',
    'succeeded',
    '{"jobTitle":"空间管理员"}'::jsonb,
    '2026-08-19 02:10:00+00'
  )
ON CONFLICT (workspace_id, id) DO NOTHING;
