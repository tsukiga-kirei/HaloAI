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
  switchWorkspace: string;
  emptyWorkspaceList: string;
  switchRolePreview: string;
  collapseSidebar: string;
  expandSidebar: string;
  signOut: string;
  roleMember: string;
  roleWorkspaceAdmin: string;
  roleSystemAdmin: string;
  switchedToRole: string;
  navLabel: string;
  navGroupSpace: string;
  navGroupPeople: string;
  navGroupGovernance: string;
  navOverview: string;
  navAnnouncements: string;
  navMembers: string;
  navAgents: string;
  navIntegrations: string;
  navSecurity: string;
  navAudit: string;
  navRoles: string;
  createAnnouncement: string;
  createAnnouncementDrawerTitle: string;
  createAnnouncementDrawerDesc: string;
  announcementTitle: string;
  announcementContent: string;
  announcementLevel: string;
  announcementActive: string;
  announcementCreatedAt: string;
  announcementStartsAt: string;
  announcementExpiresAt: string;
  announcementTitlePlaceholder: string;
  announcementContentPlaceholder: string;
  announcementSearchPlaceholder: string;
  announcementLevelInfo: string;
  announcementLevelWarning: string;
  announcementLevelCritical: string;
  announcementCreated: string;
  announcementDeleted: string;
  deleteAnnouncementConfirmTitle: string;
  deleteAnnouncementConfirmDesc: string;
  announcementsLoadError: string;
  announcementSaveError: string;
  announcementDeleteError: string;
  noAnnouncements: string;
  noAnnouncementsDesc: string;
  reload: string;
  delete: string;
  overviewTitle: string;
  membersTitle: string;
  rolesTitle: string;
  rolesDescription: string;
  agentsTitle: string;
  integrationsTitle: string;
  securityTitle: string;
  auditTitle: string;
  createRole: string;
  editRole: string;
  deleteRole: string;
  roleKey: string;
  roleName: string;
  roleDescription: string;
  roleCapabilities: string;
  roleBuiltIn: string;
  roleCustom: string;
  roleCreated: string;
  roleUpdated: string;
  roleDeleted: string;
  assignRoles: string;
  rolesSaved: string;
  capCategoryWorkspace: string;
  capCategoryMember: string;
  capCategoryAgent: string;
  capCategoryRoom: string;
  capCategoryDocument: string;
  capCategoryIntegration: string;
  capCategorySecurity: string;
  roleCapabilitiesCount: string;
  roleType: string;
  roleSearchPlaceholder: string;
  roleKeyPlaceholder: string;
  roleNamePlaceholder: string;
  roleDescPlaceholder: string;
  roleDrawerDescription: string;
  roleCapsRequired: string;
  selectAll: string;
  deselectAll: string;
  saveRole: string;
  deleteRoleConfirmTitle: string;
  deleteRoleConfirmDesc: string;
  irreversibleAction: string;
  confirmDelete: string;
  customRoles: string;
  actions: string;
  roleLoadError: string;
  roleSaveError: string;
  roleDeleteError: string;
  // 细粒度权限能力字典
  capWorkspaceReadName: string;
  capWorkspaceReadDesc: string;
  capWorkspaceManageName: string;
  capWorkspaceManageDesc: string;
  capWorkspaceSecurityManageName: string;
  capWorkspaceSecurityManageDesc: string;
  capMemberInviteName: string;
  capMemberInviteDesc: string;
  capMemberManageName: string;
  capMemberManageDesc: string;
  capAgentProfileReadName: string;
  capAgentProfileReadDesc: string;
  capAgentProfileCreateName: string;
  capAgentProfileCreateDesc: string;
  capAgentProfilePublishName: string;
  capAgentProfilePublishDesc: string;
  capAgentInvokeName: string;
  capAgentInvokeDesc: string;
  capRoomReadName: string;
  capRoomReadDesc: string;
  capRoomManageName: string;
  capRoomManageDesc: string;
  capRoomMessageCreateName: string;
  capRoomMessageCreateDesc: string;
  capDocumentReadName: string;
  capDocumentReadDesc: string;
  capDocumentEditName: string;
  capDocumentEditDesc: string;
  capDocumentProposalCreateName: string;
  capDocumentProposalCreateDesc: string;
  capDocumentProposalReviewName: string;
  capDocumentProposalReviewDesc: string;
  capDocumentPublishName: string;
  capDocumentPublishDesc: string;
  capIntegrationToolReadExecuteName: string;
  capIntegrationToolReadExecuteDesc: string;
  capIntegrationToolWriteExecuteName: string;
  capIntegrationToolWriteExecuteDesc: string;
  capApprovalRequestName: string;
  capApprovalRequestDesc: string;
  capApprovalReviewName: string;
  capApprovalReviewDesc: string;
  capAuditReadName: string;
  capAuditReadDesc: string;
  inviteMember: string;
  createAgent: string;
  configure: string;
  exportAudit: string;
  activeMembers: string;
  aiCollaborators: string;
  departments: string;
  monthlyRuns: string;
  pendingApprovals: string;
  comparedToLastMonth: string;
  availableNow: string;
  requiresReview: string;
  governanceHealth: string;
  identityStatus: string;
  aiPolicyStatus: string;
  retentionStatus: string;
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
  navGroupPlatform: string;
  navGroupCatalog: string;
  navGroupOperations: string;
  navTenants: string;
  navModels: string;
  navHealth: string;
  navPolicy: string;
  navSettings: string;
  systemOverviewTitle: string;
  systemTenantsTitle: string;
  systemModelsTitle: string;
  systemHealthTitle: string;
  systemPolicyTitle: string;
  systemSettingsTitle: string;
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
  emptyAdminActivity: string;
  emptyAuditLog: string;
  emptyAgentDirectory: string;
  emptyModelCatalog: string;
  emptyTenantDirectory: string;
  emptyAllocation: string;
  metricUnavailable: string;
  notAssigned: string;
  apiReady: string;
  apiUnavailable: string;
  auditSearchPlaceholder: string;
  auditAllOutcomes: string;
  auditOutcomeSucceeded: string;
  auditOutcomeFailed: string;
  auditOutcomeDenied: string;
  auditOutcomeCancelled: string;
  auditLoadError: string;
  auditExported: string;
  auditDetailTitle: string;
  auditDecision: string;
  auditReason: string;
  auditResource: string;
  auditEmptyDescription: string;
  auditLoading: string;
  auditPreviousPage: string;
  auditNextPage: string;
  pageSummary: string;
  pageSize: string;
  modelsLoading: string;
  securityReadOnly: string;
  securitySessionLifetime: string;
  securityRenewalInterval: string;
  securitySlidingOn: string;
  securitySlidingOff: string;
  durationDay: string;
  durationDays: string;
  durationHour: string;
  durationHours: string;
  modelContextWindow: string;
  modelProtocol: string;
  modelUnallocatedDescription: string;
  agentHandle: string;
  agentReadOnly: string;
  createAgentPending: string;
  accountAndSecurity: string;
  accountDescription: string;
  accountTabProfile: string;
  accountTabSecurity: string;
  accountTabSession: string;
  accountEmail: string;
  accountDisplayName: string;
  accountLanguage: string;
  accountTimeZone: string;
  accountWorkspace: string;
  accountRole: string;
  accountSessionProtected: string;
  accountSaved: string;
  accountSaveError: string;
  accountNameRequired: string;
  accountSave: string;
  accountCurrentPassword: string;
  accountNewPassword: string;
  accountConfirmPassword: string;
  accountPasswordLengthHint: string;
  accountPasswordMismatch: string;
  accountPasswordChanged: string;
  accountPasswordChangeError: string;
  accountCurrentPasswordRequired: string;
  accountNewPasswordRequired: string;
  accountChangePasswordButton: string;
  statusSuspended: string;
  statusLeft: string;
  suspendMember: string;
  restoreMember: string;
  memberStatusUpdated: string;
  save: string;
  cancel: string;
  accessOwner: string;
  accessAdmin: string;
  accessMember: string;
  accessGuest: string;
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
  switchWorkspace: "切换工作区",
  emptyWorkspaceList: "还没有可切换的工作区",
  switchRolePreview: "角色切换将在认证接入后开放。",
  collapseSidebar: "收起侧栏",
  expandSidebar: "展开侧栏",
  signOut: "退出登录",
  roleMember: "协作成员",
  roleWorkspaceAdmin: "空间管理",
  roleSystemAdmin: "系统管理",
  switchedToRole: "已切换到{role}",
  navLabel: "后台配置导航",
  navGroupSpace: "空间",
  navGroupPeople: "人员",
  navGroupGovernance: "治理",
  navOverview: "总览",
  navAnnouncements: "空间公告",
  navMembers: "组织与成员",
  navAgents: "AI 协作者",
  navIntegrations: "可用模型",
  navSecurity: "安全策略",
  navAudit: "审计记录",
  navRoles: "自定义角色",
  createAnnouncement: "发布空间公告",
  createAnnouncementDrawerTitle: "发布空间协同公告",
  createAnnouncementDrawerDesc: "向本工作空间全体成员发布置顶横幅公告或维护提醒。",
  announcementTitle: "公告标题",
  announcementContent: "公告正文",
  announcementLevel: "重要级别",
  announcementActive: "立即启用该公告",
  announcementCreatedAt: "发布时间",
  announcementStartsAt: "生效时间",
  announcementExpiresAt: "过期时间",
  announcementTitlePlaceholder: "例如：全员协同规范更新通知",
  announcementContentPlaceholder: "请输入详细的公告内容...",
  announcementSearchPlaceholder: "搜索公告标题或内容...",
  announcementLevelInfo: "普通通知",
  announcementLevelWarning: "重要提醒",
  announcementLevelCritical: "紧急通知",
  announcementCreated: "空间公告已发布",
  announcementDeleted: "空间公告已删除",
  deleteAnnouncementConfirmTitle: "确认删除该空间公告？",
  deleteAnnouncementConfirmDesc: "删除后该公告将立即对空间成员隐藏，不可撤销。",
  announcementsLoadError: "无法读取空间公告列表，请确认你拥有空间管理权限。",
  announcementSaveError: "保存空间公告失败，请检查网络或参数。",
  announcementDeleteError: "删除空间公告失败，请稍后重试。",
  noAnnouncements: "暂无空间公告",
  noAnnouncementsDesc: "点击右上角「发布空间公告」即可向全体空间成员广播通知。",
  reload: "刷新",
  delete: "删除",
  overviewTitle: "工作空间总览",
  membersTitle: "成员与访问角色",
  rolesTitle: "自定义角色与权限能力",
  rolesDescription: "配置团队自定义角色与 21 项细粒度权限能力矩阵。",
  agentsTitle: "AI 协作者",
  integrationsTitle: "本空间可用模型",
  securityTitle: "安全策略",
  auditTitle: "审计记录",
  createRole: "创建自定义角色",
  editRole: "编辑角色",
  deleteRole: "删除角色",
  roleKey: "角色唯一标识",
  roleName: "角色名称",
  roleDescription: "角色描述",
  roleCapabilities: "权限能力矩阵",
  roleBuiltIn: "系统内置",
  roleCustom: "自定义",
  roleCreated: "自定义角色已创建",
  roleUpdated: "角色配置已更新",
  roleDeleted: "角色已删除",
  assignRoles: "配置角色",
  rolesSaved: "成员角色已保存",
  capCategoryWorkspace: "工作空间治理",
  capCategoryMember: "成员与组织",
  capCategoryAgent: "AI 与 Agent",
  capCategoryRoom: "房间与会话",
  capCategoryDocument: "文档与发布",
  capCategoryIntegration: "工具与集成",
  capCategorySecurity: "安全审计与审批",
  roleCapabilitiesCount: "{count} 项权限能力",
  roleType: "类型",
  roleSearchPlaceholder: "搜索角色名称、唯一标识或描述…",
  roleKeyPlaceholder: "例如：tech_lead",
  roleNamePlaceholder: "例如：技术负责人",
  roleDescPlaceholder: "简要说明该角色的业务定位与职责…",
  roleDrawerDescription: "配置角色名称、唯一标识并勾选所需权限能力。",
  roleCapsRequired: "请至少选择一项权限能力",
  selectAll: "全选",
  deselectAll: "全不选",
  saveRole: "保存角色",
  deleteRoleConfirmTitle: "确认删除自定义角色",
  deleteRoleConfirmDesc: "确定要删除自定义角色「{name}」吗？删除后已分配该角色的成员将自动解绑。",
  irreversibleAction: "此操作无法撤销。",
  confirmDelete: "确认删除",
  customRoles: "自定义角色",
  actions: "操作",
  roleLoadError: "无法读取角色列表，请确认你拥有管理权限。",
  roleSaveError: "保存角色失败，请检查配置或稍后重试。",
  roleDeleteError: "删除角色失败，请稍后重试。",
  capWorkspaceReadName: "读取工作空间",
  capWorkspaceReadDesc: "查看工作空间基本信息、成员概况与可用功能。",
  capWorkspaceManageName: "管理工作空间",
  capWorkspaceManageDesc: "管理工作空间基本设置、组织架构与角色配置。",
  capWorkspaceSecurityManageName: "安全策略管理",
  capWorkspaceSecurityManageDesc: "管理会话安全策略、访问控制与敏感参数。",
  capMemberInviteName: "邀请成员",
  capMemberInviteDesc: "发起新成员加入工作空间邀请。",
  capMemberManageName: "成员管理",
  capMemberManageDesc: "调整成员角色、部门分配及启用/停用状态。",
  capAgentProfileReadName: "读取 AI 档案",
  capAgentProfileReadDesc: "查看 AI 成员配置、人设与授权范围。",
  capAgentProfileCreateName: "创建 AI 档案",
  capAgentProfileCreateDesc: "新建或编辑 AI 协作者配置。",
  capAgentProfilePublishName: "发布 AI 档案",
  capAgentProfilePublishDesc: "发布 AI 协作者至空间供团队使用。",
  capAgentInvokeName: "调用 AI 运行",
  capAgentInvokeDesc: "在房间或任务中唤起 AI 协作者执行任务。",
  capRoomReadName: "访问房间",
  capRoomReadDesc: "查看协作房间讨论与会话记录。",
  capRoomManageName: "管理房间",
  capRoomManageDesc: "创建、修改或归档协作房间。",
  capRoomMessageCreateName: "发送消息",
  capRoomMessageCreateDesc: "在房间中发表讨论与消息。",
  capDocumentReadName: "阅读文档",
  capDocumentReadDesc: "查看协同文档与知识库内容。",
  capDocumentEditName: "编辑文档",
  capDocumentEditDesc: "协同编辑文档正文内容。",
  capDocumentProposalCreateName: "发起修改提案",
  capDocumentProposalCreateDesc: "对受保护文档提交变更提案。",
  capDocumentProposalReviewName: "审查合并提案",
  capDocumentProposalReviewDesc: "审查他人提交的文档提案并执行合并。",
  capDocumentPublishName: "发布导出文档",
  capDocumentPublishDesc: "将文档公开发布或导出至外部。",
  capIntegrationToolReadExecuteName: "只读工具调用",
  capIntegrationToolReadExecuteDesc: "执行数据查询、检索等只读集成工具。",
  capIntegrationToolWriteExecuteName: "写入工具调用",
  capIntegrationToolWriteExecuteDesc: "执行数据变更、外部 API 调用等有副作用工具。",
  capApprovalRequestName: "提交审批申请",
  capApprovalRequestDesc: "对高风险或敏感操作发起审批流程。",
  capApprovalReviewName: "审批操作执行",
  capApprovalReviewDesc: "审查并批准高风险操作（仅限人类操作）。",
  capAuditReadName: "查看审计流水",
  capAuditReadDesc: "查看工作空间全局不可篡改审计流水。",
  inviteMember: "邀请成员",
  createAgent: "创建 AI 协作者",
  configure: "查看配置",
  exportAudit: "导出审计记录",
  activeMembers: "活跃成员",
  aiCollaborators: "已发布 AI",
  departments: "组织部门",
  monthlyRuns: "本月 AI 运行",
  pendingApprovals: "待处理审批",
  comparedToLastMonth: "较上月 +12%",
  availableNow: "运行正常",
  requiresReview: "需要负责人处理",
  governanceHealth: "治理状态",
  identityStatus: "成员身份",
  aiPolicyStatus: "AI 发布策略",
  retentionStatus: "保留与删除",
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
  accessDeniedDescription: "当前会话没有进入该分区所需的管理能力。",
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
  navGroupPlatform: "平台",
  navGroupCatalog: "目录",
  navGroupOperations: "运行",
  navTenants: "租户",
  navModels: "模型",
  navHealth: "健康",
  navPolicy: "策略",
  navSettings: "系统设置",
  systemOverviewTitle: "平台总览",
  systemTenantsTitle: "租户目录",
  systemModelsTitle: "平台模型",
  systemHealthTitle: "平台健康",
  systemPolicyTitle: "全局策略",
  systemSettingsTitle: "系统设置",
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
  workspaceModelsIntro:
    "这些模型由系统管理分配给本空间。不能在此接入新服务或填写密钥，只能配给本空间的 AI。",
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
  emptyAdminActivity: "暂时没有可展示的管理动态。",
  emptyAuditLog: "暂时没有可展示的审计事件。",
  emptyAgentDirectory: "这个工作空间还没有 AI 协作者。",
  emptyModelCatalog: "平台尚未登记可用模型。",
  emptyTenantDirectory: "平台尚未登记租户。",
  emptyAllocation: "还没有把模型分配给租户。",
  metricUnavailable: "运行账本接入后才会累计",
  notAssigned: "未分配",
  apiReady: "可用",
  apiUnavailable: "不可用",
  auditSearchPlaceholder: "搜索动作、对象或执行人",
  auditAllOutcomes: "全部结果",
  auditOutcomeSucceeded: "成功",
  auditOutcomeFailed: "失败",
  auditOutcomeDenied: "拒绝",
  auditOutcomeCancelled: "取消",
  auditLoadError: "无法读取审计记录，请确认你拥有审计权限。",
  auditExported: "已导出当前筛选的审计记录。",
  auditDetailTitle: "审计详情",
  auditDecision: "策略决定",
  auditReason: "原因码",
  auditResource: "对象",
  auditEmptyDescription: "成员邀请、角色变更和组织调整会在成功写入后出现在这里。",
  auditLoading: "正在读取审计记录…",
  auditPreviousPage: "上一页",
  auditNextPage: "下一页",
  pageSummary: "第 {page} / {pages} 页，共 {total} 条",
  pageSize: "每页 {size} 条",
  modelsLoading: "正在读取本空间已分配的模型…",
  securityReadOnly: "这些边界由平台强制执行，空间管理不能在此关闭。",
  securitySessionLifetime: "登录有效期 {value}",
  securityRenewalInterval: "续期间隔 {value}",
  securitySlidingOn: "滑动续期已开启",
  securitySlidingOff: "滑动续期已关闭",
  durationDay: "天",
  durationDays: "天",
  durationHour: "小时",
  durationHours: "小时",
  modelContextWindow: "上下文 {value}",
  modelProtocol: "协议",
  modelUnallocatedDescription: "系统管理尚未把模型分配给本空间。空间不能自行接入供应商或填写密钥。",
  agentHandle: "标识",
  agentReadOnly: "模型与工具范围由已发布版本决定；创建向导将在 Agent 发布链路接入后开放。",
  createAgentPending: "创建 AI 协作者将在 Agent 发布链路接入后开放。",
  accountAndSecurity: "账户与安全",
  accountDescription: "更新个人资料与安全设置。邮箱与当前会话身份只读。",
  accountTabProfile: "个人资料",
  accountTabSecurity: "安全与密码",
  accountTabSession: "会话",
  accountEmail: "登录邮箱",
  accountDisplayName: "显示名称",
  accountLanguage: "界面语言",
  accountTimeZone: "时区",
  accountWorkspace: "当前工作区",
  accountRole: "当前访问角色",
  accountSessionProtected: "会话使用 HttpOnly Cookie，退出登录后立即失效，不会保存在浏览器存储里。",
  accountSaved: "个人资料已保存。",
  accountSaveError: "无法保存个人资料，请稍后重试。",
  accountNameRequired: "请输入显示名称。",
  accountSave: "保存",
  accountCurrentPassword: "当前密码",
  accountNewPassword: "新密码",
  accountConfirmPassword: "确认新密码",
  accountPasswordLengthHint: "密码至少包含 10 个字符",
  accountPasswordMismatch: "两次输入的新密码不一致",
  accountPasswordChanged: "密码已成功修改",
  accountPasswordChangeError: "密码修改失败，请检查当前密码是否正确",
  accountCurrentPasswordRequired: "请输入当前密码",
  accountNewPasswordRequired: "请输入新密码",
  accountChangePasswordButton: "更新密码",
  statusSuspended: "已停用",
  statusLeft: "已离开",
  suspendMember: "停用成员",
  restoreMember: "恢复成员",
  memberStatusUpdated: "成员状态已更新。",
  save: "保存",
  cancel: "取消",
  accessOwner: "所有者",
  accessAdmin: "管理员",
  accessMember: "成员",
  accessGuest: "访客",
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
  switchWorkspace: "Switch workspace",
  emptyWorkspaceList: "No workspaces to switch yet",
  switchRolePreview: "Role switching opens after authentication is connected.",
  collapseSidebar: "Collapse sidebar",
  expandSidebar: "Expand sidebar",
  signOut: "Sign out",
  roleMember: "Collaborator",
  roleWorkspaceAdmin: "Workspace admin",
  roleSystemAdmin: "System admin",
  switchedToRole: "Switched to {role}",
  navLabel: "Administration navigation",
  navGroupSpace: "Space",
  navGroupPeople: "People",
  navGroupGovernance: "Governance",
  navOverview: "Overview",
  navAnnouncements: "Announcements",
  navMembers: "Organization",
  navAgents: "AI collaborators",
  navIntegrations: "Available models",
  navSecurity: "Security policy",
  navAudit: "Audit log",
  navRoles: "Custom Roles",
  createAnnouncement: "Post Announcement",
  createAnnouncementDrawerTitle: "Post Workspace Announcement",
  createAnnouncementDrawerDesc:
    "Broadcast a banner announcement or maintenance notice to all workspace members.",
  announcementTitle: "Title",
  announcementContent: "Content",
  announcementLevel: "Severity Level",
  announcementActive: "Enable immediately",
  announcementCreatedAt: "Posted At",
  announcementStartsAt: "Starts At",
  announcementExpiresAt: "Expires At",
  announcementTitlePlaceholder: "e.g. Workspace Collaboration Guidelines Update",
  announcementContentPlaceholder: "Enter detailed announcement message...",
  announcementSearchPlaceholder: "Search announcement title or content...",
  announcementLevelInfo: "Info",
  announcementLevelWarning: "Warning",
  announcementLevelCritical: "Critical",
  announcementCreated: "Workspace announcement published",
  announcementDeleted: "Workspace announcement deleted",
  deleteAnnouncementConfirmTitle: "Delete this announcement?",
  deleteAnnouncementConfirmDesc:
    "This announcement will be hidden from all workspace members immediately.",
  announcementsLoadError:
    "Unable to load announcements. Please verify workspace management permissions.",
  announcementSaveError: "Failed to save announcement. Please check input parameters.",
  announcementDeleteError: "Failed to delete announcement. Please try again later.",
  noAnnouncements: "No announcements yet",
  noAnnouncementsDesc:
    "Click 'Post Announcement' in the top right to broadcast notices to your workspace members.",
  reload: "Reload",
  delete: "Delete",
  overviewTitle: "Workspace overview",
  membersTitle: "Members and access roles",
  rolesTitle: "Custom Roles and Capabilities",
  rolesDescription: "Configure workspace roles and 21 granular capability permissions.",
  agentsTitle: "AI collaborators",
  integrationsTitle: "Models available here",
  securityTitle: "Security policy",
  auditTitle: "Audit log",
  createRole: "Create Custom Role",
  editRole: "Edit Role",
  deleteRole: "Delete Role",
  roleKey: "Role key",
  roleName: "Role name",
  roleDescription: "Role description",
  roleCapabilities: "Capability Matrix",
  roleBuiltIn: "Built-in",
  roleCustom: "Custom",
  roleCreated: "Custom role created",
  roleUpdated: "Custom role updated",
  roleDeleted: "Custom role deleted",
  assignRoles: "Assign roles",
  rolesSaved: "Member roles saved",
  capCategoryWorkspace: "Workspace Governance",
  capCategoryMember: "Members & Organization",
  capCategoryAgent: "AI & Agents",
  capCategoryRoom: "Rooms & Collaboration",
  capCategoryDocument: "Documents & Publishing",
  capCategoryIntegration: "Tools & Integrations",
  capCategorySecurity: "Security & Audit",
  roleCapabilitiesCount: "{count} capabilities",
  roleType: "Type",
  roleSearchPlaceholder: "Search by role name, key, or description…",
  roleKeyPlaceholder: "e.g., tech_lead",
  roleNamePlaceholder: "e.g., Tech Lead",
  roleDescPlaceholder: "Brief description of role responsibilities…",
  roleDrawerDescription: "Configure role name, key, and capability permissions.",
  roleCapsRequired: "Please select at least one capability",
  selectAll: "Select all",
  deselectAll: "Deselect all",
  saveRole: "Save Role",
  deleteRoleConfirmTitle: "Confirm Delete Custom Role",
  deleteRoleConfirmDesc:
    'Are you sure you want to delete custom role "{name}"? Members assigned this role will be unbound.',
  irreversibleAction: "This action cannot be undone.",
  confirmDelete: "Confirm Delete",
  customRoles: "Custom Roles",
  actions: "Actions",
  roleLoadError: "Could not load roles. Check that you have management access.",
  roleSaveError: "Failed to save role. Check configuration and try again.",
  roleDeleteError: "Failed to delete role. Please try again later.",
  capWorkspaceReadName: "Read Workspace",
  capWorkspaceReadDesc: "View basic workspace information, members, and available capabilities.",
  capWorkspaceManageName: "Manage Workspace",
  capWorkspaceManageDesc: "Manage workspace settings, organizational structure, and roles.",
  capWorkspaceSecurityManageName: "Manage Security Policy",
  capWorkspaceSecurityManageDesc:
    "Manage session security policies, access controls, and sensitive parameters.",
  capMemberInviteName: "Invite Members",
  capMemberInviteDesc: "Invite new members to join the workspace.",
  capMemberManageName: "Manage Members",
  capMemberManageDesc: "Adjust member roles, departments, and activation status.",
  capAgentProfileReadName: "Read AI Profiles",
  capAgentProfileReadDesc:
    "View AI collaborator configurations, personas, and authorization bounds.",
  capAgentProfileCreateName: "Create AI Profiles",
  capAgentProfileCreateDesc: "Create or edit AI collaborator configurations.",
  capAgentProfilePublishName: "Publish AI Profiles",
  capAgentProfilePublishDesc: "Publish AI collaborators to the workspace catalog.",
  capAgentInvokeName: "Invoke AI Agents",
  capAgentInvokeDesc: "Invoke AI collaborators to run tasks in rooms or workflows.",
  capRoomReadName: "Access Rooms",
  capRoomReadDesc: "View room discussions and collaboration history.",
  capRoomManageName: "Manage Rooms",
  capRoomManageDesc: "Create, modify, or archive collaboration rooms.",
  capRoomMessageCreateName: "Send Messages",
  capRoomMessageCreateDesc: "Post messages and discussions in collaboration rooms.",
  capDocumentReadName: "Read Documents",
  capDocumentReadDesc: "View collaborative documents and knowledge base content.",
  capDocumentEditName: "Edit Documents",
  capDocumentEditDesc: "Collaboratively edit document body content.",
  capDocumentProposalCreateName: "Create Proposals",
  capDocumentProposalCreateDesc: "Submit change proposals for protected documents.",
  capDocumentProposalReviewName: "Review & Merge Proposals",
  capDocumentProposalReviewDesc: "Review and merge document change proposals.",
  capDocumentPublishName: "Publish & Export Documents",
  capDocumentPublishDesc: "Publish documents publicly or export to external formats.",
  capIntegrationToolReadExecuteName: "Execute Read Tools",
  capIntegrationToolReadExecuteDesc: "Execute read-only queries and information retrieval tools.",
  capIntegrationToolWriteExecuteName: "Execute Write Tools",
  capIntegrationToolWriteExecuteDesc: "Execute state-changing tools and external API mutations.",
  capApprovalRequestName: "Request Approvals",
  capApprovalRequestDesc: "Submit approval requests for high-risk or sensitive actions.",
  capApprovalReviewName: "Review Approvals",
  capApprovalReviewDesc: "Review and approve high-risk operations (human-only).",
  capAuditReadName: "Read Audit Log",
  capAuditReadDesc: "View immutable workspace-wide audit logs.",
  inviteMember: "Invite member",
  createAgent: "Create AI collaborator",
  configure: "View configuration",
  exportAudit: "Export audit log",
  activeMembers: "Active members",
  aiCollaborators: "Published AI",
  departments: "Departments",
  monthlyRuns: "AI runs this month",
  pendingApprovals: "Pending approvals",
  comparedToLastMonth: "+12% from last month",
  availableNow: "Operating normally",
  requiresReview: "Owner action required",
  governanceHealth: "Governance health",
  identityStatus: "Member identity",
  aiPolicyStatus: "AI publishing policy",
  retentionStatus: "Retention and deletion",
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
  integrationStorageDetail:
    "Provided by the platform; this workspace cannot connect its own store.",
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
  accessDeniedDescription: "The current session lacks the capability required for this section.",
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
  navGroupPlatform: "Platform",
  navGroupCatalog: "Catalog",
  navGroupOperations: "Operations",
  navTenants: "Tenants",
  navModels: "Models",
  navHealth: "Health",
  navPolicy: "Policy",
  navSettings: "Settings",
  systemOverviewTitle: "Platform overview",
  systemTenantsTitle: "Tenant directory",
  systemModelsTitle: "Platform models",
  systemHealthTitle: "Platform health",
  systemPolicyTitle: "Global policy",
  systemSettingsTitle: "System settings",
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
  emptyAdminActivity: "No administration activity to show yet.",
  emptyAuditLog: "No audit events to show yet.",
  emptyAgentDirectory: "This workspace has no AI collaborators yet.",
  emptyModelCatalog: "No platform models are registered yet.",
  emptyTenantDirectory: "No tenants are registered yet.",
  emptyAllocation: "No models have been allocated to tenants.",
  metricUnavailable: "Totals appear after the usage ledger is connected",
  notAssigned: "Not assigned",
  apiReady: "Ready",
  apiUnavailable: "Unavailable",
  auditSearchPlaceholder: "Search action, object, or actor",
  auditAllOutcomes: "All outcomes",
  auditOutcomeSucceeded: "Succeeded",
  auditOutcomeFailed: "Failed",
  auditOutcomeDenied: "Denied",
  auditOutcomeCancelled: "Cancelled",
  auditLoadError: "Could not load the audit log. Check that you have audit access.",
  auditExported: "Exported the current audit filter.",
  auditDetailTitle: "Audit detail",
  auditDecision: "Policy decision",
  auditReason: "Reason code",
  auditResource: "Resource",
  auditEmptyDescription:
    "Member invites, role changes, and organization updates appear here after they are written.",
  auditLoading: "Loading the audit log…",
  auditPreviousPage: "Previous page",
  auditNextPage: "Next page",
  pageSummary: "Page {page} of {pages} · {total} items",
  pageSize: "{size} per page",
  modelsLoading: "Loading models allocated to this workspace…",
  securityReadOnly: "These boundaries are enforced by the platform and cannot be turned off here.",
  securitySessionLifetime: "Sign-in lifetime {value}",
  securityRenewalInterval: "Renewal interval {value}",
  securitySlidingOn: "Sliding renewal is on",
  securitySlidingOff: "Sliding renewal is off",
  durationDay: "day",
  durationDays: "days",
  durationHour: "hour",
  durationHours: "hours",
  modelContextWindow: "Context {value}",
  modelProtocol: "Protocol",
  modelUnallocatedDescription:
    "System administration has not allocated models to this workspace. You cannot connect a provider or enter a secret here.",
  agentHandle: "Handle",
  agentReadOnly:
    "Model and tool scope come from the published version. The create wizard opens after the agent publishing path is connected.",
  createAgentPending:
    "Creating AI collaborators opens after the agent publishing path is connected.",
  accountAndSecurity: "Account and security",
  accountDescription:
    "Update your profile and security settings. Email and session identity stay read-only.",
  accountTabProfile: "Profile",
  accountTabSecurity: "Security",
  accountTabSession: "Session",
  accountEmail: "Sign-in email",
  accountDisplayName: "Display name",
  accountLanguage: "Language",
  accountTimeZone: "Time zone",
  accountWorkspace: "Current workspace",
  accountRole: "Current access role",
  accountSessionProtected:
    "The session uses an HttpOnly cookie. It is revoked on sign-out and is never stored in browser storage.",
  accountSaved: "Profile saved.",
  accountSaveError: "Could not save profile settings. Try again shortly.",
  accountNameRequired: "Enter a display name.",
  accountSave: "Save",
  accountCurrentPassword: "Current password",
  accountNewPassword: "New password",
  accountConfirmPassword: "Confirm new password",
  accountPasswordLengthHint: "Password must be at least 10 characters",
  accountPasswordMismatch: "New passwords do not match",
  accountPasswordChanged: "Password changed successfully",
  accountPasswordChangeError: "Failed to change password. Please verify your current password.",
  accountCurrentPasswordRequired: "Current password is required",
  accountNewPasswordRequired: "New password is required",
  accountChangePasswordButton: "Update password",
  statusSuspended: "Suspended",
  statusLeft: "Left",
  suspendMember: "Suspend member",
  restoreMember: "Restore member",
  memberStatusUpdated: "Member status updated.",
  save: "Save",
  cancel: "Cancel",
  accessOwner: "Owner",
  accessAdmin: "Admin",
  accessMember: "Member",
  accessGuest: "Guest",
};

export const adminDictionaries: Record<Locale, AdminDictionary> = {
  "zh-CN": zhCN,
  "en-US": enUS,
};
