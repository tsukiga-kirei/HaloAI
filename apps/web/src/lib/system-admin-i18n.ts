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
  name: string;
  slug: string;
  status: string;
  members: string;
  locale: string;
  timeZone: string;
  createdAt: string;
  actions: string;
  configure: string;
  active: string;
  suspended: string;
  archived: string;
  disabled: string;
  previousPage: string;
  nextPage: string;
  pageSummary: string;
  pageSize: string;
  editTenant: string;
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
  allocate: string;
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
  aiConversationTab: string;
  defaultLocale: string;
  sessionMode: string;
  databaseSession: string;
  cookieLifetime: string;
  renewalInterval: string;
  slidingRenewal: string;
  enabled: string;
  days: string;
  hours: string;
  aiSettingsReserved: string;
  settingsSaved: string;
  simplifiedChinese: string;
  english: string;
  formatLabels: Record<PlatformModelApiFormat, string>;
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
  name: "名称",
  slug: "租户标识",
  status: "状态",
  members: "成员",
  locale: "默认语言",
  timeZone: "时区",
  createdAt: "创建时间",
  actions: "操作",
  configure: "配置",
  active: "运行中",
  suspended: "已暂停",
  archived: "已归档",
  disabled: "已停用",
  previousPage: "上一页",
  nextPage: "下一页",
  pageSummary: "第 {page} / {pages} 页，共 {total} 条",
  pageSize: "每页 {size} 条",
  editTenant: "租户配置",
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
  allocate: "租户分配",
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
  aiConversationTab: "AI 对话",
  defaultLocale: "平台默认语言",
  sessionMode: "会话方式",
  databaseSession: "数据库会话",
  cookieLifetime: "登录有效期",
  renewalInterval: "续期间隔",
  slidingRenewal: "滑动续期",
  enabled: "已启用",
  days: "{count} 天",
  hours: "{count} 小时",
  aiSettingsReserved: "AI 对话设置将在模型路由接入后开放。",
  settingsSaved: "系统设置已保存",
  simplifiedChinese: "简体中文",
  english: "English",
  formatLabels: {
    openai_chat_completions: "OpenAI Chat Completions",
    openai_responses: "OpenAI Responses",
    anthropic_messages: "Anthropic Messages",
    google_generate_content: "Google Generate Content",
  },
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
  name: "Name",
  slug: "Tenant slug",
  status: "Status",
  members: "Members",
  locale: "Default language",
  timeZone: "Time zone",
  createdAt: "Created",
  actions: "Actions",
  configure: "Configure",
  active: "Active",
  suspended: "Suspended",
  archived: "Archived",
  disabled: "Disabled",
  previousPage: "Previous",
  nextPage: "Next",
  pageSummary: "Page {page} of {pages} · {total} items",
  pageSize: "{size} per page",
  editTenant: "Tenant configuration",
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
  allocate: "Tenant allocation",
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
  aiConversationTab: "AI conversation",
  defaultLocale: "Platform default language",
  sessionMode: "Session mode",
  databaseSession: "Database session",
  cookieLifetime: "Sign-in lifetime",
  renewalInterval: "Renewal interval",
  slidingRenewal: "Sliding renewal",
  enabled: "Enabled",
  days: "{count} days",
  hours: "{count} hours",
  aiSettingsReserved: "AI conversation settings open when model routing is connected.",
  settingsSaved: "System settings saved",
  simplifiedChinese: "Simplified Chinese",
  english: "English",
  formatLabels: {
    openai_chat_completions: "OpenAI Chat Completions",
    openai_responses: "OpenAI Responses",
    anthropic_messages: "Anthropic Messages",
    google_generate_content: "Google Generate Content",
  },
};

export const systemAdminDictionaries: Record<Locale, SystemAdminDictionary> = {
  "zh-CN": zhCN,
  "en-US": enUS,
};
