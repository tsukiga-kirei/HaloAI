import { notFound } from "next/navigation";
import { AdminConsole } from "@/components/admin/admin-console";
import { RestrictedSurface } from "@/components/admin/restricted-surface";
import { isAdminSection } from "@/lib/admin-sections";
import { getWorkspaceAdminAccess } from "@/server/workspace-admin-access";

export default async function AdminSectionPage({
  params,
}: {
  params: Promise<{ section: string }>;
}) {
  const { section } = await params;
  if (!isAdminSection(section)) notFound();

  // 真实模式的敏感数据全部由浏览器携带 HttpOnly 会话向 API 获取，API 会再次校验成员角色。
  if (process.env.NEXT_PUBLIC_AUTH_MODE === "real") return <AdminConsole section={section} />;

  const access = getWorkspaceAdminAccess(section);
  if (!access.allowed) return <RestrictedSurface kind="workspace" />;
  return <AdminConsole section={section} />;
}
