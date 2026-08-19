-- 部门与岗位只用于组织管理联调，不改变既有访问角色和 Capability 授权。
INSERT INTO workspace_departments (
  id, workspace_id, parent_id, name, code, description, manager_actor_id, status, sort_order
) VALUES
  (
    '00000000-0000-4000-8000-000000000701',
    '00000000-0000-4000-8000-000000000101',
    NULL,
    '产品与设计',
    'product-design',
    '负责产品规划、体验设计与交付验收。',
    '00000000-0000-4000-8000-000000000201',
    'active',
    10
  ),
  (
    '00000000-0000-4000-8000-000000000702',
    '00000000-0000-4000-8000-000000000101',
    '00000000-0000-4000-8000-000000000701',
    '产品运营',
    'product-operations',
    '负责空间运营、成员协同与治理流程。',
    '00000000-0000-4000-8000-000000000203',
    'active',
    20
  ),
  (
    '00000000-0000-4000-8000-000000000703',
    '00000000-0000-4000-8000-000000000101',
    NULL,
    '研发与智能体',
    'engineering-agents',
    '负责协作平台、自动化与 AI 成员能力。',
    '00000000-0000-4000-8000-000000000202',
    'active',
    30
  )
ON CONFLICT (workspace_id, code) DO UPDATE SET
  name = excluded.name,
  description = excluded.description,
  manager_actor_id = excluded.manager_actor_id,
  status = excluded.status,
  sort_order = excluded.sort_order,
  updated_at = now();

UPDATE workspace_memberships
SET department_id = '00000000-0000-4000-8000-000000000701',
    job_title = '空间负责人',
    updated_at = now()
WHERE id = '00000000-0000-4000-8000-000000000501';

UPDATE workspace_memberships
SET department_id = '00000000-0000-4000-8000-000000000703',
    job_title = '产品工程师',
    updated_at = now()
WHERE id = '00000000-0000-4000-8000-000000000502';

UPDATE workspace_memberships
SET department_id = '00000000-0000-4000-8000-000000000702',
    job_title = '空间管理员',
    updated_at = now()
WHERE id = '00000000-0000-4000-8000-000000000503';

UPDATE workspace_memberships
SET department_id = '00000000-0000-4000-8000-000000000701',
    job_title = '外部审阅者',
    updated_at = now()
WHERE id = '00000000-0000-4000-8000-000000000504';
