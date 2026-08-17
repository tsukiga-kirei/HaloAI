import { notFound } from "next/navigation";
import { SystemConsole, systemSections } from "@/components/admin/system-console";

export default async function SystemSectionPage({
  params,
}: {
  params: Promise<{ section: string }>;
}) {
  const { section } = await params;
  if (!systemSections.includes(section as (typeof systemSections)[number]) || section === "overview") {
    notFound();
  }
  return <SystemConsole section={section as Exclude<(typeof systemSections)[number], "overview">} />;
}
