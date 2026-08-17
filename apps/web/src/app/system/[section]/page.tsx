import { notFound } from "next/navigation";
import { SystemConsole } from "@/components/admin/system-console";
import { RestrictedSurface } from "@/components/admin/restricted-surface";
import { isSystemSection } from "@/lib/system-sections";
import { getSystemAdminAccess } from "@/server/system-admin-access";

export default async function SystemSectionPage({
  params,
}: {
  params: Promise<{ section: string }>;
}) {
  const { section } = await params;
  if (!isSystemSection(section) || section === "overview") {
    notFound();
  }

  const access = getSystemAdminAccess();
  if (!access.allowed) return <RestrictedSurface kind="system" />;
  return <SystemConsole section={section} />;
}
