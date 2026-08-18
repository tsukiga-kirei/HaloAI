#!/bin/sh
# 生产命令必须显式读取部署机密文件，避免 Docker Compose 意外回退到开发环境变量。
set -eu

root=$(CDPATH= cd -- "$(dirname "$0")/.." && pwd)
cd "$root"

if [ ! -f .env.production ]; then
  echo "缺少 .env.production；请先复制 .env.production.example 并替换所有 change_me 值。" >&2
  exit 1
fi

if grep -q "change_me" .env.production; then
  echo ".env.production 仍包含 change_me 占位值，拒绝执行生产 Compose。" >&2
  exit 1
fi

exec docker compose --env-file .env.production -f compose.prod.yaml "$@"
