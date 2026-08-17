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

  const access = getWorkspaceAdminAccess(section);
  if (!access.allowed) return <RestrictedSurface kind="workspace" />;
  return <AdminConsole section={section} />;
}
