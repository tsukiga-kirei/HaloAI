#!/usr/bin/env bash
# Web 没有接入服务端 Pino，因此根开发入口额外保留一份组合输出；各后端仍写自己的结构化文件。
set -euo pipefail

root=$(CDPATH= cd -- "$(dirname "$0")/.." && pwd)
cd "$root"
mkdir -p logs

mode=${1:-default}

printf '\n[%s] HaloAI development session (%s)\n' "$(date -u +%Y-%m-%dT%H:%M:%SZ)" "$mode" >>logs/dev.log
exec > >(tee -a logs/dev.log) 2>&1
# macOS 自带 Bash 3.2 在 nounset 下展开空数组会直接退出；all 模式必须完全省略参数。
if [[ "$mode" == "all" ]]; then
  exec pnpm exec turbo dev --ui=stream
fi
exec pnpm exec turbo dev --ui=stream --filter=@haloai/web --filter=@haloai/api
