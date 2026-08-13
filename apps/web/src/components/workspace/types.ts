import type { Dictionary } from "@/lib/i18n";

export type MobileView = "rooms" | "chat" | "document" | "inbox";
export type WorkspaceSection = "room" | "overview" | "inbox" | "documents" | "activity";
export type Theme = "light" | "dark";
export type DocumentTab = "document" | "activity" | "versions";
export type RoleKey =
  "roleProductLead" | "roleResearchAgent" | "roleWritingAgent" | "roleFacilitator";
export type MessageBodyKey = "messageLeadBody" | "messageResearcherBody" | "messageWriterBody";
export type MessageNameKey = "messageYou" | "messageLead" | "messageResearcher" | "messageWriter";
export type RoomKey = "roomLaunch" | "roomResearch" | "roomWebsite";

export interface DemoRoom {
  id: string;
  nameKey?: RoomKey;
  name?: string;
  descriptionKey?: "roomDescription" | "roomResearchDescription" | "roomWebsiteDescription";
  goalKey?: "goalText" | "roomResearchGoal" | "roomWebsiteGoal";
  goal?: string;
  unread: number;
}

export interface Participant {
  id: string;
  name: string;
  roleKey: RoleKey;
  initials: string;
  color: string;
  kind: "human" | "agent";
  online: boolean;
}

export interface DisplayMessage {
  id: string;
  authorId: string;
  nameKey?: MessageNameKey;
  authorName?: string;
  roleKey: RoleKey;
  bodyKey?: MessageBodyKey;
  body?: string;
  time: string;
  ai: boolean;
  color: string;
  initials: string;
  pending?: boolean;
}

export interface WorkspaceViewProps {
  dictionary: Dictionary;
}
