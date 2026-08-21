import type { Capability } from "@haloai/core";

export const adminSections = [
  "overview",
  "members",
  "roles",
  "announcements",
  "agents",
  "integrations",
  "security",
  "audit",
] as const;

export type AdminSection = (typeof adminSections)[number];

const sectionCapabilities: Record<AdminSection, Capability> = {
  overview: "workspace.manage",
  members: "member.manage",
  roles: "workspace.manage",
  announcements: "workspace.manage",
  agents: "agent.profile.create",
  integrations: "workspace.manage",
  security: "workspace.security.manage",
  audit: "audit.read",
};

export function isAdminSection(value: string): value is AdminSection {
  return adminSections.some((section) => section === value);
}

export function capabilityForAdminSection(section: AdminSection): Capability {
  return sectionCapabilities[section];
}
