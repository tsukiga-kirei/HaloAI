-- 仅用于本地开发容器。生产环境必须由密钥系统生成独立凭据，禁止复用这里的固定密码。
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'haloai_app') THEN
    CREATE ROLE haloai_app
      LOGIN
      PASSWORD 'haloai_app_local'
      NOSUPERUSER
      NOCREATEDB
      NOCREATEROLE
      NOINHERIT
      NOBYPASSRLS;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'haloai_auth') THEN
    CREATE ROLE haloai_auth
      LOGIN
      PASSWORD 'haloai_auth_local'
      NOSUPERUSER
      NOCREATEDB
      NOCREATEROLE
      NOINHERIT
      NOBYPASSRLS;
  END IF;
END
$$;
