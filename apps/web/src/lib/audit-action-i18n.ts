import type { Locale } from "./i18n";

/**
 * 审计 action 是服务端事件键，列表必须显示人类可读名称。
 * 未知键回退为原值，不得在目录里用等宽字体把长键顶出边界。
 */
const labels: Record<Locale, Record<string, string>> = {
  "zh-CN": {
    "workspace.created": "创建工作空间",
    "member.invited": "邀请成员",
    "member.joined": "成员加入",
    "member.organization.updated": "更新成员组织",
    "member.role.updated": "更新访问角色",
    "member.status.updated": "更新成员状态",
    "department.created": "创建部门",
    "department.updated": "更新部门",
  },
  "en-US": {
    "workspace.created": "Workspace created",
    "member.invited": "Member invited",
    "member.joined": "Member joined",
    "member.organization.updated": "Member organization updated",
    "member.role.updated": "Access role updated",
    "member.status.updated": "Member status updated",
    "department.created": "Department created",
    "department.updated": "Department updated",
  },
};

export function labelAuditAction(action: string, locale: Locale): string {
  return labels[locale][action] ?? action;
}
