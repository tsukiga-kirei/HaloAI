# devdata

本地联调虚拟数据：与表结构目录分离，生产环境不得加载。

## 何时执行

只有 `DEMO_MODE=true` 时 `pnpm db:seed` 才会扫描并执行本目录的 SQL。生产环境禁止该开关。

`pnpm db:migrate` 只跑 `packages/db/drizzle/` 中的结构迁移，不会写入演示账号。

## 本地演示账号

统一初始密码为 `haloai1234`（满足认证组件最少 10 个字符）。密码在库中保存为 Better Auth 使用的 scrypt 哈希，登录必须走 `/api/auth/sign-in/email`，不能再靠空邮箱或空密码绕过。

| 邮箱               | 姓名 | 入口                           | 工作区角色                |
| ------------------ | ---- | ------------------------------ | ------------------------- |
| `owner@haloai.dev` | Andy | 协作成员 / 空间管理 / 系统管理 | owner（另有独立平台授权） |
| `admin@haloai.dev` | 苏衡 | 空间管理                       | admin                     |
| `mina@haloai.dev`  | 林岚 | 协作成员                       | member                    |
| `guest@haloai.dev` | 陈然 | 协作成员                       | guest                     |

这批数据只用于前后端联调。生产初始化应通过注册、邀请或环境专用流程创建人员，而不是复制本目录。

系统管理身份保存在独立的 `system_administrators` 表中，不从 Owner 角色推导。系统总览与租户目录读取真实平台 API，因此完成 `pnpm db:setup` 后，`HaloAI Alpha` 会立即出现在系统后台；前端不得再用硬编码的 `0` 或“尚未登记”覆盖它。

## 目录约定

```text
packages/db/
  drizzle/   真实表结构、索引、约束、RLS
  devdata/   本地账号、演示工作空间、演示协作内容
```

- 文件名使用 `VyyyyMMddHHmm__description.sql`，版本号在本目录内保持唯一。
- 脚本必须可在空库（已完成结构迁移）上重放；种子执行器按文件名记录已应用版本。
- 禁止把明文密码、会话令牌或模型密钥写入会被打进浏览器包的源码。
