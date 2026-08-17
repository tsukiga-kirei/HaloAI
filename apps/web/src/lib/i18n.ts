export const locales = ["zh-CN", "en-US"] as const;
export type Locale = (typeof locales)[number];

/**
 * Foundation 演示使用同一个接口约束两种语言，新增或删除 key 时 TypeScript 会立即报错。
 * 接入 next-intl 后仍保留生成类型，并由 CI 检查 ICU 参数、孤立 key 与伪本地化结果。
 */
export interface Dictionary {
  brandTagline: string;
  workspace: string;
  searchPlaceholder: string;
  inbox: string;
  projectRooms: string;
  directMessages: string;
  newRoom: string;
  newProject: string;
  newDocument: string;
  invite: string;
  settings: string;
  roomDescription: string;
  roomResearchDescription: string;
  roomWebsiteDescription: string;
  peopleAndAgents: string;
  activeNow: string;
  mentionMode: string;
  facilitatorMode: string;
  goal: string;
  goalText: string;
  roomResearchGoal: string;
  roomWebsiteGoal: string;
  conversationEmpty: string;
  messagePlaceholder: string;
  messageHint: string;
  send: string;
  addAttachment: string;
  mentionSomeone: string;
  moreActions: string;
  generatedBy: string;
  thinking: string;
  sharedDocument: string;
  documentSubtitle: string;
  editing: string;
  saved: string;
  save: string;
  document: string;
  activity: string;
  versions: string;
  draft: string;
  aiSuggestion: string;
  suggestionText: string;
  applySuggestion: string;
  applied: string;
  docHeading: string;
  docIntro: string;
  docSectionOne: string;
  docSectionOneBody: string;
  docSectionTwo: string;
  docSectionTwoBody: string;
  sources: string;
  sourceOne: string;
  sourceTwo: string;
  rooms: string;
  chat: string;
  mobileNavigation: string;
  workspaceHome: string;
  addTeammate: string;
  human: string;
  aiTeammate: string;
  name: string;
  role: string;
  model: string;
  modelWorkspaceDefault: string;
  modelOpenAICompatible: string;
  modelLocalPrivate: string;
  instructions: string;
  cancel: string;
  create: string;
  rolePlaceholder: string;
  instructionsPlaceholder: string;
  privacyNote: string;
  online: string;
  offline: string;
  unread: string;
  viewDocument: string;
  theme: string;
  language: string;
  demoNotice: string;
  errorReply: string;
  teammateAdded: string;
  createRoomTitle: string;
  createRoomSubtitle: string;
  roomName: string;
  roomNamePlaceholder: string;
  roomGoal: string;
  roomGoalPlaceholder: string;
  roomCreated: string;
  createProjectTitle: string;
  createProjectSubtitle: string;
  projectName: string;
  projectNamePlaceholder: string;
  projectGoal: string;
  projectGoalPlaceholder: string;
  projectCreated: string;
  projectRequired: string;
  noProjectWriteAccess: string;
  selectProject: string;
  expectedArtifact: string;
  expectedArtifactPlaceholder: string;
  roomVisibility: string;
  privateRoom: string;
  workspaceRoom: string;
  createDocumentTitle: string;
  createDocumentSubtitle: string;
  documentTitle: string;
  documentTitlePlaceholder: string;
  optionalRoom: string;
  noRoom: string;
  documentCreated: string;
  noDocuments: string;
  durableDataBoundary: string;
  metadataOnlyNotice: string;
  chatPending: string;
  chatNotEnabled: string;
  noSearchResults: string;
  versionSaved: string;
  versionLabel: string;
  activityDescription: string;
  versionsDescription: string;
  settingsPreview: string;
  workspacePreview: string;
  inboxPreview: string;
  activityPreview: string;
  directMessagePreview: string;
  profilePreview: string;
  overview: string;
  documents: string;
  switchWorkspace: string;
  createWorkspace: string;
  signOut: string;
  personalSettings: string;
  lightTheme: string;
  darkTheme: string;
  switchRole: string;
  switchRolePreview: string;
  roleMember: string;
  roleWorkspaceAdmin: string;
  roleSystemAdmin: string;
  switchedToRole: string;
  collapseSidebar: string;
  expandSidebar: string;
  workspaceOverviewTitle: string;
  workspaceOverviewSubtitle: string;
  localPreviewBoundary: string;
  recentRooms: string;
  actionQueue: string;
  sharedDocuments: string;
  activeRooms: string;
  pendingItems: string;
  openRoom: string;
  viewAll: string;
  inboxSubtitle: string;
  allItems: string;
  mentions: string;
  approvals: string;
  invitations: string;
  markAsRead: string;
  markedRead: string;
  mentionItem: string;
  approvalItem: string;
  invitationItem: string;
  needsReview: string;
  unreadStatus: string;
  documentDirectoryTitle: string;
  documentDirectorySubtitle: string;
  searchDocuments: string;
  allStatuses: string;
  inReview: string;
  approved: string;
  documentOwner: string;
  documentResearchOwner: string;
  openDocument: string;
  documentProposal: string;
  documentResearch: string;
  documentBrand: string;
  updatedToday: string;
  updatedYesterday: string;
  activityTitle: string;
  activitySubtitle: string;
  activityItemOne: string;
  activityItemTwo: string;
  activityItemThree: string;
  activityHumanNote: string;
  columnContent: string;
  columnType: string;
  columnTime: string;
  columnAction: string;
  attachmentPreview: string;
  moreActionsPreview: string;
  sourcePreview: string;
  messageYou: string;
  messageLead: string;
  messageLeadBody: string;
  messageResearcher: string;
  messageResearcherBody: string;
  messageWriter: string;
  messageWriterBody: string;
  today: string;
  roomLaunch: string;
  roomResearch: string;
  roomWebsite: string;
  dmMina: string;
  dmHalo: string;
  roleProductLead: string;
  roleResearchAgent: string;
  roleWritingAgent: string;
  roleFacilitator: string;
}

export const dictionaries: Record<Locale, Dictionary> = {
  "zh-CN": {
    brandTagline: "团队与 AI 并肩，让想法成为成果",
    workspace: "北辰产品组",
    searchPlaceholder: "搜索消息、文档或成员",
    inbox: "收件箱",
    projectRooms: "项目房间",
    directMessages: "私信",
    newRoom: "新建房间",
    newProject: "新建项目",
    newDocument: "新建文档",
    invite: "邀请协作者",
    settings: "设置",
    roomDescription: "把讨论收束成一份可交付的项目提案",
    roomResearchDescription: "归纳访谈证据并形成可验证的用户洞察",
    roomWebsiteDescription: "共同确定品牌叙事、页面结构与发布清单",
    peopleAndAgents: "{total} 位成员 · {people} 人 + {agents} AI",
    activeNow: "正在协作",
    mentionMode: "仅 @ 响应",
    facilitatorMode: "协调员分派",
    goal: "本房间目标",
    goalText: "今天完成 HaloAI 内测提案的结构、证据与首版文稿。",
    roomResearchGoal: "把 12 次访谈整理为问题、证据、机会和待验证假设。",
    roomWebsiteGoal: "完成首页叙事、核心区块和移动端发布检查表。",
    conversationEmpty: "这个房间还没有消息。写下目标，或用 @ 邀请一位 AI 开始协作。",
    messagePlaceholder: "发送消息，或用 @ 邀请一位 AI 参与…",
    messageHint: "Enter 发送 · Shift + Enter 换行",
    send: "发送",
    addAttachment: "添加附件",
    mentionSomeone: "提及成员",
    moreActions: "更多操作",
    generatedBy: "AI 生成",
    thinking: "正在整理上下文…",
    sharedDocument: "共享文档",
    documentSubtitle: "内测发布提案",
    editing: "正在编辑",
    saved: "已保存",
    save: "保存版本",
    document: "正文",
    activity: "动态",
    versions: "版本",
    draft: "草稿 v3",
    aiSuggestion: "AI 修改建议",
    suggestionText: "补充一个可衡量的内测成功标准，并明确由谁做最终验收。",
    applySuggestion: "采纳建议",
    applied: "已采纳",
    docHeading: "HaloAI 内测发布提案",
    docIntro: "让团队在同一个工作空间中，与具名、具角色、具权限的 AI 成员共同完成真实工作。",
    docSectionOne: "01 · 为什么现在做",
    docSectionOneBody:
      "团队已经在聊天工具、独立 AI 对话与文档之间反复搬运上下文。HaloAI 将讨论、专业 AI 与最终成果放回同一个项目空间。",
    docSectionTwo: "02 · 首次内测范围",
    docSectionTwoBody:
      "邀请 5 个项目组，以研究、提案和需求文档为首批任务。默认采用 @ 提及模式，任何对外或不可逆操作都需要人工批准。",
    sources: "证据与来源",
    sourceOne: "12 次内部访谈 · 2026/08",
    sourceTwo: "HaloAI 权限与能力模型",
    rooms: "房间",
    chat: "对话",
    mobileNavigation: "移动端主导航",
    workspaceHome: "工作台",
    addTeammate: "添加协作者",
    human: "人员",
    aiTeammate: "AI 角色",
    name: "名称",
    role: "项目角色",
    model: "模型适配器",
    modelWorkspaceDefault: "使用工作空间默认模型",
    modelOpenAICompatible: "OpenAI 兼容模型",
    modelLocalPrivate: "本地或私有模型",
    instructions: "角色说明",
    cancel: "取消",
    create: "添加到房间",
    rolePlaceholder: "例如：法务审阅者",
    instructionsPlaceholder: "说明职责、边界以及何时保持沉默",
    privacyNote: "权限由服务端策略执行，不会仅依赖 AI 提示词。",
    online: "在线",
    offline: "离线",
    unread: "未读",
    viewDocument: "查看共享文档",
    theme: "切换主题",
    language: "切换语言",
    demoNotice: "当前为本地演示运行时，接入模型后仍沿用相同事件协议。",
    errorReply: "演示运行时暂时没有响应，请稍后再试。",
    teammateAdded: "新协作者已加入这个房间",
    createRoomTitle: "新建项目房间",
    createRoomSubtitle: "房间保存独立的成员、消息、文档与 AI 授权上下文。",
    roomName: "房间名称",
    roomNamePlaceholder: "例如：季度复盘",
    roomGoal: "本房间目标",
    roomGoalPlaceholder: "说明这个房间最终要交付什么",
    roomCreated: "新房间已创建，可以开始协作",
    createProjectTitle: "新建团队项目",
    createProjectSubtitle: "先明确目标和交付物，再创建承载协作的房间。",
    projectName: "项目名称",
    projectNamePlaceholder: "例如：秋季内测发布",
    projectGoal: "项目目标",
    projectGoalPlaceholder: "说明项目要解决的问题和完成标准",
    projectCreated: "项目已创建，你现在是项目负责人",
    projectRequired: "请先创建一个项目，再在项目中建立房间",
    noProjectWriteAccess: "你在当前项目中是只读角色，无法新建房间或文档",
    selectProject: "所属项目",
    expectedArtifact: "预期交付物",
    expectedArtifactPlaceholder: "例如：一份经负责人确认的发布提案",
    roomVisibility: "房间可见范围",
    privateRoom: "仅房间成员",
    workspaceRoom: "工作区成员可见",
    createDocumentTitle: "新建文档记录",
    createDocumentSubtitle: "当前先保存文档名称和归属；正文协作将在后续阶段接入。",
    documentTitle: "文档标题",
    documentTitlePlaceholder: "例如：内测发布提案",
    optionalRoom: "关联房间（可选）",
    noRoom: "暂不关联房间",
    documentCreated: "文档记录已保存",
    noDocuments: "还没有文档记录，可以先建立一份项目交付物。",
    durableDataBoundary: "项目、房间和文档元数据已安全持久化；聊天与 AI 对接仍保持关闭。",
    metadataOnlyNotice: "当前文档仅保存名称、归属和状态，正文编辑将在后续需求明确后接入。",
    chatPending: "聊天与 AI 对接将在需求明确后启用；当前房间仅用于组织项目和交付物。",
    chatNotEnabled: "聊天暂未启用",
    noSearchResults: "没有匹配的房间或成员",
    versionSaved: "文档新版本已保存",
    versionLabel: "版本 v{version}",
    activityDescription: "AI 建议已生成、负责人已审阅，最近的编辑会在这里形成责任记录。",
    versionsDescription: "每次人工保存都会形成可追踪版本；AI 修改只有被采纳后才进入正文。",
    settingsPreview: "设置中心将在内部 Alpha 接入；语言与主题现在可以在个人设置中切换。",
    workspacePreview: "当前演示只有一个工作空间，切换与创建将在认证接入后开放。",
    inboxPreview: "收件箱将在真实消息持久化接入后显示提及、审批和待办。",
    activityPreview: "全局动态将在审计事件接入后展示人员与 AI 的关键操作。",
    directMessagePreview: "私信身份边界已规划，真实会话将在数据库接入后开放。",
    profilePreview: "个人资料与会话设置将在认证接入后开放。",
    overview: "总览",
    documents: "文档",
    switchWorkspace: "切换工作区",
    createWorkspace: "新建工作区",
    signOut: "退出登录",
    personalSettings: "个人设置",
    lightTheme: "浅色",
    darkTheme: "深色",
    switchRole: "切换角色",
    switchRolePreview: "角色切换将在认证接入后开放。",
    roleMember: "协作成员",
    roleWorkspaceAdmin: "空间管理",
    roleSystemAdmin: "系统管理",
    switchedToRole: "已切换到{role}",
    collapseSidebar: "收起侧栏",
    expandSidebar: "展开侧栏",
    workspaceOverviewTitle: "团队工作总览",
    workspaceOverviewSubtitle: "从房间、待处理事项和共享文档继续今天的工作。",
    localPreviewBoundary: "本地预览：不会调用 AI、执行工具或写入外部系统。",
    recentRooms: "最近房间",
    actionQueue: "待处理事项",
    sharedDocuments: "共享文档",
    activeRooms: "活跃房间",
    pendingItems: "待处理",
    openRoom: "进入房间",
    viewAll: "查看全部",
    inboxSubtitle: "集中处理提及、审批和团队邀请。",
    allItems: "全部",
    mentions: "提及",
    approvals: "待审批",
    invitations: "邀请",
    markAsRead: "标记已读",
    markedRead: "已在本地标记为已读",
    mentionItem: "林岚在「内测发布」中提及了你，需要确认最终验收人。",
    approvalItem: "「品牌与官网」的首页文案等待人工审批。",
    invitationItem: "陈然邀请你加入「客户成功手册」项目。",
    needsReview: "需要处理",
    unreadStatus: "未读",
    documentDirectoryTitle: "团队文档",
    documentDirectorySubtitle: "按状态查找交付物，并回到所属房间继续协作。",
    searchDocuments: "搜索文档",
    allStatuses: "全部状态",
    inReview: "审阅中",
    approved: "已批准",
    documentOwner: "负责人",
    documentResearchOwner: "陈然",
    openDocument: "打开文档",
    documentProposal: "HaloAI 内测发布提案",
    documentResearch: "用户访谈洞察汇总",
    documentBrand: "品牌首页叙事与发布清单",
    updatedToday: "今天更新",
    updatedYesterday: "昨天更新",
    activityTitle: "工作空间动态",
    activitySubtitle: "按人员、时间和对象记录可追溯的团队活动。",
    activityItemOne: "林岚保存了「HaloAI 内测发布提案」的新版本。",
    activityItemTwo: "陈然将「用户访谈洞察汇总」移至审阅中。",
    activityItemThree: "Andy 创建了「品牌与官网」房间。",
    activityHumanNote: "这里只展示可归因事件，不展示或推断 AI 的隐藏思考过程。",
    columnContent: "内容",
    columnType: "类型",
    columnTime: "时间",
    columnAction: "操作",
    attachmentPreview: "附件入口已保留；对象存储、病毒扫描和权限过滤接入后开放。",
    moreActionsPreview: "该菜单属于后续业务能力，当前演示不会执行外部或不可逆操作。",
    sourcePreview: "来源详情将在知识与引用服务接入后打开。",
    messageYou: "你",
    messageLead: "林岚",
    messageLeadBody:
      "目标先收窄到一件事：让 5 个内测团队可以在一个房间里和 AI 一起完成提案，而不是做一个新的全能 OA。",
    messageResearcher: "Nova",
    messageResearcherBody:
      "我整理了现有访谈。最高频的问题不是模型效果，而是上下文分散、责任不清，以及最终文档没人维护。建议首版把这三点作为验证假设。",
    messageWriter: "Muse",
    messageWriterBody:
      "我已经把结论同步到右侧提案。第二节目前还缺明确的成功指标，可以由负责人确认后再发布。",
    today: "今天",
    roomLaunch: "内测发布",
    roomResearch: "用户研究",
    roomWebsite: "品牌与官网",
    dmMina: "林岚",
    dmHalo: "Halo 协调员",
    roleProductLead: "产品负责人",
    roleResearchAgent: "研究 AI",
    roleWritingAgent: "写作 AI",
    roleFacilitator: "协作协调员",
  },
  "en-US": {
    brandTagline: "Teams and AI, turning ideas into outcomes",
    workspace: "Northstar Product",
    searchPlaceholder: "Search messages, docs, or people",
    inbox: "Inbox",
    projectRooms: "Project rooms",
    directMessages: "Direct messages",
    newRoom: "New room",
    newProject: "New project",
    newDocument: "New document",
    invite: "Invite collaborator",
    settings: "Settings",
    roomDescription: "Turn the discussion into a shippable project proposal",
    roomResearchDescription: "Synthesize interview evidence into testable user insights",
    roomWebsiteDescription: "Shape the brand narrative, page structure, and launch checklist",
    peopleAndAgents: "{total} members · {people} people + {agents} AI",
    activeNow: "Working now",
    mentionMode: "Reply on @mention",
    facilitatorMode: "Facilitator routes",
    goal: "Room goal",
    goalText: "Finish the structure, evidence, and first draft of the HaloAI pilot proposal today.",
    roomResearchGoal: "Turn 12 interviews into problems, evidence, opportunities, and hypotheses.",
    roomWebsiteGoal: "Finish the homepage narrative, core sections, and mobile launch checklist.",
    conversationEmpty:
      "This room has no messages yet. State the goal or @mention an AI teammate to begin.",
    messagePlaceholder: "Send a message or @mention an AI teammate…",
    messageHint: "Enter to send · Shift + Enter for a new line",
    send: "Send",
    addAttachment: "Add attachment",
    mentionSomeone: "Mention teammate",
    moreActions: "More actions",
    generatedBy: "AI generated",
    thinking: "Organizing context…",
    sharedDocument: "Shared document",
    documentSubtitle: "Pilot launch proposal",
    editing: "Editing",
    saved: "Saved",
    save: "Save version",
    document: "Document",
    activity: "Activity",
    versions: "Versions",
    draft: "Draft v3",
    aiSuggestion: "AI suggestion",
    suggestionText: "Add a measurable pilot success criterion and name the final human approver.",
    applySuggestion: "Apply suggestion",
    applied: "Applied",
    docHeading: "HaloAI pilot launch proposal",
    docIntro:
      "A shared workspace where teams complete real work with named AI members that have explicit roles and permissions.",
    docSectionOne: "01 · Why now",
    docSectionOneBody:
      "Teams repeatedly move context between messengers, isolated AI chats, and documents. HaloAI brings discussion, specialist AI, and the final artifact back into one project space.",
    docSectionTwo: "02 · Initial pilot scope",
    docSectionTwoBody:
      "Invite five project teams and start with research, proposals, and specifications. Mention mode is the default, and every external or irreversible action requires human approval.",
    sources: "Evidence and sources",
    sourceOne: "12 internal interviews · Aug 2026",
    sourceTwo: "HaloAI access and capability model",
    rooms: "Rooms",
    chat: "Chat",
    mobileNavigation: "Mobile primary navigation",
    workspaceHome: "Workspace",
    addTeammate: "Add collaborator",
    human: "Person",
    aiTeammate: "AI role",
    name: "Name",
    role: "Project role",
    model: "Model adapter",
    modelWorkspaceDefault: "Use workspace default",
    modelOpenAICompatible: "OpenAI-compatible model",
    modelLocalPrivate: "Local or private model",
    instructions: "Role instructions",
    cancel: "Cancel",
    create: "Add to room",
    rolePlaceholder: "For example: Legal reviewer",
    instructionsPlaceholder: "Describe responsibilities, boundaries, and when to stay silent",
    privacyNote:
      "Server-side policy enforces permissions; prompts are never the authorization boundary.",
    online: "Online",
    offline: "Offline",
    unread: "Unread",
    viewDocument: "View shared document",
    theme: "Change theme",
    language: "Change language",
    demoNotice: "This is the local demo runtime. Real model providers use the same event contract.",
    errorReply: "The demo runtime did not respond. Please try again.",
    teammateAdded: "A new collaborator joined this room",
    createRoomTitle: "Create project room",
    createRoomSubtitle:
      "Each room keeps its own members, messages, document, and AI authorization context.",
    roomName: "Room name",
    roomNamePlaceholder: "For example: Quarterly review",
    roomGoal: "Room goal",
    roomGoalPlaceholder: "Describe the artifact this room must deliver",
    roomCreated: "The new room is ready for collaboration",
    createProjectTitle: "Create team project",
    createProjectSubtitle: "Define the goal and artifact before creating collaboration rooms.",
    projectName: "Project name",
    projectNamePlaceholder: "For example: Autumn pilot launch",
    projectGoal: "Project goal",
    projectGoalPlaceholder: "Describe the problem and what completion means",
    projectCreated: "Project created; you are its lead",
    projectRequired: "Create a project before adding a room",
    noProjectWriteAccess:
      "Your current project role is read-only and cannot create rooms or documents",
    selectProject: "Project",
    expectedArtifact: "Expected artifact",
    expectedArtifactPlaceholder: "For example: A launch proposal approved by the lead",
    roomVisibility: "Room visibility",
    privateRoom: "Room members only",
    workspaceRoom: "Visible to workspace members",
    createDocumentTitle: "Create document record",
    createDocumentSubtitle:
      "For now, save the document name and ownership. Collaborative content comes later.",
    documentTitle: "Document title",
    documentTitlePlaceholder: "For example: Pilot launch proposal",
    optionalRoom: "Related room (optional)",
    noRoom: "No room yet",
    documentCreated: "Document record saved",
    noDocuments: "No document records yet. Create the first project artifact.",
    durableDataBoundary:
      "Projects, rooms, and document metadata are durably stored; chat and AI remain disabled.",
    metadataOnlyNotice:
      "Only the title, ownership, and status are stored now. Content editing comes after requirements are defined.",
    chatPending:
      "Chat and AI will open after requirements are defined; this room currently organizes projects and artifacts only.",
    chatNotEnabled: "Chat not enabled",
    noSearchResults: "No matching rooms or people",
    versionSaved: "A new document version was saved",
    versionLabel: "Version v{version}",
    activityDescription:
      "An AI suggestion was created and reviewed; recent edits appear here as accountable events.",
    versionsDescription:
      "Every human save creates a traceable version. AI changes enter the document only after approval.",
    settingsPreview:
      "Settings arrive in Internal Alpha. Language and theme controls already work in personal settings.",
    workspacePreview:
      "This demo has one workspace. Switching and creation open after authentication is connected.",
    inboxPreview:
      "Inbox will show mentions, approvals, and tasks after durable messaging is connected.",
    activityPreview:
      "Global activity will show important human and AI actions after audit events are connected.",
    directMessagePreview:
      "Direct-message identity boundaries are designed; durable conversations open with persistence.",
    profilePreview: "Profile and session settings open after authentication is connected.",
    overview: "Overview",
    documents: "Documents",
    switchWorkspace: "Switch workspace",
    createWorkspace: "Create workspace",
    signOut: "Sign out",
    personalSettings: "Personal settings",
    lightTheme: "Light",
    darkTheme: "Dark",
    switchRole: "Switch role",
    switchRolePreview: "Role switching opens after authentication is connected.",
    roleMember: "Collaborator",
    roleWorkspaceAdmin: "Workspace admin",
    roleSystemAdmin: "System admin",
    switchedToRole: "Switched to {role}",
    collapseSidebar: "Collapse sidebar",
    expandSidebar: "Expand sidebar",
    workspaceOverviewTitle: "Team workspace overview",
    workspaceOverviewSubtitle: "Continue today's work across rooms, action items, and shared docs.",
    localPreviewBoundary: "Local preview: no AI calls, tool execution, or external writes.",
    recentRooms: "Recent rooms",
    actionQueue: "Action queue",
    sharedDocuments: "Shared documents",
    activeRooms: "Active rooms",
    pendingItems: "Pending",
    openRoom: "Open room",
    viewAll: "View all",
    inboxSubtitle: "Handle mentions, approvals, and team invitations in one place.",
    allItems: "All",
    mentions: "Mentions",
    approvals: "Approvals",
    invitations: "Invitations",
    markAsRead: "Mark as read",
    markedRead: "Marked as read in this local preview",
    mentionItem: "Mina mentioned you in “Pilot launch” to confirm the final approver.",
    approvalItem: "Homepage copy in “Brand and website” is waiting for human approval.",
    invitationItem: "Chen Ran invited you to the “Customer success handbook” project.",
    needsReview: "Needs action",
    unreadStatus: "Unread",
    documentDirectoryTitle: "Team documents",
    documentDirectorySubtitle: "Find deliverables by status and return to their room to continue.",
    searchDocuments: "Search documents",
    allStatuses: "All statuses",
    inReview: "In review",
    approved: "Approved",
    documentOwner: "Owner",
    documentResearchOwner: "Chen Ran",
    openDocument: "Open document",
    documentProposal: "HaloAI pilot launch proposal",
    documentResearch: "User interview insight synthesis",
    documentBrand: "Homepage narrative and launch checklist",
    updatedToday: "Updated today",
    updatedYesterday: "Updated yesterday",
    activityTitle: "Workspace activity",
    activitySubtitle: "Traceable team events with an explicit person, time, and object.",
    activityItemOne: "Mina saved a new version of “HaloAI pilot launch proposal”.",
    activityItemTwo: "Chen Ran moved “User interview insight synthesis” to in review.",
    activityItemThree: "Andy created the “Brand and website” room.",
    activityHumanNote:
      "Only attributable events appear here; hidden AI reasoning is never shown or inferred.",
    columnContent: "Item",
    columnType: "Type",
    columnTime: "Time",
    columnAction: "Action",
    attachmentPreview:
      "Attachment UI is reserved. It opens after object storage, malware scanning, and ACL filtering are connected.",
    moreActionsPreview:
      "This menu belongs to later product capabilities. The demo will not perform external or irreversible actions.",
    sourcePreview: "Source details open after knowledge and citation services are connected.",
    messageYou: "You",
    messageLead: "Mina Lin",
    messageLeadBody:
      "Let's narrow the goal to one job: help five pilot teams finish a proposal with AI in one room. We are not building another all-purpose office suite.",
    messageResearcher: "Nova",
    messageResearcherBody:
      "I reviewed the interviews. The recurring problems are scattered context, unclear ownership, and an unmaintained final document—not raw model quality. These should be our pilot hypotheses.",
    messageWriter: "Muse",
    messageWriterBody:
      "I synchronized the conclusion to the proposal on the right. Section two still needs a measurable success metric before the owner publishes it.",
    today: "Today",
    roomLaunch: "Pilot launch",
    roomResearch: "User research",
    roomWebsite: "Brand and website",
    dmMina: "Mina Lin",
    dmHalo: "Halo facilitator",
    roleProductLead: "Product lead",
    roleResearchAgent: "Research AI",
    roleWritingAgent: "Writing AI",
    roleFacilitator: "Team facilitator",
  },
};

export function getDictionary(locale: Locale): Dictionary {
  return dictionaries[locale];
}
