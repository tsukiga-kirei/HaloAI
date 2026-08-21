import { notFound } from "next/navigation";
import { AdminSectionPage } from "@/components/admin/admin-section-page";
import { RestrictedSurface } from "@/components/admin/restricted-surface";
import { isAdminSection } from "@/lib/admin-sections";
import { getWorkspaceAdminAccess } from "@/server/workspace-admin-access";

export default async function AdminSectionRoutePage({
  params,
}: {
  params: Promise<{ section: string }>;
}) {
  const { section } = await params;
  if (!isAdminSection(section)) notFound();

  const access = await getWorkspaceAdminAccess(section);
  if (!access.allowed) return <RestrictedSurface kind="workspace" variant="panel" />;
  return <AdminSectionPage section={section} />;
}
