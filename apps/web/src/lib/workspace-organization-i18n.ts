import type { Locale } from "./i18n";

export interface WorkspaceOrganizationDictionary {
  title: string;
  description: string;
  inviteMember: string;
  addDepartment: string;
  allMembers: string;
  departments: string;
  membersCount: string;
  departmentCount: string;
  unassigned: string;
  searchPlaceholder: string;
  member: string;
  department: string;
  jobTitle: string;
  role: string;
  status: string;
  actions: string;
  edit: string;
  active: string;
  owner: string;
  admin: string;
  regularMember: string;
  guest: string;
  manager: string;
  noManager: string;
  departmentDescription: string;
  emptyMembers: string;
  loading: string;
  loadError: string;
  previousPage: string;
  nextPage: string;
  pageSummary: string;
  pageSize: string;
  editMember: string;
  save: string;
  cancel: string;
  memberUpdated: string;
  departmentName: string;
  departmentCode: string;
  parentDepartment: string;
  rootDepartment: string;
  sortOrder: string;
  createDepartment: string;
  editDepartment: string;
  departmentSaved: string;
  departmentCodeHint: string;
  memberEmail: string;
  inviteDescription: string;
  inviteCreated: string;
  invalidEmail: string;
  inviteRole: string;
  developmentInviteLink: string;
  copy: string;
  close: string;
  organizationOverview: string;
  ownersCount: string;
  lastOwnerRequired: string;
  invited: string;
  suspended: string;
  left: string;
  inviteEmailPlaceholder: string;
  suspendMember: string;
  restoreMember: string;
  memberStatusUpdated: string;
}

const zhCN: WorkspaceOrganizationDictionary = {
  title: "组织与成员",
  description: "维护部门结构、成员归属与访问角色。部门用于协作组织，权限仍由访问角色决定。",
  inviteMember: "邀请成员",
  addDepartment: "新增部门",
  allMembers: "全部成员",
  departments: "部门组织",
  membersCount: "{count} 名成员",
  departmentCount: "{count} 个部门",
  unassigned: "未分配部门",
  searchPlaceholder: "搜索姓名、邮箱、岗位或部门",
  member: "成员",
  department: "部门",
  jobTitle: "岗位",
  role: "访问角色",
  status: "状态",
  actions: "操作",
  edit: "编辑",
  active: "已启用",
  owner: "所有者",
  admin: "管理员",
  regularMember: "成员",
  guest: "访客",
  manager: "负责人",
  noManager: "未设置负责人",
  departmentDescription: "部门说明",
  emptyMembers: "没有符合当前条件的成员。",
  loading: "正在读取组织数据…",
  loadError: "无法读取组织数据，请确认当前账户具有管理权限。",
  previousPage: "上一页",
  nextPage: "下一页",
  pageSummary: "第 {page} / {pages} 页，共 {total} 条",
  pageSize: "每页 {size} 条",
  editMember: "成员组织信息",
  save: "保存",
  cancel: "取消",
  memberUpdated: "成员组织信息已更新",
  departmentName: "部门名称",
  departmentCode: "部门编码",
  parentDepartment: "上级部门",
  rootDepartment: "一级部门",
  sortOrder: "排序",
  createDepartment: "创建部门",
  editDepartment: "编辑部门",
  departmentSaved: "部门信息已保存",
  departmentCodeHint: "使用小写字母、数字和连字符",
  memberEmail: "成员邮箱",
  inviteDescription: "邀请与登录邮箱绑定，链接 72 小时内有效。",
  inviteCreated: "邀请已创建，有效期为 72 小时。",
  invalidEmail: "请输入有效的工作邮箱。",
  inviteRole: "初始访问角色",
  developmentInviteLink: "开发环境邀请链接",
  copy: "复制",
  close: "关闭",
  organizationOverview: "组织概览",
  ownersCount: "{count} 位所有者",
  lastOwnerRequired: "必须先指定另一位所有者，才能调整最后一位所有者。",
  invited: "待接受邀请",
  suspended: "已停用",
  left: "已离开",
  inviteEmailPlaceholder: "name@company.com",
  suspendMember: "停用成员",
  restoreMember: "恢复成员",
  memberStatusUpdated: "成员状态已更新。",
};

const enUS: WorkspaceOrganizationDictionary = {
  title: "Organization & members",
  description:
    "Manage departments, member placement, and access roles. Departments organize collaboration; roles still control access.",
  inviteMember: "Invite member",
  addDepartment: "Add department",
  allMembers: "All members",
  departments: "Departments",
  membersCount: "{count} members",
  departmentCount: "{count} departments",
  unassigned: "No department",
  searchPlaceholder: "Search name, email, title, or department",
  member: "Member",
  department: "Department",
  jobTitle: "Job title",
  role: "Access role",
  status: "Status",
  actions: "Actions",
  edit: "Edit",
  active: "Active",
  owner: "Owner",
  admin: "Admin",
  regularMember: "Member",
  guest: "Guest",
  manager: "Manager",
  noManager: "No manager",
  departmentDescription: "Department description",
  emptyMembers: "No members match the current filters.",
  loading: "Loading organization…",
  loadError: "Could not load the organization. Check your workspace permissions.",
  previousPage: "Previous",
  nextPage: "Next",
  pageSummary: "Page {page} of {pages} · {total} items",
  pageSize: "{size} per page",
  editMember: "Member organization",
  save: "Save",
  cancel: "Cancel",
  memberUpdated: "Member organization updated",
  departmentName: "Department name",
  departmentCode: "Department code",
  parentDepartment: "Parent department",
  rootDepartment: "Top-level department",
  sortOrder: "Order",
  createDepartment: "Create department",
  editDepartment: "Edit department",
  departmentSaved: "Department saved",
  departmentCodeHint: "Use lowercase letters, numbers, and hyphens",
  memberEmail: "Member email",
  inviteDescription: "Invites are email-bound and valid for 72 hours.",
  inviteCreated: "Invitation created and valid for 72 hours.",
  invalidEmail: "Enter a valid work email.",
  inviteRole: "Initial access role",
  developmentInviteLink: "Development invite link",
  copy: "Copy",
  close: "Close",
  organizationOverview: "Organization overview",
  ownersCount: "{count} owners",
  lastOwnerRequired: "Assign another owner before changing the final owner.",
  invited: "Invitation pending",
  suspended: "Suspended",
  left: "Left",
  inviteEmailPlaceholder: "name@company.com",
  suspendMember: "Suspend member",
  restoreMember: "Restore member",
  memberStatusUpdated: "Member status updated.",
};

export const workspaceOrganizationDictionaries: Record<Locale, WorkspaceOrganizationDictionary> = {
  "zh-CN": zhCN,
  "en-US": enUS,
};
