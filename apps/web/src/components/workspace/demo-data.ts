import type { DemoRoom, DisplayMessage, Participant } from "./types";
import type { ProjectSummary } from "@haloai/contracts";

const demoProjectId = "00000000-0000-4000-8000-000000000001";

export const demoProjects: ProjectSummary[] = [
  {
    id: demoProjectId,
    workspaceId: "00000000-0000-4000-8000-000000000002",
    name: "HaloAI Alpha",
    description: "",
    goal: "",
    expectedArtifact: "",
    completionCriteria: "",
    status: "active",
    currentActorRole: "lead",
    createdAt: "2026-08-13T00:00:00.000Z",
    updatedAt: "2026-08-13T00:00:00.000Z",
  },
];

export const demoRooms: DemoRoom[] = [
  {
    id: "launch",
    projectId: demoProjectId,
    nameKey: "roomLaunch",
    descriptionKey: "roomDescription",
    goalKey: "goalText",
    unread: 0,
  },
  {
    id: "research",
    projectId: demoProjectId,
    nameKey: "roomResearch",
    descriptionKey: "roomResearchDescription",
    goalKey: "roomResearchGoal",
    unread: 3,
  },
  {
    id: "website",
    projectId: demoProjectId,
    nameKey: "roomWebsite",
    descriptionKey: "roomWebsiteDescription",
    goalKey: "roomWebsiteGoal",
    unread: 0,
  },
];

export const demoParticipants: Participant[] = [
  {
    id: "mina",
    name: "Mina",
    roleKey: "roleProductLead",
    initials: "ML",
    color: "coral",
    kind: "human",
    online: true,
  },
  {
    id: "you",
    name: "Andy",
    roleKey: "roleProductLead",
    initials: "AY",
    color: "ink",
    kind: "human",
    online: true,
  },
  {
    id: "nova",
    name: "Nova",
    roleKey: "roleResearchAgent",
    initials: "N",
    color: "violet",
    kind: "agent",
    online: true,
  },
  {
    id: "muse",
    name: "Muse",
    roleKey: "roleWritingAgent",
    initials: "M",
    color: "cyan",
    kind: "agent",
    online: true,
  },
];

export const demoMessages: DisplayMessage[] = [
  {
    id: "message-1",
    authorId: "mina",
    nameKey: "messageLead",
    roleKey: "roleProductLead",
    bodyKey: "messageLeadBody",
    time: "09:18",
    ai: false,
    color: "coral",
    initials: "ML",
  },
  {
    id: "message-2",
    authorId: "nova",
    nameKey: "messageResearcher",
    roleKey: "roleResearchAgent",
    bodyKey: "messageResearcherBody",
    time: "09:24",
    ai: true,
    color: "violet",
    initials: "N",
  },
  {
    id: "message-3",
    authorId: "muse",
    nameKey: "messageWriter",
    roleKey: "roleWritingAgent",
    bodyKey: "messageWriterBody",
    time: "09:27",
    ai: true,
    color: "cyan",
    initials: "M",
  },
];
