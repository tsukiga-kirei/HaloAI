# drizzle

本目录只保存**表结构迁移**：由 Drizzle Kit 从 `packages/db/src/schema` 生成的可审查 SQL，以及配套的 `meta/` 快照。

- 真实表、索引、约束、RLS、权限与结构性数据（例如协议级 Capability 目录）放这里。
- 本地演示账号、演示工作空间、演示房间与消息**不得**写入本目录。
- 虚拟数据放在 `packages/db/devdata/`，只在 `DEMO_MODE=true` 时由 `pnpm db:seed` 执行。
- 已进入共享环境的迁移只向前追加，禁止改写。
