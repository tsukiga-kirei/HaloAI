import type { ReactNode } from "react";
import { AdminConsole } from "@/components/admin/admin-console";
import "./admin-shell.css";
import "./admin-content.css";

export default function AdminLayout({ children }: Readonly<{ children: ReactNode }>) {
  return <AdminConsole>{children}</AdminConsole>;
}
