import type { ReactNode } from "react";
import "../admin/admin-content.css";

export default function SystemLayout({ children }: Readonly<{ children: ReactNode }>) {
  return children;
}
