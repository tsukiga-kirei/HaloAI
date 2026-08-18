import type { ReactNode } from "react";
import "../admin/admin-shell.css";
import "../admin/admin-content.css";
import "./system-admin.css";

export default function SystemLayout({ children }: Readonly<{ children: ReactNode }>) {
  return children;
}
