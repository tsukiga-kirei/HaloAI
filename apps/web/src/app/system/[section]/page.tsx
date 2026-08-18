import { notFound } from "next/navigation";
import { SystemHealthSection } from "@/components/admin/system-health-section";
import { SystemModelsSection } from "@/components/admin/system-models-section";
import { SystemSettingsSection } from "@/components/admin/system-settings-section";
import { SystemTenantsSection } from "@/components/admin/system-tenants-section";
import { isSystemSection } from "@/lib/system-sections";

export default async function SystemSectionPage({
  params,
}: {
  params: Promise<{ section: string }>;
}) {
  const { section } = await params;
  if (!isSystemSection(section) || section === "overview") notFound();
  if (section === "tenants") return <SystemTenantsSection />;
  if (section === "models") return <SystemModelsSection />;
  if (section === "health") return <SystemHealthSection />;
  return <SystemSettingsSection />;
}
