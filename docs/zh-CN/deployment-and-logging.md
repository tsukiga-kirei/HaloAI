# 部署与诊断日志

English: [Deployment and diagnostic logging](../en-US/deployment-and-logging.md)

## 1. 目标与边界

HaloAI 当前阶段采用两套显式 Compose 文件：开发环境只容器化 PostgreSQL，应用进程在宿主机运行；生产环境把可上线的应用服务构建为不可变镜像并由 Compose 编排。部署配置不得把开发演示开关、迁移权限或明文密钥带入应用请求路径。

诊断日志用于排障和运行状态观察，不是安全审计事实。`audit_events`、Agent 运行事件和用量账本仍是独立的仅追加领域数据，不能用普通日志替代，也不能因为日志采集失败而静默跳过审计事务。

## 2. 环境形态

| 环境     | Compose 文件        | 容器                                            | 应用运行方式                                     | 日志落点                     |
| -------- | ------------------- | ----------------------------------------------- | ------------------------------------------------ | ---------------------------- |
| 本地开发 | `compose.dev.yaml`  | PostgreSQL                                      | Web、API、Collab、Worker 由 pnpm 在宿主机运行    | 终端与仓库 `logs/`           |
| 生产     | `compose.prod.yaml` | Gateway、Web、API、Worker、迁移任务、PostgreSQL | 镜像内已完成构建，Compose 负责健康检查与依赖顺序 | 容器标准输出，由 Docker 轮转 |

本地开发不得为了运行 Web 或 API 强制构建镜像。生产不得挂载源码、使用 watch 模式、自动写演示数据，或让 API/Worker 持有 `DATABASE_ADMIN_URL`。

协作服务镜像必须随生产镜像一起可构建，但在真实短期 ticket 授权端口和持久化适配器接入前，不进入默认生产启动集合。启用 profile 后仍应由进程的 fail-closed 检查拒绝不完整配置，禁止回退到演示内存适配器。

## 3. 诊断日志契约

API、Collab 和 Worker 使用同一结构化 Logger。每条 JSON 日志至少包含：

```text
time, level, service, environment, msg
```

请求或任务上下文存在时，应增加 `requestId`、`runId`、`workspaceId`、`jobId`、`traceId` 等可关联字段，但不得记录完整请求正文、Cookie、Authorization、会话 Token、数据库 URL、密码、模型密钥、工具凭据、完整提示词或文档内容。

统一 Logger 必须按字段名屏蔽常见秘密。异常日志默认只保存稳定错误类型和错误码；只有经过审查、确认不携带租户内容或凭据的字段才能追加。用户响应继续只包含稳定错误码与请求 ID。

## 4. 保存与轮转

### 本地

- `LOG_DIR=./logs` 时，API、Collab 和 Worker 分别写入 `logs/api.log`、`logs/collab.log`、`logs/worker.log`，同时保留终端输出。
- 根开发命令把 Web 与 Turborepo 的组合输出追加到 `logs/dev.log`。
- `logs/` 必须被 Git 和 Docker 构建上下文忽略；它只用于本机排障，不是耐久产品数据。
- 本地日志不会自动满足正式保留策略。开发者可按需删除，任何代码不得依赖这些文件恢复业务状态。

### 生产

- 应用只写 stdout/stderr，不在容器可写层创建日志文件。
- 所有长期运行服务统一使用 Docker `local` 日志驱动，并设置 `max-size` 与 `max-file`，避免单个容器无限占满宿主机磁盘。
- 运维入口为 `docker compose ... logs`；容器重建后，普通诊断日志不保证继续存在。
- 需要跨主机检索、告警或 30 天强制保留时，再把 stdout 接入集中采集器；OpenTelemetry 和集中日志后端仍属于后续可观测性阶段，不能把当前轮转文件描述成完整日志平台。

## 5. 生产启动顺序与安全

生产 Compose 必须按以下顺序收敛：

1. PostgreSQL 健康；
2. 数据库结构与 Graphile Worker 队列的一次性迁移任务使用独立管理员连接成功退出，并只向 Worker 运行角色授予队列对象使用权；
3. API 与 Worker 使用最小权限应用/认证连接启动；
4. Web 通过内部服务名访问 API；
5. TLS Gateway 通过 `GATEWAY_HTTP_PORT` 与 `GATEWAY_HTTPS_PORT` 配置宿主机端口并对外暴露 Web；容器内仍固定监听 80/443，数据库、API 和 Worker 不直接发布宿主机端口。

`.env.production` 只能存在于部署主机或密钥注入环境，必须被 Git 与镜像上下文忽略。生产必须设置独立强口令、至少 32 字符的认证密钥、公开 HTTPS 域名和 ACME 联系邮箱，并保持 `DEMO_MODE=false`。

## 6. 操作入口

```bash
pnpm infra:up       # 使用 compose.dev.yaml 启动本地 PostgreSQL
pnpm dev:local      # 迁移/种子后在宿主机启动 Web 与 API
pnpm prod:config    # 校验生产环境变量与 Compose 渲染结果
pnpm prod:build     # 构建全部生产镜像，包括暂不默认启动的 Collab 镜像
pnpm prod:up        # 迁移成功后启动默认生产服务
pnpm prod:logs      # 跟随生产容器日志
pnpm prod:down      # 停止生产栈；默认保留数据库卷
```

## 7. 验收条件

1. `docker compose -f compose.dev.yaml config` 只包含 PostgreSQL，且数据库数据使用命名卷。
2. 设置 `LOG_DIR` 后，API、Collab、Worker 的日志同时出现在终端和各自 JSONL 文件中，已知秘密字段显示为 `[REDACTED]`。
3. `compose.prod.yaml` 不挂载源码，不暴露数据库/API/Worker 端口，并为长期服务配置有界 Docker 日志轮转。
4. `migrate` 与 `worker-migrate` 使用 `DATABASE_ADMIN_URL`；API 和长期运行的 Worker 环境中不存在该变量。
5. Web、API、Worker、Collab 和迁移目标都能从同一已锁定依赖图构建镜像；默认生产启动不会以演示模式启动 Collab。
6. 生产配置缺少域名、数据库 URL、密码或认证密钥时，Compose 渲染或进程启动必须失败，而不是使用开发默认值。
7. 中英文文档、环境变量模板、启动脚本和 Compose 文件保持一致，并通过 `pnpm check`。
