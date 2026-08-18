#!/bin/sh
# 本地 Postgres 优先读取 .env.local，没有则回退 .env.example，避免 compose 读不到 Node 使用的环境文件。
set -eu
root=$(CDPATH= cd -- "$(dirname "$0")/.." && pwd)
cd "$root"
env_files="--env-file .env.example"
if [ -f .env.local ]; then
  env_files="$env_files --env-file .env.local"
fi
# shellcheck disable=SC2086
exec docker compose $env_files up -d postgres --wait
