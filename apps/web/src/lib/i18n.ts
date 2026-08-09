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
  invite: string;
  settings: string;
  roomDescription: string;
  peopleAndAgents: string;
  activeNow: string;
  mentionMode: string;
  facilitatorMode: string;
  goal: string;
  goalText: string;
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
  addTeammate: string;
  teammateSubtitle: string;
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
    brandTagline: "让工作拥有一圈 AI 光环",
    workspace: "北辰产品组",
    searchPlaceholder: "搜索消息、文档或成员",
    inbox: "收件箱",
    projectRooms: "项目房间",
    directMessages: "私信",
    newRoom: "新建房间",
    invite: "邀请协作者",
    settings: "设置",
    roomDescription: "把讨论收束成一份可交付的项目提案",
    peopleAndAgents: "4 位成员 · 2 人 + 2 AI",
    activeNow: "正在协作",
    mentionMode: "仅 @ 响应",
    facilitatorMode: "协调员分派",
    goal: "本房间目标",
    goalText: "今天完成 HaloAI 内测提案的结构、证据与首版文稿。",
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
    docSectionOneBody: "团队已经在聊天工具、独立 AI 对话与文档之间反复搬运上下文。HaloAI 将讨论、专业 AI 与最终成果放回同一个项目空间。",
    docSectionTwo: "02 · 首次内测范围",
    docSectionTwoBody: "邀请 5 个项目组，以研究、提案和需求文档为首批任务。默认采用 @ 提及模式，任何对外或不可逆操作都需要人工批准。",
    sources: "证据与来源",
    sourceOne: "12 次内部访谈 · 2026/08",
    sourceTwo: "HaloAI 权限与能力模型",
    rooms: "房间",
    chat: "对话",
    mobileNavigation: "移动端主导航",
    addTeammate: "添加协作者",
    teammateSubtitle: "人和 AI 都是成员，但权限必须独立配置。",
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
    messageYou: "你",
    messageLead: "林岚",
    messageLeadBody: "目标先收窄到一件事：让 5 个内测团队可以在一个房间里和 AI 一起完成提案，而不是做一个新的全能 OA。",
    messageResearcher: "Nova",
    messageResearcherBody: "我整理了现有访谈。最高频的问题不是模型效果，而是上下文分散、责任不清，以及最终文档没人维护。建议首版把这三点作为验证假设。",
    messageWriter: "Muse",
    messageWriterBody: "我已经把结论同步到右侧提案。第二节目前还缺明确的成功指标，可以由负责人确认后再发布。",
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
    brandTagline: "Give work an AI capability halo",
    workspace: "Northstar Product",
    searchPlaceholder: "Search messages, docs, or people",
    inbox: "Inbox",
    projectRooms: "Project rooms",
    directMessages: "Direct messages",
    newRoom: "New room",
    invite: "Invite collaborator",
    settings: "Settings",
    roomDescription: "Turn the discussion into a shippable project proposal",
    peopleAndAgents: "4 members · 2 people + 2 AI",
    activeNow: "Working now",
    mentionMode: "Reply on @mention",
    facilitatorMode: "Facilitator routes",
    goal: "Room goal",
    goalText: "Finish the structure, evidence, and first draft of the HaloAI pilot proposal today.",
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
    docIntro: "A shared workspace where teams complete real work with named AI members that have explicit roles and permissions.",
    docSectionOne: "01 · Why now",
    docSectionOneBody: "Teams repeatedly move context between messengers, isolated AI chats, and documents. HaloAI brings discussion, specialist AI, and the final artifact back into one project space.",
    docSectionTwo: "02 · Initial pilot scope",
    docSectionTwoBody: "Invite five project teams and start with research, proposals, and specifications. Mention mode is the default, and every external or irreversible action requires human approval.",
    sources: "Evidence and sources",
    sourceOne: "12 internal interviews · Aug 2026",
    sourceTwo: "HaloAI access and capability model",
    rooms: "Rooms",
    chat: "Chat",
    mobileNavigation: "Mobile primary navigation",
    addTeammate: "Add collaborator",
    teammateSubtitle: "People and AI are both members, but their permissions are configured independently.",
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
    privacyNote: "Server-side policy enforces permissions; prompts are never the authorization boundary.",
    online: "Online",
    offline: "Offline",
    unread: "Unread",
    viewDocument: "View shared document",
    theme: "Change theme",
    language: "Change language",
    demoNotice: "This is the local demo runtime. Real model providers use the same event contract.",
    errorReply: "The demo runtime did not respond. Please try again.",
    teammateAdded: "A new collaborator joined this room",
    messageYou: "You",
    messageLead: "Mina Lin",
    messageLeadBody: "Let's narrow the goal to one job: help five pilot teams finish a proposal with AI in one room. We are not building another all-purpose office suite.",
    messageResearcher: "Nova",
    messageResearcherBody: "I reviewed the interviews. The recurring problems are scattered context, unclear ownership, and an unmaintained final document—not raw model quality. These should be our pilot hypotheses.",
    messageWriter: "Muse",
    messageWriterBody: "I synchronized the conclusion to the proposal on the right. Section two still needs a measurable success metric before the owner publishes it.",
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
