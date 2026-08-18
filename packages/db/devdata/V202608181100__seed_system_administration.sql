-- 本地系统管理种子与工作空间角色分离。Owner 账号同时获得平台授权只是为了本地端到端联调，
-- 生产环境必须通过受控运营流程单独创建 system_administrators 记录。
INSERT INTO system_administrators (user_id, status)
VALUES ('00000000-0000-4000-8000-000000000001', 'active')
ON CONFLICT (user_id) DO UPDATE SET status = excluded.status, updated_at = now();

INSERT INTO system_settings (key, value)
VALUES ('default_locale', 'zh-CN')
ON CONFLICT (key) DO NOTHING;
