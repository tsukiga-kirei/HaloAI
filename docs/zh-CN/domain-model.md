# 领域模型

简体中文 · [English](../en-US/domain-model.md)

本文是 HaloAI 业务语义的事实来源。数据库表、API 契约、界面文案和 Agent 提示词可以投影这些概念，但不能为同一个概念创造另一套含义。

## 1. 不可妥协的不变量

1. 所有租户资源都必须携带非空 `workspaceId`；缺少租户上下文时默认拒绝。
2. `Actor` 表示谁执行了行为，`AccessRole` 表示可做什么，`AgentProfile` 表示 AI 如何贡献，三者永不互相替代。
3. AI Actor 没有密码、交互式会话、刷新令牌，也不会自动继承委托人的全部访问权。
4. AI 的最终权限取交集，绝不取并集。
5. 已保存消息是不可变事实；编辑产生修订，删除产生墓碑。
6. 已发布 Agent 版本和正式文档版本都是不可变快照。
7. Agent Run 固定所有会影响行为边界的版本，确保可以还原当时的决策条件。
8. AI 对文档的工作先形成提案；只有经过授权的事务才能改变正文。
9. 外部副作用、拒绝、审批和策略版本均通过仅追加审计事件追责。
10. 软删除不等于履行数据删除请求；擦除必须传播到所有投影、索引和对象。

## 2. 限界上下文

| 上下文       | 负责的数据                                   | 可以引用                  | 禁止负责             |
| ------------ | -------------------------------------------- | ------------------------- | -------------------- |
| 身份         | 用户、会话、认证因素                         | Actor 关联                | 工作空间授权         |
| 工作空间     | 工作空间、成员关系、邀请                     | 人类身份                  | AI 人设与提示词      |
| 授权         | 访问角色、能力、资源授权、策略决策           | Actor、资源描述符         | 把页面路由当权限事实 |
| 对话         | 项目、房间、消息、修订、提及、附件           | Actor、Run、Document      | 模型供应商细节       |
| Agent 目录   | AI Actor、Profile、Version、能力配置         | 工作空间、凭据引用        | 人类会话或密钥明文   |
| Agent 运行时 | Run、Step、Event、上下文清单、工具调用、预算 | 固定 AgentVersion、委托人 | 修改已发布配置       |
| 文档         | 文档、CRDT 状态、投影、版本、提案、评论      | Actor、Run、来源          | AI 静默覆盖正文      |
| 治理         | 审批、审计、用量账本、保留与导出任务         | 任意资源描述符            | 密钥明文             |
| 集成         | 连接元数据、工具目录、凭据引用               | 工作空间策略              | 直接做授权决定       |

跨上下文写入优先由应用服务在一个事务内完成；必须异步完成的后果通过 Transactional Outbox 可靠发布。

## 3. 身份与租户

### 3.1 User

`User` 是可以登录的人类账号，只保存全局身份属性：已验证地址、首选语言与时区、认证状态和账号生命周期。User 本身不授予任何工作空间访问权。

### 3.2 Workspace

`Workspace` 是首要租户和策略边界，拥有项目、房间、Agent Profile、文档、集成、预算和保留策略。可读 slug 只用于寻址，永远不能作为授权证据。

### 3.3 Actor

`Actor` 是消息、编辑、运行和审计共用的责任主体。

```ts
type ActorKind = "human" | "agent" | "system";
type ActorStatus = "active" | "suspended" | "archived";
```

- Human Actor 在一个工作空间内精确关联一个 `User`。
- Agent Actor 在一个工作空间内精确关联一个 `AgentProfile`。
- System Actor 代表范围明确的系统职能，而不是万能超级管理员。

### 3.4 Membership

`Membership` 把 Human Actor 与工作空间及生命周期绑定。项目或私密房间可以再增加更窄的成员关系。工作空间成员被停用后，所有下级访问立即失效。

关键约束：工作空间始终至少保留一名活跃 Owner；所有权转移必须在一个事务内完成。

## 4. 授权模型

### 4.1 Capability

Capability 是稳定、带命名空间的动作，例如：

```text
room.read
room.message.create
agent.invoke
agent.profile.publish
document.read
document.edit
document.proposal.review
integration.tool.execute
workspace.security.manage
```

Capability 描述动作，不描述页面。隐藏按钮不等于完成授权。

### 4.2 AccessRole 与授权

`AccessRole` 组合便于人类管理的能力，`ResourceGrant` 把 Actor 或 Role 限定到特定资源。显式拒绝和成员状态优先于允许规则。每次决策同时返回允许/拒绝以及稳定的原因码。

一次 AI 运行的有效能力为：

```text
有效能力
  = 活跃委托人能力
  ∩ 已发布 Agent 授权
  ∩ 资源 ACL
  ∩ 数据分级策略
  ∩ 工具执行策略
  ∩ 剩余预算
  ∩ 必要时的有效审批
```

每次读取上下文和每次调用工具都要重新评估当前策略。Run 不能在整个生命周期里缓存一次权限结论。

## 5. 协作关系图

### 5.1 Project 与 Room

`Project` 组织朝向同一成果的工作。`Room` 是实时协作边界，包含：

- 目标、预期成果和完成条件；
- 显式的人类与 AI 成员；
- 可见性（`workspace` 或 `private`）；
- 生命周期（`active`、`waiting`、`completed`、`archived`）；
- 一份或多份关联文档。

Room 状态不是复杂任务引擎，它只表达协作所处阶段并影响允许的修改。

### 5.2 Message

`Message` 是由 Actor 署名的不可变信封，内容可以是纯文本、结构化富文本、系统事实、Agent 回复或操作卡片。流式 chunk 只是临时事件，只有完成或明确保留的部分回复才进入正式消息历史。

`MessageRevision` 保存修改内容、编辑人、原因和时间。`MessageTombstone` 隐藏内容但保留引用与审计完整性。附件是拥有独立 ACL 和扫描状态的资源。

### 5.3 Mention 与路由

消息被接受时即持久化 `Mention`，它指向 Actor，并记录结构化文本范围或语义节点。运行时消费这条关系，不在后台重新从字符串猜测 Agent 名称。

默认只调用被明确提及的 AI Actor。协调员模式必须创建可审计的 `Delegation`，记录邀请人、受邀者、理由、限制与最终汇总者。

## 6. Agent 目录

### 6.1 AgentProfile

`AgentProfile` 是可变的目录身份：名称、视觉身份、摘要、负责人、生命周期和当前草稿。它本身不是可执行配置。

### 6.2 AgentVersion

发布会生成不可变 `AgentVersion`，包含：

- 职责与明确的非职责；
- 行为指令和输出契约；
- 模型策略和回退策略；
- 知识来源选择器；
- 工具白名单和逐工具约束；
- 主动程度与协作策略；
- token、费用、时长、步骤和委派预算；
- 所引用的策略与 schema 版本。

Run 固定 `AgentVersion` 标识和内容摘要。归档 Profile 会阻止新运行，但不会破坏历史。

## 7. Agent 运行时

### 7.1 AgentRun

`AgentRun` 表示一次可持久恢复的尝试，归属于一个 AI Actor，并由 Human Actor 或有权协调的 Run 委托。它保存房间、触发消息、固定版本、幂等键、预算预留、时间、结果摘要和终止原因。

```ts
type RunStatus =
  | "queued"
  | "preparing"
  | "running"
  | "streaming"
  | "waiting_input"
  | "waiting_approval"
  | "paused"
  | "completed"
  | "failed"
  | "cancelled";
```

状态迁移由服务端验证。终态不能回到运行态；重试创建与原 Run 关联的新 Run。

### 7.2 RunEvent 与 Step

`RunEvent` 是可重放的用户可见事件流，`(runId, sequence)` 唯一且严格递增。事件可以包含状态、受限的进度摘要、内容增量、引用、审批请求、用量、警告和最终结果。隐藏思维链永不保存或展示。

`RunStep` 保存恢复和审计所需的操作事实，可关联 `ToolCall`、上下文读取、模型调用或文档提案。事件投影必须幂等。

### 7.3 ContextManifest

上下文清单记录本次运行实际使用的授权来源版本：消息 ID、文档版本、文件摘要、记忆和检索片段。它保留来源与策略决策，不额外复制未经脱敏的完整提示词。

### 7.4 ToolCall

工具调用保存 schema 版本、风险级别、规范化参数摘要、凭据引用、网络策略、审批引用、执行主体、结果分级、时长、用量和错误码。密钥值和不受限响应正文不得进入普通审计载荷。

## 8. 文档与提案

### 8.1 文档事实来源

- Yjs 二进制更新日志和压缩快照是多人协作编辑的事实来源。
- 经过校验的富文本 JSON 投影用于 API、索引、导出和提案操作。
- 纯文本只是搜索和模型上下文的派生投影。
- `DocumentVersion` 冻结带名称的检查点，包含内容摘要、创建人、原因和来源。

投影失败不能破坏 CRDT 原始状态。投影器必须可以从检查点和后续更新重建派生形式。

### 8.2 DocumentProposal

AI 产生 `DocumentProposal`，而不是直接写正文。提案固定：

- 基础文档版本与摘要；
- 使用稳定节点 ID 的有序语义操作；
- 每项操作的理由和引用；
- AI Actor、AgentVersion、Run 与委托人；
- 策略决策和有效期；
- 每项操作及整体提案的状态。

接受时重新检查权限和基础版本兼容性，然后在一个有名称的 Yjs transaction 中应用已接受操作并创建检查点。过期基础版本会把提案标记为 `conflicted`，需要 rebase 或人工处理。

## 9. 治理记录

### 9.1 Approval

审批绑定具体能力，默认只能使用一次。它记录请求 Actor、委托人、操作类型、规范化参数摘要、受影响资源、风险说明、审批人、结论、有效期和消费时间。任何实质参数变化都会使原审批失效。

### 9.2 AuditEvent

审计事件仅追加，包含工作空间、Actor、有效执行主体、动作、资源、策略版本、请求关联、结果、原因码、时间和脱敏元数据。拒绝请求与成功修改同样进入审计。

### 9.3 UsageLedger

用量采用账本而不是可变计数器。预留、结算、释放记录使用幂等键并关联 Run 或 ToolCall。工作空间、项目、Agent 和成员维度都是同一账本的投影。

## 10. 关系结构概览

```text
users
  └─ human_actors ─ actors ─ workspace_memberships ─ workspaces
                         ├─ project_memberships ─ projects ─ rooms
                         ├─ room_memberships ───────┘   ├─ messages ─ message_revisions
                         │                              ├─ mentions
agent_profiles ─ agent_versions ─ agent_runs ─ run_steps/run_events/tool_calls
       └─ agent_actors ─ actors           ├─ context_manifests
                                         └─ document_proposals
documents ─ yjs_updates/yjs_snapshots ─ document_versions
     ├─ document_proposals ─ proposal_operations
     └─ comments/suggestions
approvals · audit_events · usage_ledger_entries · outbox_events
```

所有租户内外键都应携带或验证相同 `workspaceId`。PostgreSQL RLS 是纵深防御，应用层授权仍然不可省略。

## 11. 生命周期、保留与擦除

- Archive 把资源移出活跃工作，但保留历史。
- Suspend 阻止新行为，并按资源类型中断现有连接。
- Tombstone 删除消息可见内容，但保留最小引用。
- Erase 按策略和法律保留要求移除或不可逆匿名化个人内容。
- 搜索索引、文档投影、AI 记忆、对象存储、缓存和导出物都必须有可观测的删除传播任务。

备份使用明确的保留窗口。删除清单记录哪些位置已处理，但不能重新保存被删除的内容。

## 12. 模型评审清单

新增实体或字段前必须回答：

1. 哪个限界上下文负责它？
2. `workspaceId` 是否显式且受约束？
3. Actor 与有效执行主体分别是谁？
4. 哪些 Capability 控制增删改查或执行？
5. 记录是不可变、修订、归档、墓碑还是可擦除？
6. 会产生什么审计事件和 Outbox 事件？
7. 内容是否可能包含密钥、个人信息或不可信模型/工具数据？
8. 中英文如何呈现，并避免本地化协议枚举？
9. 重试、重复投递、权限撤销和部分失败时会怎样？
10. 哪个不变量测试证明边界成立？
