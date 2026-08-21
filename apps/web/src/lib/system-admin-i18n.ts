import type { PlatformModelApiFormat } from "@haloai/contracts";
import type { Locale } from "./i18n";

export interface SystemAdminDictionary {
  overviewTitle: string;
  tenantsTitle: string;
  modelsTitle: string;
  healthTitle: string;
  settingsTitle: string;
  totalTenants: string;
  activeTenants: string;
  totalModels: string;
  activeModels: string;
  enabledDetail: string;
  recentTenants: string;
  recentModels: string;
  serviceStatus: string;
  viewAll: string;
  loading: string;
  loadError: string;
  retry: string;
  emptyTenants: string;
  emptyModels: string;
  search: string;
  searchTenants: string;
  searchModels: string;
  clearSearch: string;
  name: string;
  slug: string;
  status: string;
  members: string;
  membersCount: string;
  locale: string;
  timeZone: string;
  createdAt: string;
  configure: string;
  viewMembers: string;
  active: string;
  suspended: string;
  archived: string;
  disabled: string;
  previousPage: string;
  nextPage: string;
  pageSummary: string;
  pageSize: string;
  editTenant: string;
  createTenant: string;
  createTenantDescription: string;
  defaultAdministrator: string;
  administratorEmail: string;
  departmentsCount: string;
  tenantCreated: string;
  tenantActivationCreated: string;
  administratorEmailHint: string;
  activationLink: string;
  copyActivationLink: string;
  tenantMembersTitle: string;
  searchTenantMembers: string;
  emptyTenantMembers: string;
  accessRole: string;
  department: string;
  jobTitle: string;
  joinedAt: string;
  owner: string;
  admin: string;
  member: string;
  guest: string;
  invited: string;
  left: string;
  save: string;
  cancel: string;
  saved: string;
  registerModel: string;
  editModel: string;
  provider: string;
  apiFormat: string;
  remoteModelId: string;
  baseUrl: string;
  contextWindow: string;
  apiKey: string;
  apiKeyPlaceholder: string;
  secretConfigured: string;
  secretMissing: string;
  allocatedTenants: string;
  allocatedCount: string;
  allocationTitle: string;
  noAllocation: string;
  modelSaved: string;
  modelCreated: string;
  close: string;
  apiReady: string;
  apiUnavailable: string;
  apiService: string;
  platformDirectory: string;
  operatingNormally: string;
  unavailable: string;
  generalTab: string;
  authenticationTab: string;
  defaultLocale: string;
  defaultLocaleHint: string;
  sessionMode: string;
  databaseSession: string;
  cookieLifetime: string;
  cookieLifetimeHint: string;
  renewalInterval: string;
  renewalIntervalHint: string;
  slidingRenewal: string;
  slidingRenewalHint: string;
  enabled: string;
  lifetime1Day: string;
  lifetime7Days: string;
  lifetime14Days: string;
  lifetime30Days: string;
  renewal1Hour: string;
  renewal6Hours: string;
  renewal12Hours: string;
  renewal1Day: string;
  settingsSaved: string;
  simplifiedChinese: string;
  english: string;
  formatLabels: Record<PlatformModelApiFormat, string>;
  administratorsTitle: string;
  administratorsTab: string;
  addAdministrator: string;
  administratorAdded: string;
  administratorStatusUpdated: string;
  adminEmail: string;
  adminName: string;
  adminStatus: string;
  adminActions: string;
  suspendAdmin: string;
  restoreAdmin: string;
  tenantQuota: string;
  tenantQuotaTitle: string;
  maxMembers: string;
  maxStorage: string;
  maxMonthlyBudget: string;
  quotaSaved: string;
  detailedHealthTitle: string;
  databaseStatus: string;
  dbLatency: string;
  connectionPool: string;
  redisStatus: string;
  redisLatency: string;
  workerStatus: string;
  activeJobs: string;
  storageStatus: string;
  storageWritable: string;
  healthy: string;
  degraded: string;
  unhealthy: string;
  announcementsTitle: string;
  announcementsTab: string;
  createAnnouncement: string;
  announcementTitle: string;
  announcementContent: string;
  announcementLevel: string;
  announcementActive: string;
  announcementCreated: string;
  announcementDeleted: string;
  deleteAnnouncement: string;
  levelInfo: string;
  levelWarning: string;
  levelCritical: string;
}

const zhCN: SystemAdminDictionary = {
  overviewTitle: "平台总览",
  tenantsTitle: "租户管理",
  modelsTitle: "模型管理",
  healthTitle: "平台健康",
  settingsTitle: "系统设置",
  totalTenants: "租户总数",
  activeTenants: "活跃租户",
  totalModels: "模型总数",
  activeModels: "可用模型",
  enabledDetail: "当前已启用 {count} 项",
  recentTenants: "最近租户",
  recentModels: "最近模型",
  serviceStatus: "服务状态",
  viewAll: "查看全部",
  loading: "正在加载…",
  loadError: "暂时无法加载数据",
  retry: "重新加载",
  emptyTenants: "暂无租户",
  emptyModels: "暂无模型",
  search: "搜索",
  searchTenants: "搜索租户名称或标识",
  searchModels: "搜索模型、供应商或远端 ID",
  clearSearch: "清除搜索",
  name: "名称",
  slug: "租户标识",
  status: "状态",
  members: "成员",
  membersCount: "{count} 名成员",
  locale: "默认语言",
  timeZone: "时区",
  createdAt: "创建时间",
  configure: "配置",
  viewMembers: "查看成员",
  active: "运行中",
  suspended: "已暂停",
  archived: "已归档",
  disabled: "已停用",
  previousPage: "上一页",
  nextPage: "下一页",
  pageSummary: "第 {page} / {pages} 页，共 {total} 条",
  pageSize: "每页 {size} 条",
  editTenant: "租户配置",
  createTenant: "创建租户",
  createTenantDescription:
    "建立工作空间并指定首位负责人。未注册邮箱进入待激活状态，由本人设置密码。",
  defaultAdministrator: "默认管理员",
  administratorEmail: "管理员邮箱",
  departmentsCount: "{count} 个部门",
  tenantCreated: "租户已创建",
  tenantActivationCreated: "管理员激活邀请已创建",
  administratorEmailHint: "已有账户会立即成为 Owner；未注册人员通过激活链接自行设置密码。",
  activationLink: "一次性激活链接",
  copyActivationLink: "复制激活链接",
  tenantMembersTitle: "租户成员组织",
  searchTenantMembers: "搜索姓名、邮箱、部门或岗位",
  emptyTenantMembers: "暂无符合条件的成员",
  accessRole: "访问角色",
  department: "部门",
  jobTitle: "岗位",
  joinedAt: "加入时间",
  owner: "所有者",
  admin: "管理员",
  member: "成员",
  guest: "访客",
  invited: "待加入",
  left: "已离开",
  save: "保存",
  cancel: "取消",
  saved: "租户配置已保存",
  registerModel: "登记模型",
  editModel: "编辑模型",
  provider: "供应商",
  apiFormat: "协议格式",
  remoteModelId: "远端模型 ID",
  baseUrl: "服务地址",
  contextWindow: "上下文窗口",
  apiKey: "API Key",
  apiKeyPlaceholder: "留空则保持现有密钥",
  secretConfigured: "已配置",
  secretMissing: "未配置",
  allocatedTenants: "已分配租户",
  allocatedCount: "已分配 {count} 个租户",
  allocationTitle: "模型分配",
  noAllocation: "尚未分配",
  modelSaved: "模型配置已保存",
  modelCreated: "模型已登记",
  close: "关闭",
  apiReady: "可用",
  apiUnavailable: "不可用",
  apiService: "API 服务",
  platformDirectory: "平台目录",
  operatingNormally: "运行正常",
  unavailable: "连接异常",
  generalTab: "通用",
  authenticationTab: "认证",
  defaultLocale: "平台默认语言",
  defaultLocaleHint: "新租户与未设置语言偏好的页面默认使用该语言。",
  sessionMode: "会话方式",
  databaseSession: "数据库会话",
  cookieLifetime: "登录有效期",
  cookieLifetimeHint: "保存后对新登录立即生效，已签发会话保持原到期时间。",
  renewalInterval: "续期间隔",
  renewalIntervalHint: "活跃用户会在该间隔后自动延长登录，且必须短于有效期。",
  slidingRenewal: "滑动续期",
  slidingRenewalHint: "关闭后登录到期即失效，不再因为持续使用而自动续期。",
  enabled: "已启用",
  lifetime1Day: "1 天",
  lifetime7Days: "7 天",
  lifetime14Days: "14 天",
  lifetime30Days: "30 天",
  renewal1Hour: "1 小时",
  renewal6Hours: "6 小时",
  renewal12Hours: "12 小时",
  renewal1Day: "1 天",
  settingsSaved: "系统设置已保存",
  simplifiedChinese: "简体中文",
  english: "English",
  formatLabels: {
    openai_chat_completions: "OpenAI Chat Completions",
    openai_responses: "OpenAI Responses",
    anthropic_messages: "Anthropic Messages",
    google_generate_content: "Google Generate Content",
  },
  administratorsTitle: "平台管理员",
  administratorsTab: "管理员",
  addAdministrator: "添加管理员",
  administratorAdded: "平台管理员已添加",
  administratorStatusUpdated: "管理员状态已更新",
  adminEmail: "管理员邮箱",
  adminName: "姓名",
  adminStatus: "状态",
  adminActions: "操作",
  suspendAdmin: "停用",
  restoreAdmin: "启用",
  tenantQuota: "资源配额",
  tenantQuotaTitle: "租户资源配额",
  maxMembers: "最大成员数",
  maxStorage: "存储空间上限 (字节)",
  maxMonthlyBudget: "月度预算上限 (微美分)",
  quotaSaved: "配额设置已保存",
  detailedHealthTitle: "深度基础设施监控",
  databaseStatus: "数据库连接状态",
  dbLatency: "数据库响应延迟",
  connectionPool: "连接池连接数",
  redisStatus: "Redis 缓存状态",
  redisLatency: "Redis 响应延迟",
  workerStatus: "异步任务 Worker 状态",
  activeJobs: "活跃任务数",
  storageStatus: "对象存储状态",
  storageWritable: "可写入性",
  healthy: "健康正常",
  degraded: "性能降级",
  unhealthy: "异常故障",
  announcementsTitle: "系统公告与维护通知",
  announcementsTab: "公告通知",
  createAnnouncement: "发布新公告",
  announcementTitle: "公告标题",
  announcementContent: "公告内容",
  announcementLevel: "重要等级",
  announcementActive: "是否立即展示",
  announcementCreated: "系统公告已发布",
  announcementDeleted: "系统公告已删除",
  deleteAnnouncement: "删除公告",
  levelInfo: "普通通知",
  levelWarning: "维护预警",
  levelCritical: "紧急故障",
};

const enUS: SystemAdminDictionary = {
  overviewTitle: "Platform overview",
  tenantsTitle: "Tenant management",
  modelsTitle: "Model management",
  healthTitle: "Platform health",
  settingsTitle: "System settings",
  totalTenants: "Total tenants",
  activeTenants: "Active tenants",
  totalModels: "Total models",
  activeModels: "Available models",
  enabledDetail: "{count} currently enabled",
  recentTenants: "Recent tenants",
  recentModels: "Recent models",
  serviceStatus: "Service status",
  viewAll: "View all",
  loading: "Loading…",
  loadError: "Data is temporarily unavailable",
  retry: "Reload",
  emptyTenants: "No tenants",
  emptyModels: "No models",
  search: "Search",
  searchTenants: "Search tenant name or slug",
  searchModels: "Search model, provider, or remote ID",
  clearSearch: "Clear search",
  name: "Name",
  slug: "Tenant slug",
  status: "Status",
  members: "Members",
  membersCount: "{count} members",
  locale: "Default language",
  timeZone: "Time zone",
  createdAt: "Created",
  configure: "Configure",
  viewMembers: "View members",
  active: "Active",
  suspended: "Suspended",
  archived: "Archived",
  disabled: "Disabled",
  previousPage: "Previous",
  nextPage: "Next",
  pageSummary: "Page {page} of {pages} · {total} items",
  pageSize: "{size} per page",
  editTenant: "Tenant configuration",
  createTenant: "Create tenant",
  createTenantDescription:
    "Create a workspace and assign its first owner. Unregistered emails remain pending until the invitee sets a password.",
  defaultAdministrator: "Default administrator",
  administratorEmail: "Administrator email",
  departmentsCount: "{count} departments",
  tenantCreated: "Tenant created",
  tenantActivationCreated: "Administrator activation invitation created",
  administratorEmailHint:
    "An existing account becomes Owner immediately. A new user sets their own password through the activation link.",
  activationLink: "One-time activation link",
  copyActivationLink: "Copy activation link",
  tenantMembersTitle: "Tenant members",
  searchTenantMembers: "Search name, email, department, or job title",
  emptyTenantMembers: "No members match the current filters",
  accessRole: "Access role",
  department: "Department",
  jobTitle: "Job title",
  joinedAt: "Joined",
  owner: "Owner",
  admin: "Admin",
  member: "Member",
  guest: "Guest",
  invited: "Invited",
  left: "Left",
  save: "Save",
  cancel: "Cancel",
  saved: "Tenant configuration saved",
  registerModel: "Register model",
  editModel: "Edit model",
  provider: "Provider",
  apiFormat: "Protocol format",
  remoteModelId: "Remote model ID",
  baseUrl: "Service URL",
  contextWindow: "Context window",
  apiKey: "API Key",
  apiKeyPlaceholder: "Leave blank to keep the current key",
  secretConfigured: "Configured",
  secretMissing: "Not configured",
  allocatedTenants: "Allocated tenants",
  allocatedCount: "{count} tenants allocated",
  allocationTitle: "Model allocation",
  noAllocation: "Not allocated",
  modelSaved: "Model configuration saved",
  modelCreated: "Model registered",
  close: "Close",
  apiReady: "Available",
  apiUnavailable: "Unavailable",
  apiService: "API service",
  platformDirectory: "Platform directory",
  operatingNormally: "Operating normally",
  unavailable: "Connection issue",
  generalTab: "General",
  authenticationTab: "Authentication",
  defaultLocale: "Platform default language",
  defaultLocaleHint: "New tenants and pages without a locale preference use this language.",
  sessionMode: "Session mode",
  databaseSession: "Database session",
  cookieLifetime: "Sign-in lifetime",
  cookieLifetimeHint:
    "New sign-ins pick this up immediately. Existing sessions keep their original expiry.",
  renewalInterval: "Renewal interval",
  renewalIntervalHint:
    "Active users extend their session after this interval. It must be shorter than the lifetime.",
  slidingRenewal: "Sliding renewal",
  slidingRenewalHint:
    "When off, a session expires at its original time and is not extended by continued use.",
  enabled: "Enabled",
  lifetime1Day: "1 day",
  lifetime7Days: "7 days",
  lifetime14Days: "14 days",
  lifetime30Days: "30 days",
  renewal1Hour: "1 hour",
  renewal6Hours: "6 hours",
  renewal12Hours: "12 hours",
  renewal1Day: "1 day",
  settingsSaved: "System settings saved",
  simplifiedChinese: "Simplified Chinese",
  english: "English",
  formatLabels: {
    openai_chat_completions: "OpenAI Chat Completions",
    openai_responses: "OpenAI Responses",
    anthropic_messages: "Anthropic Messages",
    google_generate_content: "Google Generate Content",
  },
  administratorsTitle: "Platform Administrators",
  administratorsTab: "Administrators",
  addAdministrator: "Add Administrator",
  administratorAdded: "Administrator added",
  administratorStatusUpdated: "Administrator status updated",
  adminEmail: "Admin email",
  adminName: "Name",
  adminStatus: "Status",
  adminActions: "Actions",
  suspendAdmin: "Suspend",
  restoreAdmin: "Activate",
  tenantQuota: "Resource Quota",
  tenantQuotaTitle: "Tenant Resource Quota",
  maxMembers: "Max members",
  maxStorage: "Max storage (bytes)",
  maxMonthlyBudget: "Monthly budget cap (microcents)",
  quotaSaved: "Quota saved",
  detailedHealthTitle: "Deep Infrastructure Health",
  databaseStatus: "Database connection",
  dbLatency: "Database latency",
  connectionPool: "Connection pool",
  redisStatus: "Redis cache status",
  redisLatency: "Redis latency",
  workerStatus: "Background worker status",
  activeJobs: "Active jobs",
  storageStatus: "Object storage status",
  storageWritable: "Writable",
  healthy: "Healthy",
  degraded: "Degraded",
  unhealthy: "Unhealthy",
  announcementsTitle: "System Announcements",
  announcementsTab: "Announcements",
  createAnnouncement: "Post Announcement",
  announcementTitle: "Title",
  announcementContent: "Content",
  announcementLevel: "Severity level",
  announcementActive: "Active now",
  announcementCreated: "Announcement posted",
  announcementDeleted: "Announcement deleted",
  deleteAnnouncement: "Delete",
  levelInfo: "Info",
  levelWarning: "Warning",
  levelCritical: "Critical",
};

export const systemAdminDictionaries: Record<Locale, SystemAdminDictionary> = {
  "zh-CN": zhCN,
  "en-US": enUS,
};
