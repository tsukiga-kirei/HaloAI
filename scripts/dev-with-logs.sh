#!/usr/bin/env bash
# Web 没有接入服务端 Pino，因此根开发入口额外保留一份组合输出；各后端仍写自己的结构化文件。
set -euo pipefail

root=$(CDPATH= cd -- "$(dirname "$0")/.." && pwd)
cd "$root"
mkdir -p logs

mode=${1:-default}
if [[ "$mode" == "all" ]]; then
  filters=()
else
  filters=(--filter=@haloai/web --filter=@haloai/api)
fi

printf '\n[%s] HaloAI development session (%s)\n' "$(date -u +%Y-%m-%dT%H:%M:%SZ)" "$mode" >>logs/dev.log
exec > >(tee -a logs/dev.log) 2>&1
exec pnpm exec turbo dev --ui=stream "${filters[@]}"
