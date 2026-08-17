import type { Locale } from "./i18n";

export interface AdminDictionary {
  productArea: string;
  administration: string;
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
  roleMember: string;
  roleWorkspaceAdmin: string;
  roleSystemAdmin: string;
  switchedToRole: string;
  navLabel: string;
  navOverview: string;
  navMembers: string;
  navAgents: string;
  navIntegrations: string;
  navSecurity: string;
  navAudit: string;
  overviewTitle: string;
  membersTitle: string;
  agentsTitle: string;
  integrationsTitle: string;
  securityTitle: string;
  auditTitle: string;
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
  systemNavLabel: string;
  systemConsoleTitle: string;
  navTenants: string;
  navModels: string;
  navHealth: string;
  navPolicy: string;
  systemOverviewTitle: string;
  systemTenantsTitle: string;
  systemModelsTitle: string;
  systemHealthTitle: string;
  systemPolicyTitle: string;
  systemModelsIntro: string;
  systemModelsCatalog: string;
  systemModelsAllocation: string;
  registerModel: string;
  allocateToTenant: string;
  revokeFromTenant: string;
  modelSource: string;
  modelSecret: string;
  modelSecretStored: string;
  modelSecretMissing: string;
  allocatedTo: string;
  allocatedModels: string;
  noneAllocated: string;
  tableActions: string;
  modelSourceCompatible: string;
  modelSourceLocal: string;
  modelConversationDefault: string;
  modelLocalName: string;
  modelResearchName: string;
  workspaceModelsIntro: string;
  workspaceIntegrationsTitle: string;
  assignToAgent: string;
  agentAssignedModel: string;
  workspaceModelAllocated: string;
  listSeparator: string;
  tenantName: string;
  tenantStatus: string;
  tenantPlan: string;
  healthService: string;
  healthState: string;
  tenantBeichen: string;
  tenantAurora: string;
  tenantPlanPilot: string;
}

const zhCN: AdminDictionary = {
  productArea: "团队协作前台",
  administration: "工作空间管理",
  workspaceScope: "当前作用域",
  roleOwner: "Workspace Owner",
  backToWork: "返回协作前台",
  changeLanguage: "切换语言",
  changeTheme: "切换主题",
  personalSettings: "个人设置",
  lightTheme: "浅色",
  darkTheme: "深色",
  switchRole: "切换角色",
  switchRolePreview: "角色切换将在认证接入后开放。",
  collapseSidebar: "收起侧栏",
  expandSidebar: "展开侧栏",
  signOut: "退出登录",
  roleMember: "协作成员",
  roleWorkspaceAdmin: "空间管理",
  roleSystemAdmin: "系统管理",
  switchedToRole: "已切换到{role}",
  navLabel: "后台配置导航",
  navOverview: "总览",
  navMembers: "成员与角色",
  navAgents: "AI 协作者",
  navIntegrations: "可用模型",
  navSecurity: "安全策略",
  navAudit: "审计记录",
  overviewTitle: "工作空间总览",
  membersTitle: "成员与访问角色",
  agentsTitle: "AI 协作者",
  integrationsTitle: "本空间可用模型",
  securityTitle: "安全策略",
  auditTitle: "审计记录",
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
  integrationModel: "对话默认模型",
  integrationModelDetail: "系统已分配给本空间，可配给 AI 协作者。密钥不在此填写。",
  integrationStorage: "对象存储",
  integrationStorageDetail: "由平台提供；本空间不能自行接入。",
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
  systemNavLabel: "系统后台导航",
  systemConsoleTitle: "系统管理",
  navTenants: "租户",
  navModels: "模型",
  navHealth: "健康",
  navPolicy: "策略",
  systemOverviewTitle: "平台总览",
  systemTenantsTitle: "租户目录",
  systemModelsTitle: "平台模型",
  systemHealthTitle: "平台健康",
  systemPolicyTitle: "全局策略",
  systemModelsIntro: "在这里维护整套可用模型，再分配给租户。密钥只保存在服务端，页面不展示明文。",
  systemModelsCatalog: "模型目录",
  systemModelsAllocation: "分配给租户",
  registerModel: "登记模型",
  allocateToTenant: "分配",
  revokeFromTenant: "收回",
  modelSource: "来源服务",
  modelSecret: "密钥",
  modelSecretStored: "已保存在服务端",
  modelSecretMissing: "未配置",
  allocatedTo: "已分配租户",
  allocatedModels: "已分配模型",
  noneAllocated: "未分配",
  tableActions: "操作",
  modelSourceCompatible: "兼容 OpenAI 接口的服务",
  modelSourceLocal: "本地或私有服务",
  modelConversationDefault: "对话默认模型",
  modelLocalName: "本地私有模型",
  modelResearchName: "研究用模型",
  workspaceModelsIntro: "这些模型由系统管理分配给本空间。不能在此接入新服务或填写密钥，只能配给本空间的 AI。",
  workspaceIntegrationsTitle: "其他集成",
  assignToAgent: "分配给 AI",
  agentAssignedModel: "使用模型",
  workspaceModelAllocated: "已分配",
  listSeparator: "、",
  tenantName: "租户",
  tenantStatus: "状态",
  tenantPlan: "方案",
  healthService: "服务",
  healthState: "状态",
  tenantBeichen: "北辰产品组",
  tenantAurora: "Aurora Labs",
  tenantPlanPilot: "试点",
};

const enUS: AdminDictionary = {
  productArea: "Collaboration workspace",
  administration: "Workspace administration",
  workspaceScope: "Current scope",
  roleOwner: "Workspace Owner",
  backToWork: "Back to collaboration",
  changeLanguage: "Change language",
  changeTheme: "Change theme",
  personalSettings: "Personal settings",
  lightTheme: "Light",
  darkTheme: "Dark",
  switchRole: "Switch role",
  switchRolePreview: "Role switching opens after authentication is connected.",
  collapseSidebar: "Collapse sidebar",
  expandSidebar: "Expand sidebar",
  signOut: "Sign out",
  roleMember: "Collaborator",
  roleWorkspaceAdmin: "Workspace admin",
  roleSystemAdmin: "System admin",
  switchedToRole: "Switched to {role}",
  navLabel: "Administration navigation",
  navOverview: "Overview",
  navMembers: "Members & roles",
  navAgents: "AI collaborators",
  navIntegrations: "Available models",
  navSecurity: "Security policy",
  navAudit: "Audit log",
  overviewTitle: "Workspace overview",
  membersTitle: "Members and access roles",
  agentsTitle: "AI collaborators",
  integrationsTitle: "Models available here",
  securityTitle: "Security policy",
  auditTitle: "Audit log",
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
  integrationModel: "Conversation default model",
  integrationModelDetail:
    "Allocated to this workspace by system administration. Assign it to an AI collaborator; do not enter a secret here.",
  integrationStorage: "File storage",
  integrationStorageDetail: "Provided by the platform; this workspace cannot connect its own store.",
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
  systemNavLabel: "System administration navigation",
  systemConsoleTitle: "System administration",
  navTenants: "Tenants",
  navModels: "Models",
  navHealth: "Health",
  navPolicy: "Policy",
  systemOverviewTitle: "Platform overview",
  systemTenantsTitle: "Tenant directory",
  systemModelsTitle: "Platform models",
  systemHealthTitle: "Platform health",
  systemPolicyTitle: "Global policy",
  systemModelsIntro:
    "Maintain the full catalog here, then allocate models to tenants. Secrets stay on the server and never appear on this page.",
  systemModelsCatalog: "Model catalog",
  systemModelsAllocation: "Tenant allocation",
  registerModel: "Register model",
  allocateToTenant: "Allocate",
  revokeFromTenant: "Revoke",
  modelSource: "Source service",
  modelSecret: "Secret",
  modelSecretStored: "Stored on the server",
  modelSecretMissing: "Not configured",
  allocatedTo: "Allocated tenants",
  allocatedModels: "Allocated models",
  noneAllocated: "None allocated",
  tableActions: "Actions",
  modelSourceCompatible: "OpenAI-compatible service",
  modelSourceLocal: "Local or private service",
  modelConversationDefault: "Conversation default",
  modelLocalName: "Local private model",
  modelResearchName: "Research model",
  workspaceModelsIntro:
    "System administration allocated these models to this workspace. You cannot connect a new service or enter a secret here; you may only assign them to this workspace’s AI members.",
  workspaceIntegrationsTitle: "Other integrations",
  assignToAgent: "Assign to AI",
  agentAssignedModel: "Model in use",
  workspaceModelAllocated: "Allocated",
  listSeparator: ", ",
  tenantName: "Tenant",
  tenantStatus: "Status",
  tenantPlan: "Plan",
  healthService: "Service",
  healthState: "State",
  tenantBeichen: "Beichen Product",
  tenantAurora: "Aurora Labs",
  tenantPlanPilot: "Pilot",
};

export const adminDictionaries: Record<Locale, AdminDictionary> = {
  "zh-CN": zhCN,
  "en-US": enUS,
};
