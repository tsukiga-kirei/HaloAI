-- 认证会话策略写入平台设置表，系统管理页才能编辑并在签发新会话时生效。
INSERT INTO system_settings (key, value)
VALUES
  ('session_expires_in_seconds', '604800'),
  ('session_update_age_seconds', '86400'),
  ('sliding_renewal', 'true')
ON CONFLICT (key) DO NOTHING;
