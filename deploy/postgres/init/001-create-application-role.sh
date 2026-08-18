#!/bin/sh
# 仅在数据目录为空时由官方 Postgres 镜像执行。
# 角色名和密码来自容器环境变量，与 .env.local / 生产密钥对齐；禁止在仓库写死生产口令。
set -eu

require_ident() {
  name=$1
  label=$2
  case $name in
    '' | *[!a-zA-Z0-9_]*)
      echo "$label 只能包含字母、数字和下划线：$name" >&2
      exit 1
      ;;
  esac
}

sql_literal() {
  printf "%s" "$1" | sed "s/'/''/g"
}

create_login_role() {
  name=$1
  password=$2
  require_ident "$name" "数据库角色名"
  escaped=$(sql_literal "$password")
  psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname "$POSTGRES_DB" <<SQL
DO \$\$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = '${name}') THEN
    CREATE ROLE ${name}
      LOGIN
      PASSWORD '${escaped}'
      NOSUPERUSER
      NOCREATEDB
      NOCREATEROLE
      NOINHERIT
      NOBYPASSRLS;
  END IF;
END
\$\$;
SQL
}

: "${POSTGRES_USER:?POSTGRES_USER 未设置}"
: "${POSTGRES_DB:?POSTGRES_DB 未设置}"
: "${HALOAI_APP_USER:?HALOAI_APP_USER 未设置}"
: "${HALOAI_APP_PASSWORD:?HALOAI_APP_PASSWORD 未设置}"
: "${HALOAI_AUTH_USER:?HALOAI_AUTH_USER 未设置}"
: "${HALOAI_AUTH_PASSWORD:?HALOAI_AUTH_PASSWORD 未设置}"

create_login_role "$HALOAI_APP_USER" "$HALOAI_APP_PASSWORD"
create_login_role "$HALOAI_AUTH_USER" "$HALOAI_AUTH_PASSWORD"
