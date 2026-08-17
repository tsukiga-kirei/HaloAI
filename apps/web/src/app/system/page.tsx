import { SystemConsole } from "@/components/admin/system-console";
import { RestrictedSurface } from "@/components/admin/restricted-surface";
import { getSystemAdminAccess } from "@/server/system-admin-access";

export default function SystemAdministrationPage() {
  const access = getSystemAdminAccess();
  if (!access.allowed) return <RestrictedSurface kind="system" />;
  return <SystemConsole section="overview" />;
}
