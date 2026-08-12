import type { ReactNode } from "react";
import "./admin-shell.css";
import "./admin-content.css";

export default function AdminLayout({ children }: Readonly<{ children: ReactNode }>) {
  return children;
}
