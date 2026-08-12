# HaloAI Agent 运行时规格

## 状态与范围

本文档定义 HaloAI 在 Agent 身份、协作、执行、工具、记忆、审批、文档提案、恢复和审计方面的规范性契约。它描述产品与安全行为，不限定具体模型供应商、队列、数据库或用户界面。

运行时由人主导。AI 参与者可以推理、起草和请求执行操作，但身份、访问权限、审批、预算和持久写入的最终权威始终是应用策略。

本文使用“必须”“不得”“应该”“不应该”和“可以”表示要求强度。

## 核心不变量

1. Actor 身份、访问角色、房间成员关系和 Agent 人设必须是相互分离的记录。
2. AI Actor 不得获得、复制或模拟人类登录会话。
3. 每次运行必须固定其委托人员或系统 Actor、Agent 版本、授权快照、策略版本和预算。
4. 服务端必须在检索、模型调用、工具调用、记忆写入和文档写入前执行授权。提示词指令和客户端可见性不构成授权。
5. 缺少租户、项目、房间或委托上下文时必须 fail closed。
6. 模型输出、上传文件、检索文本、网页内容、工具结果和 MCP 响应都是不可信数据。
7. AI Actor 不得创建角色、扩大工具集合、审批自己的行为或安装集成。
8. 每次运行都必须可以取消，并受到 token、费用、时长、轮次、工具调用、并发和参与者限制。
9. 对外写入、公开发布、删除、付款、权限修改和敏感数据操作默认要求人工审批。
10. AI 产生的文档修改必须先成为提案，只有获得授权的人员或显式低风险策略才能接受。

## 身份与版本模型

### Actor

Actor 是可以拥有消息、事件、决定和审计记录的可寻址参与者。

必需字段：

| 字段            | 含义                           |
| --------------- | ------------------------------ |
| actorId         | 一个租户内的稳定标识符         |
| tenantId        | 必填租户边界                   |
| kind            | human、agent 或 system         |
| status          | active、suspended 或 retired   |
| displayIdentity | 本地化展示元数据；不得用于授权 |
| createdAt       | 创建时间                       |

human Actor 绑定已认证用户。agent Actor 绑定一个 AgentProfile，但只能通过固定的 AgentVersion 执行。system Actor 只保留给具名内部过程，不得作为匿名授权绕过方式。

### AccessRole 与 Membership

AccessRole 是可复用的权限集合。Membership 在工作空间、项目或房间范围内把 Actor 分配给 AccessRole。成员关系具有上下文、可以撤销，不得嵌入 Agent 指令。

运行时授权必须取以下条件的交集：

- 运行的不可变授权快照；
- Actor 当前有效的成员关系；
- 当前资源策略；
- AgentVersion 的工具白名单；
- 房间或任务策略；
- 任何审批限制。

权限撤销必须立即生效。运行开始后新增的权限不得静默扩大该运行；必须重新开始运行或显式重新授权。

### AgentProfile

AgentProfile 是 AI 协作者稳定的产品身份。它包含名称、描述、头像元数据、所有者、生命周期状态和默认治理引用，但不授予权限。

### AgentVersion

AgentVersion 是不可变的已发布配置，包含：

- 人设和指令；
- 模型选择策略与生成参数；
- 允许使用的工具能力版本；
- 协作行为；
- 上下文与记忆策略；
- 预算策略；
- 输出契约；
- 安全与审批策略引用；
- 规范化内容哈希。

草稿版本可以编辑。已发布版本必须不可变。retired 状态阻止新运行，但不得破坏历史重放或审计。AI Actor 产生的每条消息、提案、工具调用和最终结果都必须保留 agentProfileId 与 agentVersionId。

### 委托

每次运行都具有 RunDelegation，包含：

- requestedByActorId；
- actingAgentActorId；
- membershipId 或服务委托标识；
- authorizationSnapshotId；
- policyVersionId；
- requestedAt；
- 可选用途和有效期。

委托不得授予超出服务端授权交集的权利，也不得包含可复用的人类 access token。

## 协作模式

| 模式        | 参与者选择规则                           | 完成规则                                                 | 必要约束                                     |
| ----------- | ---------------------------------------- | -------------------------------------------------------- | -------------------------------------------- |
| mention     | 只有被明确提及的 AI Actor 参与           | 每个被提及参与者可以回答；可选择其中一个响应作为房间结果 | 默认模式；不得存在隐藏参与者                 |
| facilitated | 协调者选择最少的合格参与者               | 协调者在有限贡献后生成汇总                               | 记录选择事件、限制参与者、协调者无额外权限   |
| workflow    | 版本化流程图控制顺序、分支、输入和审批点 | 已发布流程图到达终止节点                                 | 固定流程版本并审计确定性状态转换             |
| roundtable  | 固定参与者在有限轮次内讨论               | 具名汇总者生成最终响应                                   | 固定轮次、参与者上限、共享预算、不得自行扩员 |

发起 Actor 和选定模式必须在房间中可见。任何被选中的 Agent 接收上下文之前，参与者选择必须先产生持久事件。协调者或汇总者只是路由职责，不是具有额外权限的安全角色。

mention 是首条生产路径的默认模式。其他模式必须复用相同的身份、授权、预算、事件、审批和审计契约。

## 持久运行状态机

### 运行状态

| 状态             | 含义                                  |
| ---------------- | ------------------------------------- |
| created          | 持久运行记录已经存在，但尚未分发      |
| queued           | 工作可以被 Worker 租约领取            |
| running          | Worker 持有有效租约，可以执行受限计算 |
| waiting_input    | 需要人员输入；不得继续模型或工具工作  |
| waiting_approval | 执行拟议操作前需要完成绑定审批        |
| paused           | 执行在安全检查点被主动暂停            |
| completing       | 正在进行最终验证、持久化和计量        |
| completed        | 成功终态                              |
| failed           | 带稳定错误码的不可恢复终态            |
| cancelled        | 已确认取消，不得开始新的副作用        |
| expired          | 排队或等待期间超过截止时间            |

### 允许的转换

| 起始状态                              | 允许的下一状态                                                         |
| ------------------------------------- | ---------------------------------------------------------------------- |
| created                               | queued、cancelled                                                      |
| queued                                | running、cancelled、expired                                            |
| running                               | waiting_input、waiting_approval、paused、completing、failed、cancelled |
| waiting_input                         | queued、cancelled、expired                                             |
| waiting_approval                      | queued、failed、cancelled、expired                                     |
| paused                                | queued、cancelled、expired                                             |
| completing                            | completed、failed                                                      |
| completed、failed、cancelled、expired | 无                                                                     |

服务端拥有状态转换权。每次转换必须比较 expected stateVersion，并在同一事务中追加持久事件和修改状态。过期命令必须返回冲突，不得覆盖较新的状态。

failed 或 completed 运行不可修改。用户要求重新运行时，创建带 parentRunId 的新运行，并重新分配预算、执行策略检查和生成授权快照。Worker 在非终态运行内部恢复时只增加 attempt，不改变 runId。

### 租约与检查点

Worker 租约包含 runId、attempt、leaseOwner、leaseExpiresAt 和 heartbeatAt。只有当前租约持有者可以提交执行事件。每次产生外部可见消息、审批请求、工具结果、记忆提交和文档提案后，Worker 都必须创建检查点。

租约丢失后必须停止新的副作用。租约过期后，其他 Worker 可以从最后一个持久检查点恢复。对于结果未知的非幂等外部写入，不得重放。

### 取消

取消是服务端命令，不是仅存在于客户端的信号。观察到 cancel_requested 后：

- 不得开始新的模型或工具调用；
- 应该中止可取消的进行中工作；
- 已经完成的外部副作用必须被记录；
- 必须完成计量和审计；
- 运行在安全检查点转换为 cancelled。

## 命令与事件协议

### 命令

运行时命令包括 StartRun、SubmitInput、ResolveApproval、PauseRun、ResumeRun、CancelRun、AcceptDocumentProposal 和 RejectDocumentProposal。

每个命令必须携带：

- commandId；
- idempotencyKey；
- tenantId、projectId 和 roomId；
- 目标 runId 或 proposalId；
- 已认证 actorId；
- 修改现有状态时的 expectedStateVersion；
- issuedAt；
- 已验证的 payload。

客户端只能请求命令，不能直接写入运行时状态。

### 事件信封

每个运行时事件使用以下逻辑信封：

    interface RuntimeEventEnvelope<TPayload> {
      schemaVersion: 1;
      eventId: string;
      tenantId: string;
      projectId: string;
      roomId: string;
      runId: string;
      sequence: number;
      type: RuntimeEventType;
      occurredAt: string;
      actorId: string;
      correlationId: string;
      causationId: string | null;
      attempt: number;
      durability: "durable" | "transient";
      payload: TPayload;
    }

sequence 在单个运行内严格递增。持久消费者必须按 eventId 去重，并按 sequence 顺序处理。未知事件类型或 schemaVersion 必须被隔离，不得宽松解释。

### 事件族

初始协议包括：

- run.created、run.queued、run.started、run.paused、run.resumed；
- run.waiting_input、run.input_received；
- participant.selected、participant.completed、participant.skipped；
- context.assembled；
- model.started、model.delta、model.completed、model.failed；
- tool.requested、tool.started、tool.succeeded、tool.failed、tool.denied；
- approval.requested、approval.approved、approval.rejected、approval.expired；
- memory.proposed、memory.committed、memory.rejected、memory.expired；
- document.proposal_created、document.proposal_applied、document.proposal_rejected、document.proposal_conflicted；
- budget.updated、budget.warning、budget.exhausted；
- run.cancel_requested、run.completing、run.completed、run.failed、run.cancelled、run.expired。

model delta、输入状态和 presence 可以是瞬时事件。状态改变、完整消息、工具事实、审批、预算更新、提案和终止事件必须持久化。客户端重连时提供最后一个持久 sequence，服务端返回其后的持久事件和当前瞬时快照。

事件必须携带引用和哈希，而不是秘密或不受限的原始内容。完整消息内容属于受授权保护的消息存储；事件可以引用 messageId。

## 上下文与记忆

### 上下文组装

上下文按以下顺序组装：

1. 服务端拥有的安全与策略指令；
2. 固定的 AgentVersion 指令；
3. 当前任务和房间指令；
4. 显式选中的已授权消息和文档版本；
5. 已授权记忆记录；
6. 已授权检索结果；
7. 有界的历史工具观察。

必须先执行授权过滤，再进行语义排序或构造模型上下文。上下文组装器必须创建 ContextManifest，其中包含每个条目的类型、资源标识、版本、内容哈希、token 估算、信任类别和策略决定。清单可供审计，但不得复制秘密或不受限内容。

不可信内容必须与服务端指令保持可区分。附件、文档、检索结果、工具响应或 MCP 描述中的文本不能改变策略、启用工具或授予权限。

### 记忆作用域

| 作用域    | 用途                     | 写入规则                                 | 读取规则                         |
| --------- | ------------------------ | ---------------------------------------- | -------------------------------- |
| turn      | 单次运行的临时材料       | 运行时可在本次运行内写入                 | 按配置的运行保留期销毁或过期     |
| actor     | 单个 Actor 的私有偏好    | Actor 显式操作或经过治理的提案           | 仅该 Actor 和明确允许的助手      |
| project   | 已确认事实、决定和产出物 | 获得授权的人员批准，或显式低风险项目策略 | 资源过滤后的已授权项目成员       |
| workspace | 在项目间共享的治理知识   | 工作空间知识管理员批准                   | 仅工作空间策略允许的项目和 Actor |

原始聊天记录不得自动成为长期记忆。持久 MemoryRecord 包含 scope、tenantId、适用时的 projectId、ownerActorId、content、contentHash、originReferences、createdByActorId、需要时的 approvedByActorId、sensitivity、retention policy、expiresAt、version 和 status。

记忆检索必须返回记录引用、相关度和策略元数据。用户可以检查、纠正、过期、导出或删除自己控制的记忆。删除必须传播到索引和缓存。摘要是一条新的衍生记录，并保留其所概括记录的引用。

### 上下文限制

输入上下文和生成输出具有独立上限。上下文超过额度时，运行时按确定性策略处理：必要指令、当前请求、已引用产出物、近期相关消息、受治理记忆，最后是可选背景。截断情况必须通过 context.assembled 报告数量和类别，但不得暴露被省略的秘密内容。

## 预算执行

每次运行固定一个 BudgetPolicy，包含：

- maxInputTokens；
- maxOutputTokens；
- maxTotalTokens；
- maxCostMinorUnits 和 currency；
- maxDurationMs 和 deadlineAt；
- maxTurns；
- maxToolCalls；
- maxParticipants；
- maxParallelModelCalls；
- maxParallelToolCalls；
- 可选的单工具和单参与者限制。

预算在所有协作参与者、重试、模型推理轮次、摘要和工具调用之间累计。子活动从父运行预算中预留额度，不能获得独立的无限额度。

服务端必须在供应商或工具调用前预留估算额度，再根据实际用量结算。持久计数器必须原子更新。客户端或模型不能提高预算。获得授权的人员只能在运行暂停或等待时创建新预算版本，并且必须审计该变更。

达到配置阈值时应该发出 budget.warning。达到硬上限时：

- 不得开始新的高成本或有副作用操作；
- 完成进行中用量的计量；
- 可以把安全的部分响应保存为 incomplete；
- 除非已经存在有效最终结果，否则运行以 BUDGET_EXHAUSTED 结束。

等待人员输入或审批的时间与主动执行时间分开计量，但 deadlineAt 仍限制总生命周期。

## 工具能力契约

### 工具定义

已注册 ToolCapability 包含：

- 稳定 capabilityId 和不可变 version；
- 本地化名称与描述；
- 输入和输出 JSON Schema；
- effect class：read、internal_write、external_write、destructive、financial、permission_change 或 publish；
- 风险等级与审批策略；
- 允许的资源作用域；
- 超时、响应大小、重试和并发限制；
- 凭据引用，不包含凭据内容；
- 网络与沙箱策略；
- 供应商适配器和完整性哈希；
- 生命周期状态。

只有已发布、有效且被明确允许的版本才能进入 AgentVersion。

### 工具网关

每次调用都必须按以下顺序经过一个服务端工具网关：

1. 解析稳定能力和固定版本。
2. 计算运行快照与当前 Actor、资源、房间和工具授权的交集。
3. 按 schema、资源归属和租户作用域验证参数。
4. 分类风险并解析审批。
5. 检查和预留预算。
6. 创建副作用幂等键。
7. 在模型可见边界之后注入受限凭据。
8. 按配置的网络或沙箱策略执行。
9. 验证、限制大小并脱敏结果。
10. 持久化工具事实和预算用量。
11. 把结果作为不可信数据返回给模型。

模型只能收到工具 schema，不能收到凭据或任意连接配置。工具选择必须使用服务端签发的标识符。模型产生的 URL、capabilityId、resourceId 和 accountId 都必须独立验证。

### 工具结果

工具结果使用稳定类别：

- succeeded；
- invalid_arguments；
- authorization_denied；
- approval_required；
- retryable_failure；
- non_retryable_failure；
- uncertain_external_outcome；
- cancelled；
- timed_out。

重试必须遵守工具策略和剩余运行预算。授权、审批和验证失败不得转换为可重试的模型观察。结果不确定的外部操作必须先核对或人工处理，然后才能再次尝试写入。

## MCP 边界

MCP 是工具网关后方的适配器边界，不是授权系统。

### 注册与发现

- MCP 服务配置必须由获得授权的人员注册、版本化和启用。
- 禁止 AI Actor 自动安装或启用。
- Streamable HTTP 是主要远程传输；SSE 可以在相同策略控制下启用。
- initialization 和 tools/list 发现必须受到超时、页数、响应大小和重复 cursor 防护限制。
- 发现到的工具描述和 schema 都是不可信配置数据。
- 本地注册表把远程工具名称映射到稳定 capabilityId 和已批准 schema 哈希。
- 可以使用短期发现缓存，但执行前必须重新验证精确工具和兼容 schema。

### 网络策略

MCP 出站流量必须：

- 使用 HTTPS，除非隔离开发策略明确允许其他协议；
- 拒绝 loopback、link-local、multicast、云元数据地址和未授权私网地址；
- 在连接前和 DNS 变化后验证解析出的 IP；
- 默认拒绝重定向，或重新验证每个重定向跳转；
- 使用租户或能力级域名 allowlist；
- 强制连接、请求、空闲和总时长超时；
- 限制请求与响应字节；
- 防止把凭据转发到不同 origin。

### 数据与凭据

MCP 凭据由服务端凭据代理获取，只能为已批准能力和 origin 注入。不得向浏览器、模型提示词、消息存储或普通审计 payload 暴露。

MCP 响应、错误、工具注解和返回链接都是不可信数据。它们不能请求额外工具、修改审批决定或改变当前 AgentVersion。持久化或再次提供给模型之前，必须按敏感字段名和值模式执行脱敏。

## 人工审批

审批是对一个完全绑定的拟议操作提供一次性授权，不是角色授权。

external_write、destructive、financial、permission_change、publish、敏感数据导出和策略选定的高风险操作默认要求审批。

ApprovalRequest 包含：

- approvalId、runId 和 stateVersion；
- capabilityId 和 version；
- 规范化参数哈希和人员可读摘要；
- 目标资源和 effect class；
- 执行 Agent、委托 Actor 和请求 Actor；
- 策略版本和风险原因；
- createdAt 和 expiresAt；
- 必需审批角色和职责分离规则。

只有已认证且当前拥有权限的人员才能处理审批。AI 和 system Actor 不能审批。审批人必须看到实质操作、目标和影响。参数、目标、工具版本、Agent 版本、委托 Actor、策略版本或有效期发生变化时，原审批失效。

申请审批后，运行转换为 waiting_approval。通过审批时发出 approval.approved 并重新排队；拒绝时发出 approval.rejected，并按固定计划安全地失败或跳过操作；过期时发出 approval.expired。每次决定都记录审批人、时间、可选意见和绑定操作哈希。

## 文档提案

AI Actor 不得静默替换共享文档内容。它必须创建 DocumentProposal，其中包含：

- proposalId、documentId 和 baseRevisionId；
- 结构化块操作或 patch；
- 预览和简要理由；
- 作者 Actor、AgentProfile、AgentVersion、runId 和 messageId；
- 受影响范围或块标识；
- 内容与 patch 哈希；
- createdAt 和 expiry；
- 状态：open、applied、partially_applied、rejected、conflicted 或 expired。

获得授权的人员可以全部接受、选择部分操作接受、拒绝或要求修改。接受时重新检查当前文档授权和基础版本。如果基础版本已经变化，提案转换为 conflicted，必须 rebase 或人工解决，不得使用 last-write-wins。

应用提案会创建新的不可变文档版本；记录接受人员作为决定 Actor，同时保留 AI 作者。最终文档的公开发布或对外交付继续遵循普通工具与审批策略。

## 幂等与恢复

### 命令幂等

服务端在租户和操作作用域内保存每个 idempotencyKey 的结果。重复提交同一个键和 payload 时返回原结果；同一个键搭配不同 payload 时返回冲突。

消息创建、运行创建、审批处理、提案处理、预算修改和工具分发都必须幂等。

### 事务性事件发布

状态变更和持久事件必须通过 transactional outbox 或等价保障原子提交。事件至少投递一次。消费者按 eventId 去重，并维护持久投影 cursor。

### 外部副作用

如果外部工具支持，运行时必须传递稳定幂等键。只有满足以下任一条件时才能自动重试：

- 已知前一次尝试没有完成副作用；或
- 外部系统保证相同键具有幂等性。

分发后的超时属于 uncertain_external_outcome。运行必须暂停并等待核对或审批，不得盲目重复写入。

### 恢复

发生可恢复 Worker 故障后，运行保持非终态直到租约过期。恢复过程：

1. 获取新租约并增加 attempt；
2. 加载最新快照和持久事件 sequence；
3. 通过重放重建衍生状态；
4. 核对已经开始但尚未完成的外部活动；
5. 从下一个安全检查点继续。

持久事件和快照必须能够恢复丢失的投影。如果完整助手消息已经持久提交，则不要求原始 model delta 可重放。

## 审计、隐私与保留

审计记录是仅追加的安全事实，与运行日志和用户可见消息分离。

每次运行的审计轨迹必须包含：

- Actor 身份和委托；
- AgentProfile、AgentVersion、策略、流程和工具版本；
- 授权快照与当前策略决定；
- ContextManifest 引用与哈希；
- 模型供应商、模型标识及 token/费用总量；
- 工具参数哈希、结果哈希、状态、时长和幂等键；
- 审批请求和处理决定；
- 记忆提案与提交；
- 文档提案和版本决定；
- 状态转换、attempt、取消和终止原因。

普通日志不得包含 access token、供应商秘密、工具凭据、原始敏感附件或不受限的提示词和结果。脱敏必须同时检查字段名和值模式。敏感审计 payload 需要独立的访问控制、加密、保留策略和访问审计。

审计查询始终需要租户作用域。跨租户运营访问必须是显式 break-glass 操作，具有理由、有效期和独立审计事件。保留、删除、导出和 legal hold 操作必须覆盖消息存储、记忆、对象存储、索引、事件 payload 和衍生投影。

## 稳定错误码

运行时至少暴露：

- CONTEXT_SCOPE_MISSING；
- AUTHENTICATION_REQUIRED；
- AUTHORIZATION_DENIED；
- AGENT_VERSION_UNAVAILABLE；
- INVALID_STATE_TRANSITION；
- STATE_VERSION_CONFLICT；
- CONTEXT_LIMIT_EXCEEDED；
- BUDGET_EXHAUSTED；
- TOOL_NOT_ALLOWED；
- TOOL_ARGUMENT_INVALID；
- APPROVAL_REQUIRED；
- APPROVAL_INVALID；
- MCP_ENDPOINT_BLOCKED；
- MCP_PROTOCOL_ERROR；
- EXTERNAL_OUTCOME_UNCERTAIN；
- DOCUMENT_REVISION_CONFLICT；
- CANCELLED；
- RUN_DEADLINE_EXCEEDED；
- INTERNAL_RECOVERABLE；
- INTERNAL_FATAL。

失败响应暴露安全的用户提示、稳定错误码、requestId 和重试建议。不得暴露秘密、内部提示词、凭据或跨租户标识。

## 验收条件

### 身份与版本

1. 给定一个 AI 房间成员，其产生的每条消息、事件、工具调用和提案都能标识对应 Actor、AgentProfile、AgentVersion 和委托 Actor。
2. 编辑草稿并发布新版本不会改变任何历史运行或历史重放。
3. 暂停成员关系或移除权限后，已经运行中的任务在下一次检索或工具调用时被阻止。
4. 运行期间新增权限不会扩大该运行，除非进行显式重新授权。

### 协作与状态

5. mention 模式不得启动任何未被提及的 AI 参与者。
6. facilitated 和 roundtable 模式不得超过参与者、轮次、并行度或共享预算限制。
7. 每个合法状态转换都增加 stateVersion；即使命令重复投递，也只产生一个逻辑持久事件。
8. 过期 stateVersion 返回冲突，并保持持久状态不变。
9. Worker 终止后，新 Worker 从最后检查点恢复，不重复已提交消息、审批、文档版本或工具副作用。
10. 确认取消后，不得开始新的模型或工具调用。

### 事件、上下文与记忆

11. 客户端携最后持久 sequence 重连时，按顺序收到其后的全部持久事件，且不存在逻辑重复。
12. 未授权消息、文档、记忆或检索条目在排序前被过滤，永远不会进入模型上下文。
13. ContextManifest 标识每个已包含条目并报告确定性截断，但不复制受限内容。
14. 未经要求的显式操作或审批，原始聊天记录不会升级为 actor、project 或 workspace 记忆。
15. 删除受治理记忆后，它及其衍生索引会在规定处理窗口内从后续检索中消失。

### 预算

16. 多个 Agent 和重试的累计用量不得超过固定的 token、费用、时长、轮次、工具调用、参与者或并发硬上限。
17. 硬预算超限后禁止新的高成本操作，持久化最终计量，并返回 BUDGET_EXHAUSTED；已经存在有效最终结果时除外。
18. 客户端或模型 payload 中提高预算的尝试被忽略或拒绝，并产生安全审计事件。

### 工具与 MCP

19. 工具调用具有未知能力、不兼容版本、无效 schema、错误租户资源、已撤销权限或缺失审批时，不得到达适配器。
20. 浏览器响应、提示词、消息、运行事件、普通日志和模型可见工具结果中都不存在工具凭据。
21. 指向 loopback、link-local、元数据地址、未授权私网、禁止域名或重定向绕过目标的 MCP 请求在发送凭据前被阻止。
22. 当前发现结果中不存在的 MCP 工具，或呈现不兼容 schema 的工具，不得被调用。
23. 结果不确定的外部写入不会自动重试，而是进入核对或人工处理。

### 审批与文档

24. 修改审批的任何绑定字段都会使该审批失效。
25. AI 或 system Actor 不能审批，未授权人员不能处理审批。
26. AI 文档修改保持提案状态，直到获得授权的决定 Actor 或显式低风险策略接受。
27. 在基础版本已经变化时应用提案会返回 DOCUMENT_REVISION_CONFLICT，且绝不覆盖较新内容。
28. 新建文档版本同时保留 AI 作者和人员接受决定。

### 审计与安全

29. 获得授权的审计员能够为一次运行还原 Actor、委托、Agent 版本、上下文引用、策略决定、预算、工具事实、审批、文档决定、attempt 和终止原因。
30. 注入凭据、提示词、附件和工具结果的 canary secret 不会出现在普通日志或非敏感事件 payload 中。
31. 缺少租户、项目、房间或委托上下文时，以稳定错误码 fail closed。
32. 重复命令和至少一次事件投递只产生一个逻辑结果和一项可审计决定。
