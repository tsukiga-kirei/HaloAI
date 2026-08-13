import type { Locale } from "./i18n";

export interface AdminDictionary {
  productArea: string;
  administration: string;
  administrationSubtitle: string;
  workspaceScope: string;
  roleOwner: string;
  backToWork: string;
  changeLanguage: string;
  changeTheme: string;
  personalSettings: string;
  lightTheme: string;
  darkTheme: string;
  switchRole: string;
  switchRolePreview: string;
  collapseSidebar: string;
  expandSidebar: string;
  signOut: string;
  navLabel: string;
  navOverview: string;
  navMembers: string;
  navAgents: string;
  navIntegrations: string;
  navSecurity: string;
  navAudit: string;
  previewBadge: string;
  previewNotice: string;
  overviewTitle: string;
  overviewDescription: string;
  membersTitle: string;
  membersDescription: string;
  agentsTitle: string;
  agentsDescription: string;
  integrationsTitle: string;
  integrationsDescription: string;
  securityTitle: string;
  securityDescription: string;
  auditTitle: string;
  auditDescription: string;
  inviteMember: string;
  createAgent: string;
  configure: string;
  exportAudit: string;
  activeMembers: string;
  aiCollaborators: string;
  monthlyRuns: string;
  pendingApprovals: string;
  comparedToLastMonth: string;
  availableNow: string;
  requiresReview: string;
  governanceHealth: string;
  governanceDescription: string;
  identityStatus: string;
  identityStatusDetail: string;
  aiPolicyStatus: string;
  aiPolicyStatusDetail: string;
  retentionStatus: string;
  retentionStatusDetail: string;
  recentActivity: string;
  activityMember: string;
  activityAgent: string;
  activityPolicy: string;
  timeMinutes: string;
  timeHours: string;
  tableName: string;
  tableType: string;
  tableRole: string;
  tableStatus: string;
  tableLastActive: string;
  statusActive: string;
  statusInvited: string;
  statusPaused: string;
  typePerson: string;
  typeAI: string;
  memberMina: string;
  memberAndy: string;
  memberNoah: string;
  roleWorkspaceOwner: string;
  roleProductLead: string;
  roleGuestReviewer: string;
  agentNova: string;
  agentMuse: string;
  agentHalo: string;
  agentResearch: string;
  agentWriting: string;
  agentFacilitator: string;
  publishedVersion: string;
  toolScope: string;
  integrationModel: string;
  integrationModelDetail: string;
  integrationStorage: string;
  integrationStorageDetail: string;
  integrationMcp: string;
  integrationMcpDetail: string;
  connected: string;
  notConnected: string;
  securitySession: string;
  securitySessionDetail: string;
  securityApproval: string;
  securityApprovalDetail: string;
  securityRls: string;
  securityRlsDetail: string;
  enforced: string;
  auditEvent: string;
  auditActor: string;
  auditScope: string;
  auditTime: string;
  auditEventMember: string;
  auditEventAgent: string;
  auditEventPolicy: string;
  auditSystem: string;
  localOnlyNotice: string;
  accessDeniedTitle: string;
  accessDeniedDescription: string;
  accessDeniedReason: string;
  systemBoundary: string;
  systemTitle: string;
  systemDescription: string;
  systemRuleOne: string;
  systemRuleTwo: string;
  systemRuleThree: string;
  returnToWorkspace: string;
}

const zhCN: AdminDictionary = {
  productArea: "团队协作前台",
  administration: "工作空间管理",
  administrationSubtitle: "管理成员、AI 与安全边界",
  workspaceScope: "当前作用域",
  roleOwner: "Workspace Owner",
  backToWork: "返回协作前台",
  changeLanguage: "切换语言",
  changeTheme: "切换主题",
  navLabel: "后台配置导航",
  navOverview: "总览",
  navMembers: "成员与角色",
  navAgents: "AI 协作者",
  navIntegrations: "模型与集成",
  navSecurity: "安全策略",
  navAudit: "审计记录",
  previewBadge: "Alpha 预览",
  previewNotice: "当前为受控预览数据；未连接 API 的操作不会写入数据库。",
  overviewTitle: "工作空间总览",
  overviewDescription: "先看团队、AI、审批与治理状态，再决定需要调整什么。",
  membersTitle: "成员与访问角色",
  membersDescription: "人员身份、成员状态与访问角色彼此独立，撤权后立即生效。",
  agentsTitle: "AI 协作者",
  agentsDescription: "管理具名 AI 的职责、版本与能力范围，不在提示词中隐藏权限。",
  integrationsTitle: "模型与集成",
  integrationsDescription: "连接模型、存储与工具，同时保持凭据和网络范围最小化。",
  securityTitle: "安全策略",
  securityDescription: "检查会话、人工审批与租户隔离是否处于强制执行状态。",
  auditTitle: "审计记录",
  auditDescription: "以人员、AI 和系统主体重建关键操作的责任链。",
  inviteMember: "邀请成员",
  createAgent: "创建 AI 协作者",
  configure: "查看配置",
  exportAudit: "导出审计记录",
  activeMembers: "活跃成员",
  aiCollaborators: "已发布 AI",
  monthlyRuns: "本月 AI 运行",
  pendingApprovals: "待处理审批",
  comparedToLastMonth: "较上月 +12%",
  availableNow: "运行正常",
  requiresReview: "需要负责人处理",
  governanceHealth: "治理状态",
  governanceDescription: "关键边界都应能被团队理解，而不只是藏在技术配置中。",
  identityStatus: "成员身份",
  identityStatusDetail: "8 位活跃成员，1 份待接受邀请",
  aiPolicyStatus: "AI 发布策略",
  aiPolicyStatusDetail: "3 个已发布版本，所有写入均需人工确认",
  retentionStatus: "保留与删除",
  retentionStatusDetail: "默认保留 180 天，法务保留未启用",
  recentActivity: "最近管理动态",
  activityMember: "林岚邀请了一位项目审阅者",
  activityAgent: "Nova 发布了版本 v4",
  activityPolicy: "安全策略已完成例行检查",
  timeMinutes: "18 分钟前",
  timeHours: "2 小时前",
  tableName: "名称",
  tableType: "类型",
  tableRole: "访问角色",
  tableStatus: "状态",
  tableLastActive: "最近活动",
  statusActive: "已启用",
  statusInvited: "待接受邀请",
  statusPaused: "已暂停",
  typePerson: "人员",
  typeAI: "AI",
  memberMina: "林岚",
  memberAndy: "安迪",
  memberNoah: "Noah Chen",
  roleWorkspaceOwner: "工作空间所有者",
  roleProductLead: "项目负责人",
  roleGuestReviewer: "外部审阅者",
  agentNova: "Nova",
  agentMuse: "Muse",
  agentHalo: "Halo 协调员",
  agentResearch: "研究与证据整理",
  agentWriting: "结构化写作与修订建议",
  agentFacilitator: "按房间策略分派最少必要参与者",
  publishedVersion: "已发布 · v{version}",
  toolScope: "工具范围",
  integrationModel: "模型网关",
  integrationModelDetail: "工作空间默认策略已配置，密钥仅在服务端解析",
  integrationStorage: "对象存储",
  integrationStorageDetail: "等待接入扫描、隔离与生命周期策略",
  integrationMcp: "MCP 工具",
  integrationMcpDetail: "尚未连接；启用前需要域名白名单与审批策略",
  connected: "已连接",
  notConnected: "未连接",
  securitySession: "会话安全",
  securitySessionDetail: "短期访问会话与可撤销刷新会话",
  securityApproval: "高风险人工审批",
  securityApprovalDetail: "发布、删除、外部写入和权限变更默认拦截",
  securityRls: "工作空间数据隔离",
  securityRlsDetail: "应用授权与 PostgreSQL RLS 双重检查",
  enforced: "强制执行",
  auditEvent: "事件",
  auditActor: "执行主体",
  auditScope: "作用域",
  auditTime: "时间",
  auditEventMember: "member.invited",
  auditEventAgent: "agent.version.published",
  auditEventPolicy: "security.policy.reviewed",
  auditSystem: "系统策略服务",
  localOnlyNotice: "界面反馈已完成；持久写入将在管理 API 接入后开放。",
  accessDeniedTitle: "无法进入工作空间后台",
  accessDeniedDescription: "当前会话没有所需的管理能力，或真实认证尚未接入。",
  accessDeniedReason: "为避免权限误配，直接访问链接不会绕过服务端检查。",
  systemBoundary: "平台级安全边界",
  systemTitle: "系统后台保持锁定",
  systemDescription: "工作空间所有者不会自动成为平台管理员。系统运营身份与租户身份必须完全分离。",
  systemRuleOne: "默认不读取任何团队的对话、文档或 AI 上下文。",
  systemRuleTwo: "跨租户支持访问必须限时、说明理由并形成独立审计。",
  systemRuleThree: "平台健康信息不得包含可识别的客户内容。",
  returnToWorkspace: "返回 HaloAI 工作空间",
};

const enUS: AdminDictionary = {
  productArea: "Collaboration workspace",
  administration: "Workspace administration",
  administrationSubtitle: "Manage people, AI, and safety boundaries",
  workspaceScope: "Current scope",
  roleOwner: "Workspace Owner",
  backToWork: "Back to collaboration",
  changeLanguage: "Change language",
  changeTheme: "Change theme",
  navLabel: "Administration navigation",
  navOverview: "Overview",
  navMembers: "Members & roles",
  navAgents: "AI collaborators",
  navIntegrations: "Models & integrations",
  navSecurity: "Security policy",
  navAudit: "Audit log",
  previewBadge: "Alpha preview",
  previewNotice:
    "This is controlled preview data. Actions without an API do not write to the database.",
  overviewTitle: "Workspace overview",
  overviewDescription:
    "Review the team, AI, approvals, and governance state before changing configuration.",
  membersTitle: "Members and access roles",
  membersDescription:
    "Identity, membership state, and access roles remain separate. Revocation takes effect immediately.",
  agentsTitle: "AI collaborators",
  agentsDescription:
    "Manage named AI responsibilities, versions, and capabilities without hiding permissions in prompts.",
  integrationsTitle: "Models and integrations",
  integrationsDescription:
    "Connect models, storage, and tools while keeping credentials and network scope minimal.",
  securityTitle: "Security policy",
  securityDescription:
    "Verify that sessions, human approval, and tenant isolation are being enforced.",
  auditTitle: "Audit log",
  auditDescription: "Reconstruct accountability across human, AI, and system actors.",
  inviteMember: "Invite member",
  createAgent: "Create AI collaborator",
  configure: "View configuration",
  exportAudit: "Export audit log",
  activeMembers: "Active members",
  aiCollaborators: "Published AI",
  monthlyRuns: "AI runs this month",
  pendingApprovals: "Pending approvals",
  comparedToLastMonth: "+12% from last month",
  availableNow: "Operating normally",
  requiresReview: "Owner action required",
  governanceHealth: "Governance health",
  governanceDescription:
    "Key boundaries should be understandable to the team, not hidden in technical configuration.",
  identityStatus: "Member identity",
  identityStatusDetail: "8 active members and 1 pending invitation",
  aiPolicyStatus: "AI publishing policy",
  aiPolicyStatusDetail: "3 published versions; every write requires human confirmation",
  retentionStatus: "Retention and deletion",
  retentionStatusDetail: "180-day default retention; legal hold is disabled",
  recentActivity: "Recent administration activity",
  activityMember: "Mina invited a project reviewer",
  activityAgent: "Nova published version v4",
  activityPolicy: "The scheduled security policy review completed",
  timeMinutes: "18 minutes ago",
  timeHours: "2 hours ago",
  tableName: "Name",
  tableType: "Type",
  tableRole: "Access role",
  tableStatus: "Status",
  tableLastActive: "Last active",
  statusActive: "Active",
  statusInvited: "Invitation pending",
  statusPaused: "Paused",
  typePerson: "Person",
  typeAI: "AI",
  memberMina: "Mina Lin",
  memberAndy: "Andy",
  memberNoah: "Noah Chen",
  roleWorkspaceOwner: "Workspace owner",
  roleProductLead: "Project lead",
  roleGuestReviewer: "Guest reviewer",
  agentNova: "Nova",
  agentMuse: "Muse",
  agentHalo: "Halo facilitator",
  agentResearch: "Research and evidence synthesis",
  agentWriting: "Structured writing and revision proposals",
  agentFacilitator: "Routes the minimum necessary participants under room policy",
  publishedVersion: "Published · v{version}",
  toolScope: "Tool scope",
  integrationModel: "Model gateway",
  integrationModelDetail:
    "Workspace default policy configured; credentials resolve only on the server",
  integrationStorage: "Object storage",
  integrationStorageDetail: "Waiting for scanning, quarantine, and lifecycle policy",
  integrationMcp: "MCP tools",
  integrationMcpDetail: "Not connected; domain allowlists and approval policy are required first",
  connected: "Connected",
  notConnected: "Not connected",
  securitySession: "Session security",
  securitySessionDetail: "Short-lived access sessions with revocable refresh sessions",
  securityApproval: "Human approval for high risk",
  securityApprovalDetail:
    "Publishing, deletion, external writes, and permission changes are blocked by default",
  securityRls: "Workspace data isolation",
  securityRlsDetail: "Application authorization and PostgreSQL RLS both apply",
  enforced: "Enforced",
  auditEvent: "Event",
  auditActor: "Actor",
  auditScope: "Scope",
  auditTime: "Time",
  auditEventMember: "member.invited",
  auditEventAgent: "agent.version.published",
  auditEventPolicy: "security.policy.reviewed",
  auditSystem: "System policy service",
  localOnlyNotice:
    "Interface feedback completed. Durable writes open after the administration API is connected.",
  accessDeniedTitle: "Workspace administration is unavailable",
  accessDeniedDescription:
    "The current session lacks the required capability, or real authentication is not connected yet.",
  accessDeniedReason: "Direct navigation never bypasses server authorization checks.",
  systemBoundary: "Platform security boundary",
  systemTitle: "System administration stays locked",
  systemDescription:
    "Workspace owners never become platform administrators implicitly. Platform and tenant identities must remain separate.",
  systemRuleOne: "No team's conversations, documents, or AI context are readable by default.",
  systemRuleTwo:
    "Cross-tenant support access must be time-limited, justified, and independently audited.",
  systemRuleThree: "Platform health data must not contain identifiable customer content.",
  returnToWorkspace: "Return to HaloAI workspace",
};

export const adminDictionaries: Record<Locale, AdminDictionary> = {
  "zh-CN": zhCN,
  "en-US": enUS,
};
