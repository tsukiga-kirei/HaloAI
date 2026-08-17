export const systemSections = ["overview", "tenants", "health", "policy", "audit"] as const;

export type SystemSection = (typeof systemSections)[number];

/** 分区路由校验必须放在无 "use client" 的模块里，避免服务端拿到 Client 模块引用。 */
export function isSystemSection(value: string): value is SystemSection {
  return systemSections.some((section) => section === value);
}
