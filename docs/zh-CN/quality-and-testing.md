# HaloAI 质量与测试规范

## 1. 目的与规范用语

本规范定义 HaloAI 如何证明正确性、隔离性、协作收敛、无障碍、性能、安全与发布就绪状态。

本文中的“必须”“禁止”“应该”“不应该”和“可以”具有规范意义。测试是可执行的产品契约。当一次失败可能跨越租户、扩大 AI 权限、重复外部副作用、破坏共享文档、丢失工作或隐藏审批边界时，只让 Happy Path 通过远远不够。

所有应用测试 Harness、Fixture、Simulator 与负载 Driver 应该使用 TypeScript 编写。可以通过可复现命令使用原生基础设施工具，但产品不应要求使用第二种应用语言来表达质量模型。

## 2. 质量原则

1. **测试不变量，而不是实现细节。** 测试在领域层和边界层断言长期行为。
2. **Default-deny 路径必须获得一等覆盖。** 每项权限授予都有对应的拒绝、撤销与跨租户测试。
3. **并发是常态。** 重复、延迟、乱序、取消、断开与恢复必须被刻意测试。
4. **真实边界保持真实。** 集成与端到端门禁禁止 Mock 掉策略、数据库隔离、队列、序列化和浏览器存储。
5. **AI 是确定性控制之后的非确定性数据。** 供应商文本可以变化；权限、Schema、预算、审批、状态迁移与副作用不能变化。
6. **无障碍与移动端行为属于正确性。** 它们是发布标准，不是功能测试后的人工润色。
7. **重跑不能抹去证据。** Flake 和瞬时失败在完成归类与认领前必须保持可见。

## 3. 风险等级与必需证据

每项功能与变更采用所适用的最高等级：

| 等级              | 示例                                                                 | 最低证据要求                                                             |
| ----------------- | -------------------------------------------------------------------- | ------------------------------------------------------------------------ |
| Q0 — 边界关键     | 认证、租户隔离、授权、凭据、审批、审计、保留期、用量结算、外部副作用 | 不变量与分支测试、真实数据库集成、攻击测试、负向多人 E2E、安全负责人审阅 |
| Q1 — 协作关键     | 消息、Agent Run、队列、SSE、WebSocket、CRDT、提案、通知、离线恢复    | 单元/属性测试、包含恢复与并发的集成、多 Context E2E、负载或故障证据      |
| Q2 — 用户流程关键 | 工作空间设置、角色编辑、文档流程、设置、导出                         | 组件/契约测试、主路径与错误路径 E2E、无障碍、视觉与 locale 检查          |
| Q3 — 仅展示       | 不改变语义的样式和独立文案                                           | 静态检查、受影响组件测试、视觉与 locale 审阅                             |

风险等级记录在变更说明中。降低等级必须给出明确理由。任何涉及策略、租户键、状态迁移、金额或用量单位、Migration、加密或保留期的变更，无论 Diff 多小都属于 Q0。

需求必须关联到具名测试或 Suite。发布决策必须能从需求追踪到证据、环境、Commit 与结果。

## 4. 测试金字塔

目标分布表达意图，而不是指标配额：

| 层级                   |          大致占比 | 用途                                                 | 常见运行时间       |
| ---------------------- | ----------------: | ---------------------------------------------------- | ------------------ |
| 静态分析               |          每次变更 | 类型、Lint、依赖边界、目录/Schema 一致性、不安全模式 | 秒级               |
| 单元、不变量、属性测试 | 行为测试的 60–70% | 纯策略、状态、Reducer、Parser、预算、格式化          | 毫秒级             |
| 组件与契约             |            15–25% | UI 状态、无障碍语义、API/Event/供应商契约            | 毫秒到秒级         |
| 集成                   |            10–15% | 数据库隔离、队列、对象存储、事务、实时恢复           | 秒级               |
| 端到端                 |             5–10% | 跨真实应用边界的关键多人旅程                         | 秒到分钟级         |
| 负载、韧性、攻击、探索 |    风险驱动 Suite | 容量、恢复、滥用、可用性与涌现行为                   | 定时或候选发布阶段 |

规则：

- 当快速属性测试或表驱动测试可以证明组合逻辑时，禁止把它移入 E2E。
- 禁止使用单元 Mock 替代关键边界测试。
- 每个生产缺陷都要增加能够捕获它的最低成本测试；若逃逸风险跨越层级，还要增加边界级回归。
- Snapshot 测试只能补充语义断言，绝不能替代语义断言。

## 5. 工具与 Suite 边界

基础 Suite 使用：

- TypeScript Strict 检查与 Lint 规则提供静态保证；
- Vitest 执行单元、属性、组件兼容与 Node 集成 Suite；
- Playwright 执行浏览器、多 Context、跨浏览器、移动端、无障碍与视觉测试；
- 在确定性浏览器状态中使用 axe-core 进行自动无障碍检查；
- 使用真实 Postgres 实例或隔离 Schema 测试数据库与行策略；
- 使用与生产兼容的队列、缓存、对象、SSE、WebSocket 与协作服务进行边界测试；以及
- 使用确定性假模型、工具、邮件、推送与连接器服务提供已记录契约用例。

工具选择可以演进，但 Suite 职责与证据必须保留。测试不能依赖开发者全局服务、个人账户、生产凭据或已经运行的本地进程。

仓库脚本至少暴露：

| 命令意图         | 必需作用域                                      |
| ---------------- | ----------------------------------------------- |
| typecheck        | 严格编译设置下的全部 Workspace Package          |
| test             | 快速单元、不变量与契约 Suite                    |
| test:integration | 数据库、队列、存储、实时与 Adapter 边界         |
| test:e2e         | 关键 Playwright 旅程                            |
| test:visual      | 确定性 Viewport 与 locale 截图                  |
| test:a11y        | 自动无障碍检查及键盘断言                        |
| test:security    | 攻击验收与不安全模式扫描                        |
| check            | Format/Lint、类型检查、测试、构建与必需规格验证 |

启动阶段的名称可以不同，但 CI 必须分别展示这些作用域，确保失败可以定位。

## 6. 确定性环境与测试数据

测试必须控制时间、随机性、ID、网络行为、模型输出与 Feature Flag。依赖真实时钟、Suite 顺序、主机 locale 或外部网络的测试不是确定性测试。

强制实践：

- 除非 Suite 明确测试共享行为，否则每个测试创建新的工作空间与 Membership Graph；
- 生成可识别的租户前缀 Fixture ID，同时保持生产格式有效；
- Factory 必须显式要求 workspace、project、Actor 与 classification；
- 冻结或注入 Clock 与时区；
- 为伪随机 Generator 设置 Seed，并在失败时输出 Seed；
- 按 Test Run 隔离数据库 Schema、队列 Prefix、对象 Prefix、缓存 Namespace、搜索 Index 与实时 Channel；
- 禁止使用生产数据，并对捕获的 Payload 脱敏；
- 使用能保留被测不变量的最小 Fixture；
- 按 Test Run 作用域清理，禁止通过未经确认的宽泛删除；以及
- 将失败运行 Artifact 保留足够时间以便调试。

CI 环境从已声明版本创建。浏览器 Image、字体、locale 数据、数据库 Extension 与时区数据必须固定。测试必须针对空数据库和经过净化的上一发布版本 Schema 验证 Migration。

## 7. 静态、单元、不变量、属性与 Fuzz 测试

### 7.1 静态门禁

静态检查包括：

- TypeScript Strict Mode，边界处禁止未经检查的类型断言；
- 针对 Floating Promise、不安全 HTML、未处理联合类型和禁止 Import 的 Lint 规则；
- Package 依赖方向检查；
- API、Event、State、Permission、Error Code 与 locale 穷尽性；
- Schema 与生成 Artifact 的干净工作树检查；
- 密钥扫描和依赖风险扫描；
- 禁止 Focus Test、意外 Skip 或已提交 Debug Flag；以及
- 客户端 Bundle 禁止导入服务端密钥或特权 Adapter。

### 7.2 单元与不变量 Suite

纯测试覆盖：

- Capability 与 Condition 求值；
- AI 权限交集；
- 状态迁移 Reducer；
- 用量预留、结算、释放与对账；
- 审批绑定与过期；
- 重试与 Backoff 决策；
- Event 归约、Sequence Gap 检测与 Snapshot 替换；
- 文档操作校验；
- locale、时区与 API 错误映射；
- 保留期与删除规划；以及
- 序列化往返。

具名不变量必须被直接测试。重要示例包括：“只能有一个终态”“每次预留只能结算一次”“审批不能授权变化后的参数”和“翻译绝不能扩大来源访问范围”。

### 7.3 属性与 Fuzz Suite

属性测试生成动作序列、角色组合、重复消息、Event 排列、CRDT 编辑调度、边界尺寸、Unicode、ICU 参数和夏令时时间点。

Fuzz 目标包括 API 输入、工具参数、上传 Metadata、SSE Event、WebSocket Frame、Yjs Update、Markdown 投影、locale 路由和连接器响应的 Parser。失败时输出最小可复现用例，并转为永久回归。

### 7.4 覆盖率策略

覆盖率是护栏，不是证明：

| 作用域                                           |                                  最低要求 |
| ------------------------------------------------ | ----------------------------------------: |
| 策略、租户 Guard、审批、用量账本、保留期 Planner | 95% Branch Coverage，并覆盖全部具名不变量 |
| 状态机                                           |                 100% 已声明迁移与终态结果 |
| 变更的可执行行                                   |           90% Line 与 85% Branch Coverage |
| 仓库应用代码                                     |           80% Line 与 75% Branch Coverage |

生成代码、仅类型声明与平凡配置可以通过已说明的模式排除。禁止通过测试不可达或无意义语句来提高覆盖率。

## 8. 契约、集成、数据库与 Migration 测试

契约测试同时验证生产者与消费者：

- REST Request、Response、Pagination、Error 与 Idempotency Shape；
- SSE Event Type、Sequence、Cursor、Snapshot 与终态语义；
- WebSocket 认证、Close Reason、Update 与 Awareness Frame；
- 队列 Payload Version、Lease、Attempt、Deduplication 与 Result；
- 模型供应商 Request、Stream、Usage、Cancellation 与 Error Normalization；
- 工具与连接器参数/结果 Schema；
- 通知模板与投递 Callback；以及
- 导出 Manifest 与签名下载 Metadata。

未知增量字段根据版本策略处理；必需字段缺失、版本不兼容和未知特权动作必须 Fail Closed。

集成测试使用真实事务行为，覆盖唯一约束、复合租户所有权、行级安全、外键、Outbox 原子性、并发更新、Deadlock、重试分类、Cursor Pagination、对象所有权与审计 Append-only 权限。

每个 Migration Suite 都要证明：

1. 全新安装成功；
2. 从上一个支持版本升级成功；
3. 现有租户行保留所有权与语义；
4. Backfill 可以重启且可观测；
5. 混合应用版本在发布期间安全失败或保持兼容；
6. 在可行时记录并演练回滚或 Forward-fix 流程；以及
7. 任何受保护列都不会在没有补偿 Guard 时临时变为 Nullable 或失去作用域。

## 9. 授权、权限与租户隔离测试

授权测试矩阵从 Subject × Role × Resource × Action × Condition 生成，必须包含显式允许、显式拒绝、默认拒绝、已撤销授权、过期授权、分类约束、审批要求与项目限制。

| 边界                  | 强制攻击                                                                             | 通过条件                                        |
| --------------------- | ------------------------------------------------------------------------------------ | ----------------------------------------------- |
| REST 与 Server Action | 把 workspace、project、Actor、owner、role 与 resource ID 替换为已知外部值            | 拒绝，且不泄露外部资源细节                      |
| 数据库                | 省略租户上下文、伪造 Session Context、跨租户 Join、使用 Worker/Application Role 调用 | 查询 Fail Closed，不泄露行或 Aggregate          |
| 缓存、搜索与向量检索  | 复用 Key、查询外部 UUID、污染缓存、省略策略过滤                                      | 不出现外部候选、Count、Snippet 或 Timing Oracle |
| 对象与导出            | 猜测 Key、重放 URL、改变 Content-Disposition、使用已过期 Membership                  | 在内容暴露前拒绝下载与导出                      |
| 通知与未读状态        | 切换 Membership、订阅旧 Channel、标记外部通知                                        | List、Count、Stream 与 Mutation 均保持隔离      |
| SSE 与 WebSocket      | 重用 Cursor/Ticket、Stream 中途撤销 Membership、在消息内切换租户                     | Stream 停止或重新认证，不出现外部 Event         |
| 队列与 Worker         | 修改 Payload 租户、重放过期 Job、Grant 移除后恢复                                    | Worker 重新授权并拒绝过期权限                   |
| AI 与工具             | 要求模型冒充、扩权、检索外部上下文或自我审批                                         | 有效权限仍为服务端求得的交集                    |

至少一个 Suite 在不同工作空间创建本地名称相同、ID 刻意相似的两个资源。Aggregate Endpoint、错误措辞、Pagination Total、Autocomplete、Presence 与时序敏感查询都要纳入。

边界测试禁止 Mock 策略。UI 中隐藏的 Control 永远不能作为授权证据。

## 10. 状态机、幂等、队列与核算

每个耐久状态机都有机器可读的迁移表。测试枚举每项合法迁移、每个状态的全部非法迁移、终态不可变性、Actor 要求、副作用、审计输出与并发行为。

强制 Race 测试包括：

- Cancel 对 Complete、Fail、Timeout、Approval 与 Provider Callback；
- Approval 对 Expiry、Revocation、Parameter Change 与 Duplicate Decision；
- 检索、工具准备、Effect Commit 与发布期间的 Membership 或 Role 撤销；
- Job Lease Expiry 对 Heartbeat 与 Completion；
- Notification Send 对 Unsubscribe 与 Retry；
- 文档提案接受对并发编辑与重复 Command；以及
- Retention Purge 对 Legal Hold。

幂等测试分别在 Commit 前、Commit 中和 Commit 后注入同一 Command；并在 Transaction Begin、Outbox Write、Provider Response、Effect Preparation、Effect Confirmation、Result Persistence 与 Acknowledgement 注入不确定 Timeout。

通过条件：

- 一个规范 Command Result；
- 最多一次外部副作用；
- 每次预留恰好一次核算结算；
- 不产生重复审计语义；
- Replay Response 确定；
- 终态不会复活；以及
- 跨进程重启安全重试。

队列测试在每个持久化边界终止 Worker、使 Lease 过期、重复投递、重排关联 Job、耗尽重试、移动至 Dead-letter 状态、修复后 Replay，并验证 Cancellation。恢复禁止只依赖进程内存。

## 11. 实时、离线与 CRDT 测试

### 11.1 消息与 SSE

测试覆盖重复、延迟、丢失、Malformed 与乱序 Event、Gap、Replay Window 过期、Snapshot 替换、Streaming 期间刷新、Backpressure、Slow Consumer、多 Tab 归约、Token Rotation、授权撤销与服务端重启。

客户端必须在每种被测调度后收敛到相同的规范房间顺序和 Run 终态。一个 Mutation ID 只能创建一条消息和一次 Agent 调用。重连绝不能泄露其他工作空间的 Event。

### 11.2 WebSocket 与 Presence

测试验证短时 Connection Ticket、Origin、当前 Membership、Channel Authorization、Expiry、Reconnect、Revocation、大小与速率限制、Malformed Frame 及每租户连接上限。

Presence 是临时、最小且非权威的。伪造 Presence 不能改变文档内容、Role、Approval、Unread Count 或 Audit State。

### 11.3 CRDT 文档

Yjs 协作测试使用两个或更多独立认证客户端。生成式编辑调度以不同顺序应用，并包含断开、重连、重复 Update、Compaction 与进程重启。

强制断言：

- 所有已授权 Replica 按文档 Schema 达到字节等价或语义等价收敛；
- 不使用 Last-write-wins 丢失独立编辑；
- 持久化二进制状态重载不依赖投影；
- 投影失败不破坏规范状态；
- Read-only 与已撤销客户端不能提交被接受的 Update；
- Schema 不兼容、Malformed、超大与 Flooded Update 安全失败；
- State-vector 恢复在配置边界内只传输需要的状态；
- Comment、Approval、Version 与 Audit Attribution 和文档状态保持一致；以及
- 已接受 AI 提案通过具名、已授权 Transaction 仅应用一次。

离线测试验证 Logout 或 Account Switch 时清除私有数据，Draft 不会自动调用 AI，缓存授权响应永不复用，本地字节不证明当前编辑权限。

## 12. Agent、模型、工具与知识测试

默认 CI 路径使用确定性模型 Simulator，可以产生 Text Delta、Tool Call、Malformed Call、Usage、Refusal、Slow Stream、Disconnect 与 Provider Error。测试断言编排和策略，而不是完全一致的创意文本。

Golden 行为场景覆盖：

- 显式 Mention、自动路由、没有可用 Agent 与路由平局；
- 授权先于检索的上下文选择；
- 有界 Prompt 大小与确定性截断；
- 工具 Schema 校验与 Destination Policy；
- 低、中、高风险审批行为；
- Stop、Timeout、Budget Exhaustion、Retry 与 Provider Failover；
- 消息、文件、网页、检索记忆与连接器输出中的 Prompt Injection；
- Citation 或 Provenance 附加，但不暴露隐藏内容；
- 不改变权限的回复语言选择；以及
- Final Message、Usage、Trace 与 Audit 一致性。

Simulator 永远不能绕过生产策略引擎。小型 Provider Contract Suite 可以按受控计划调用已批准的非生产账户；它只使用合成非敏感数据和硬预算，且发布绝不能依赖模型措辞。

知识与记忆测试必须证明租户作用域、资源作用域、分类、删除传播、过期来源行为、Chunk Lineage 与授权先于排序。被污染或对抗性文档不能改变系统策略。

## 13. Playwright 多用户端到端测试

多人测试使用独立 Playwright BrowserContext 实例，每个实例具有独立 Cookie、Storage、Connection Ticket 与 Identity。同一 Context 中的多个 Page 不能视为独立用户。

基础 Actor 包括：

- Workspace Owner；
- 已授权 Human Member；
- 只读 Human Viewer；
- 第二个工作空间中的 Human；
- 通过真实 Runtime 边界调用的确定性 AI Actor；以及
- 只在必须验证用户可见副作用时加入 Worker 或 Integration Identity。

强制旅程：

| 旅程     | 并发 Actor                 | 必须证明                                             |
| -------- | -------------------------- | ---------------------------------------------------- |
| 房间协作 | Owner、Member、AI          | 规范排序、Streaming 恢复、Attribution、未读隔离      |
| 审批     | Requester、Approver、AI    | AI 不能自批；精确绑定参数；过期/撤销生效             |
| 共享文档 | 两个 Editor、Viewer、AI    | CRDT 收敛、只读拒绝、提案审阅、Version 与 Audit      |
| 权限变更 | Admin、活跃 Member、AI Run | 活跃 Stream/Editor/Run 在下一受保护步骤失权          |
| 租户攻击 | Member 与外部工作空间      | 已知 ID、Deep Link、搜索、下载、通知全部拒绝         |
| 离线恢复 | Editor 与另一在线 Editor   | Draft 恢复、重新授权、确定性合并                     |
| 用量上限 | 并发发起者                 | 原子预留阻止超支，UI 展示规范结果                    |
| 账户切换 | 同一浏览器、不同身份       | 私有缓存、Draft、Connection 与 Notification 不跨账户 |

测试断言可见行为与耐久服务端状态。禁止访问 React 内部，也禁止使用特权数据库写入绕过正在测试的流程。

## 14. Viewport、视觉回归、无障碍与 locale 质量

### 14.1 浏览器与 Viewport 矩阵

最低确定性截图矩阵：

| Profile          | Viewport            | Locale         | Theme                |
| ---------------- | ------------------- | -------------- | -------------------- |
| Desktop Chromium | 1440×900            | zh-CN          | Light                |
| Desktop WebKit   | 1440×900            | en-US          | Dark                 |
| Desktop Firefox  | 1440×900            | en-US          | Light                |
| Tablet           | 768×1024            | zh-CN          | 受影响时测试两种主题 |
| Mobile           | 390×844             | zh-CN 与 en-US | Light                |
| Small mobile     | 320×568             | en-XA 文本扩展 | Light                |
| RTL readiness    | 390×844 与 1440×900 | ar-XB          | Light                |

关键行为还要在带触摸输入和 Reduced Motion 的 Chromium Mobile Emulation 中运行。大版本发布前，Real-device Smoke Test 至少覆盖一个当前 iOS Safari 和一个当前 Android Chromium 类设备。

### 14.2 视觉回归

核心页面针对 Populated、Empty、Loading、Error、Offline、Permission-denied、AI-streaming、Approval、Long-content 与 Destructive-confirmation 状态生成确定性截图。

测试固定数据、时间、时区、字体、动画、光标、模型输出与网络完成状态，并等待稳定 Ready Marker。只有真正非确定的 Cursor 或 Timestamp 可以 Mask。

默认最大 Diff Pixel Ratio 为 0.002。即使低于数值阈值，任何结构变化、隐藏操作、被裁切警告、意外水平滚动、焦点丢失或 Composer 上方 Reflow 也需要人工检查。Baseline 必须在独立变更中审阅和更新，CI 禁止自动更新。

### 14.3 无障碍

HaloAI 目标为 WCAG 2.2 AA。自动 axe-core 扫描不允许出现 Serious 或 Critical Violation。关键流程还要验证：

- 仅键盘完成操作并保持可见焦点；
- Skip Link、Landmark、Heading、List、Table、Dialog 与 Live Region 语义；
- 焦点 Trap 与恢复；
- Icon Control 的无障碍名称与状态；
- 人类与 AI 身份播报；
- Streaming、Approval、Error、Connection 与 Unread 的播报，且不会逐 Token 噪声播报；
- 44×44 CSS Pixel 触控目标；
- 200% Zoom 下不丢失内容或操作；
- Light、Dark、Forced-color 与 Disabled 状态的对比度；
- Reduced Motion；
- IME Composition；以及
- 主要房间和文档流程的 Screen Reader Smoke Check。

自动扫描不能替代 Q0–Q2 用户流程的人工键盘、触摸、缩放与 Screen Reader 审阅。

### 14.4 Locale 质量

两个首发 locale、en-XA 与 ar-XB 必须运行核心视觉与无障碍状态。测试断言类型化 Key 对齐、ICU 分支、API 错误映射、日期/时区行为、混合文字隔离、没有原始回退 Key，也没有未翻译生产 Placeholder。

## 15. 安全攻击测试

安全 Suite 使用合成密钥与 Canary 数据对生产等价边界执行攻击。

| 威胁                | 攻击用例                                                                            | 必需控制证据                                            |
| ------------------- | ----------------------------------------------------------------------------------- | ------------------------------------------------------- |
| 跨租户访问          | 外部 ID、混合 Join、缓存/搜索/向量/对象/实时/队列复用                               | 每层 Default-deny，且没有存在性 Oracle                  |
| 会话窃取            | XSS 探针、读取 Cookie、Refresh Replay、CSRF、已撤销 Session、被盗 Connection Ticket | 凭据不可读、轮换、撤销、Origin 与 CSRF 强制执行         |
| 权限提升            | 客户端伪造 Role/Actor/Approval、自批、过期 Delegated Run                            | 服务端解析身份、不可扩权授予、重新授权                  |
| Prompt Injection    | 消息、文件、网页、Memory、Tool Output 要求密钥或策略绕过                            | 内容始终是数据；权限与工具策略不变                      |
| 凭据泄露            | 在 Broker 中植入 Seed Secret，并扫描浏览器、Prompt、Queue、Log、Notification、Audit | 不出现明文，只使用 Opaque Binding                       |
| SSRF 与不安全出口   | Loopback、Private、Metadata、Redirect、DNS Rebind、Slow/Oversized Response          | Destination 解析、Allowlist、网络边界、大小/时间限制    |
| 内容攻击            | XSS、Markdown/HTML/SVG、MIME 混淆、路径穿越、解压炸弹                               | Sanitization、Isolation、类型与大小校验                 |
| Replay 与重复副作用 | 重复 Command、Callback、Job、Approval、Provider Result                              | 幂等规范结果和一次副作用                                |
| 资源耗尽            | Prompt、Upload、Update、Stream、Fan-out、Connection 与 Run Flood                    | Quota、Rate Limit、Backpressure、Cancellation、有界内存 |
| 审计与删除失败      | 尝试修改、遗漏 Event、Hold 下 Purge、保留派生副本                                   | Append-only Trail、Reconciliation、Hold 强制、删除传播  |

权限与安全规范中的强制攻击测试继续作为发布门禁，并通过稳定 ID 调用。每个已修复漏洞都要增加回归，并在适用时加入属性测试或 Fuzz Corpus。

依赖与构建检查检测已知 Critical 风险、恶意安装行为、Lockfile 漂移、意外发布密钥、按策略判定的不安全 License，以及客户端 Bundle 中的意外 Module。例外必须限时、有人负责、有记录，禁止静默接受。

## 16. 性能与容量预算

### 16.1 用户体验预算

生产第 75 百分位目标：

| 指标 |       预算 |
| ---- | ---------: |
| LCP  |   ≤ 2.5 秒 |
| INP  | ≤ 200 毫秒 |
| CLS  |     ≤ 0.05 |
| TTFB | ≤ 800 毫秒 |

交互与协作目标：

| 操作                       |                预算 |
| -------------------------- | ------------------: |
| 导航确认输入               |            ≤ 100 ms |
| 乐观消息可见               |            ≤ 100 ms |
| 已接收 SSE Chunk 提交到 UI |            ≤ 100 ms |
| 本地编辑器输入反馈         |             ≤ 50 ms |
| 同地域协作 Update          |       通常 ≤ 250 ms |
| 主线程 Long Task           |             < 50 ms |
| 规范消息确认               | 同地域通常 ≤ 500 ms |
| 正常 SSE 或 CRDT 重连收敛  |              ≤ 5 秒 |

建议压缩传输预算：

| Surface              |                预算 |
| -------------------- | ------------------: |
| 认证与入口           | ≤ 170 KB JavaScript |
| 工作空间与房间 Shell | ≤ 220 KB JavaScript |
| 会话 Route           | ≤ 250 KB JavaScript |
| 编辑器增量 Chunk     | ≤ 280 KB JavaScript |
| 初始字体             |            ≤ 120 KB |
| 普通首屏图片         |            ≤ 200 KB |

### 16.2 测量

Pull Request 对受影响 Route 运行可重复 Lab Check。Nightly Test 在定义的 CPU 与网络 Profile 上测量冷启动和暖导航。生产遥测按 Route Class、locale、Viewport Class 与 Release 评估 p75，禁止使用高基数用户 Label。

性能测试使用真实规模的房间历史、长文档、并发 Stream 和虚拟列表。长房间通常保持约 100–150 个活跃 Message Node。Streaming 渲染必须 Batch，禁止产生无界 React Commit 或服务端 Buffer。

超过硬预算的回归会阻止发布，除非存在已批准、会过期的例外，其中必须包含测得的用户影响与恢复日期。改善一个指标不能成为违反无障碍、正确性或租户安全的理由。

### 16.3 容量与 Soak Profile

负载 Suite 覆盖：

- 突发消息创建与 Agent 路由；
- 包含 Slow Consumer 的并发 SSE 连接；
- 配置速率下的 WebSocket Presence 与 Yjs Update；
- Queue Backlog、Provider Slowdown、Retry Storm 与 Cancellation；
- 租户过滤下的搜索与检索；
- Notification Fan-out；
- 大房间 Pagination 与 Reconnect；以及
- 工作空间预算边界的用量预留。

Soak Test 观察内存、连接数、Event-loop Delay、数据库连接池饱和、Queue Lag、重复副作用率、Usage Reconciliation 与过期非终态 Run。只有具备测量证据时才能提高 Limit。

## 17. 可靠性、恢复与运行测试

Fault Injection 在每个耐久边界终止进程或中断依赖：Transaction Start、Outbox Append、Enqueue、Lease、Provider Response、Effect Preparation、Effect Confirmation、Result Persist、Acknowledgement 与 Audit Append。

恢复 Suite 证明：

- 无状态 Web 重启不丢失规范工作；
- Queue Lease 恢复与有界重试；
- Dead-letter 诊断与安全 Replay；
- SSE Snapshot/Range Recovery 与 CRDT State-vector Recovery；
- 数据库 Failover 行为与连接恢复；
- 对象或搜索临时故障不会绕过授权；
- 把 Backup Restore 到隔离环境；
- Restore 后的保留期与 Legal Hold 行为；
- 删除传播至数据库、对象、搜索、向量、缓存、Job 与派生 Memory；
- 在供应商语义允许时，Notification Retry 不产生重复投递；以及
- 部分失败后的用量账本对账。

灾难恢复演练必须对照已声明运行目标记录 RPO 与 RTO 结果。Backup 只有在 Restore 和授权检查通过后才算有效。

## 18. 持续集成与发布门禁

### 18.1 Pipeline 阶段

当前 GitHub 工作流是两条独立的 Commit Check，都是合并门禁。本地 `pnpm check` 只覆盖第一条里的静态质量部分，不跑浏览器。

| GitHub Check                 | 本地对应                                                                      | 证明什么                                                                                   |
| ---------------------------- | ----------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------ |
| 文档、格式、类型、测试与构建 | `pnpm infra:up`、`pnpm db:migrate`、`pnpm db:test:integration`、`pnpm check`  | 中英文文档配对、Prettier、类型、Vitest 单元测试、各包构建。不启动浏览器。                  |
| 桌面、平板与手机端到端验收   | `DEMO_MODE=true pnpm test:e2e`（CI 还会 `playwright install` 并写入演示数据） | 在真实 Chromium 里走登录、三栏、后台与系统管理。Linux 无头浏览器与开发指示器都会影响点击。 |

`pnpm check` 通过不能代表 GitHub 全绿。端到端会启动 `next dev`；开发指示器挂在右上角时，`nextjs-portal` 会截走抽屉关闭按钮。Playwright 进程必须关闭该指示器。完整本地对齐用 `pnpm check:all`。`apps/web/next-env.d.ts` 由 `next typegen` / `next dev` / `next build` 生成，不纳入版本库。

| 阶段              | 强制检查                                                                                                      |
| ----------------- | ------------------------------------------------------------------------------------------------------------- |
| Change Validation | Format、Lint、Type、生成树干净、单元/不变量/属性、目录/Schema 对齐、变更代码覆盖率                            |
| Pull Request      | Build、Contract、选定 Integration、Migration Dry Run、受影响 Playwright 旅程、axe、Visual Diff、密钥/依赖扫描 |
| Main Branch       | 完整 Integration、Chromium 全部关键 E2E、租户与攻击 Suite、完整 locale 与视觉矩阵                             |
| Nightly           | WebKit/Firefox 广度、Fuzz Corpus、Load、Soak、Queue Fault Injection、Provider Contract、Flaky Test 检测       |
| Release Candidate | 生产等价 Migration、完整 Q0/Q1 矩阵、Backup Restore、Deletion/Hold、跨浏览器/移动端、人工无障碍与视觉审阅     |
| Canary            | Health、Error、Latency、Saturation、租户拒绝、Usage Reconciliation、Queue Lag、Client Error、Rollback Signal  |

CI Job 使用最小权限身份和隔离租户。密钥必须短期有效。包含 Screenshot、Trace、Video、Payload 或数据库诊断的 Artifact 遵循访问与保留策略。

### 18.2 合并与发布策略

任何必需检查失败、缺失、没有批准理由而被跳过，或产生未经审阅的 Baseline 变化时，Pull Request 都不能合并。

以下任一情况都会阻止发布：

- 存在未关闭的 Critical 或 High Severity 租户、认证、授权、凭据、审批、核算或数据丢失缺陷；
- 具名不变量失败或出现非法状态迁移；
- Fault Test 中出现重复外部副作用或未对账用量；
- CRDT 不收敛或实时 Gap 无法恢复；
- 核心流程存在 Serious 或 Critical 无障碍问题；
- 性能超过硬预算；
- 可达流程缺少 zh-CN 或 en-US 语义；
- Migration、保留期或回滚行为未经审阅；或者
- 必需证据来自不等价环境。

紧急例外需要具名负责人、书面风险、补偿控制、到期时间、回滚标准和审计。租户隔离、凭据暴露、未授权外部副作用与不可恢复数据破坏没有常规例外路径。

## 19. Flake、缺陷、证据与维护

一次测试失败即使自动重试通过，在该次运行报告中仍然保持失败。重试只用于判定可能的 Flake，并捕获 Trace、Video、Screenshot、Log、Seed、Event Schedule、环境版本与 Correlation ID。

Flaky Test 必须有负责人、缺陷记录、观测发生率、风险等级与到期时间。Quarantine 与正常绿色信号隔离，并在发布报告中保持可见。Q0 发布门禁没有经过与生产例外相同的显式风险流程就不能隔离。

测试禁止：

- 当存在可观测 Ready Condition 时使用任意 Sleep；
- 依赖 Suite 顺序或共享可变身份；
- 在 CI 中自动更新 Snapshot 或视觉 Baseline；
- 吞掉 Rejected Promise、浏览器 Console Error 或服务端错误；
- 重试断言直到错误状态恰好消失；
- 在声称覆盖租户或权限的测试中 Mock 授权；或者
- 断言私有实现细节，而不是用户或领域行为。

负责人定期审阅慢、重复、孤立与低价值测试。删除测试前必须证明存在等价证据，或受保护需求已经不再适用。

## 20. 完成定义

一个功能只有满足以下条件才算完成质量建设：

- 已记录风险等级与不变量；
- 单元、属性、契约、集成与 E2E 证据与风险相称；
- Allow、Deny、Revocation、Cross-tenant、Retry、Cancellation 与 Recovery 路径通过；
- 重复与部分失败下的 State、Usage、Audit 与外部副作用仍然一致；
- 相关多人和 CRDT 调度能够收敛；
- 两个首发 locale、目标 Viewport、视觉状态、键盘、触摸、Zoom 与无障碍检查通过；
- 安全攻击与密钥扫描通过；
- 性能与容量保持预算内；
- Migration、Rollback 或 Forward-fix、Retention、Deletion 与 Observability 得到验证；以及
- CI 与发布门禁生成长期、可归属的证据，且没有无法解释的 Flake。
