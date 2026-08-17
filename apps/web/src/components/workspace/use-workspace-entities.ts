"use client";

import { type FormEvent, useEffect, useState } from "react";
import type {
  CreateDocumentInput,
  CreateProjectInput,
  CreateRoomInput,
  DocumentSummary,
  ProjectSummary,
  RoomMessageSummary,
  RoomSummary,
  WorkspaceCollaborationSnapshot,
} from "@haloai/contracts";
import type { Dictionary } from "@/lib/i18n";
import type { DemoRoom, DisplayMessage, Participant, RoleKey } from "./types";

interface EntityCallbacks {
  onCreateProject?: ((input: CreateProjectInput) => Promise<ProjectSummary>) | undefined;
  onCreateRoom?: ((projectId: string, input: CreateRoomInput) => Promise<RoomSummary>) | undefined;
  onCreateDocument?:
    ((projectId: string, input: CreateDocumentInput) => Promise<DocumentSummary>) | undefined;
}

function mapRoom(room: RoomSummary): DemoRoom {
  return {
    id: room.id,
    projectId: room.projectId,
    name: room.name,
    goal: room.goal,
    expectedArtifact: room.expectedArtifact,
    visibility: room.visibility,
    unread: 0,
  };
}

function initialsFrom(name: string): string {
  return (
    name
      .split(/\s+/u)
      .map((part) => part.slice(0, 1))
      .join("")
      .slice(0, 2)
      .toLocaleUpperCase() || "HA"
  );
}

function roleFromHandle(handle: string, kind: Participant["kind"]): RoleKey {
  if (handle === "nova") return "roleResearchAgent";
  if (handle === "muse") return "roleWritingAgent";
  if (kind === "agent") return "roleFacilitator";
  return "roleProductLead";
}

function colorFromHandle(handle: string, kind: Participant["kind"]): string {
  if (kind === "agent") {
    if (handle === "nova") return "violet";
    if (handle === "muse") return "cyan";
    return "mint";
  }
  if (handle === "andy") return "ink";
  if (handle === "mina") return "coral";
  return "amber";
}

function mapParticipant(
  actor: WorkspaceCollaborationSnapshot["participants"][number],
): Participant {
  const kind = actor.kind === "agent" ? "agent" : "human";
  return {
    id: actor.id,
    name: actor.displayName,
    roleKey: roleFromHandle(actor.handle, kind),
    initials: initialsFrom(actor.displayName),
    color: colorFromHandle(actor.handle, kind),
    kind,
    online: actor.status === "active",
  };
}

function messageBody(message: RoomMessageSummary): string {
  return message.parts
    .filter((part) => part.type === "text")
    .map((part) => part.data.text)
    .join("\n");
}

function mapMessage(
  message: RoomMessageSummary,
  participants: readonly Participant[],
  locale: string,
): DisplayMessage {
  const author = participants.find((item) => item.id === message.authorActorId);
  const authorName = author?.name ?? "Halo";
  return {
    id: message.id,
    authorId: message.authorActorId,
    authorName,
    roleKey: author?.roleKey ?? "roleFacilitator",
    body: messageBody(message),
    time: new Intl.DateTimeFormat(locale, { hour: "2-digit", minute: "2-digit" }).format(
      new Date(message.createdAt),
    ),
    ai: author?.kind === "agent",
    color: author?.color ?? "halo",
    initials: author?.initials ?? initialsFrom(authorName),
  };
}

function groupMessages(
  snapshot: WorkspaceCollaborationSnapshot | undefined,
  participants: readonly Participant[],
  locale: string,
): Record<string, DisplayMessage[]> {
  const grouped: Record<string, DisplayMessage[]> = {};
  for (const room of snapshot?.rooms ?? []) grouped[room.id] = [];
  for (const message of snapshot?.messages ?? []) {
    const mapped = mapMessage(message, participants, locale);
    grouped[message.roomId] = [...(grouped[message.roomId] ?? []), mapped];
  }
  return grouped;
}

/**
 * 工作区实体只来自服务端快照。禁止在认证会话中回退到前端假数据，
 * 否则刷新后会出现“界面有内容、数据库没有”的联调假象。
 */
export function useWorkspaceEntities({
  collaboration,
  dictionary,
  locale,
  onActivateRoom,
  onNotify,
  canCreateProject,
  ...callbacks
}: EntityCallbacks & {
  collaboration?: WorkspaceCollaborationSnapshot | undefined;
  dictionary: Dictionary;
  locale: string;
  onActivateRoom: (roomId: string) => void;
  onNotify: (message: string) => void;
  canCreateProject: boolean;
}) {
  const initialParticipants = (collaboration?.participants ?? []).map(mapParticipant);
  const [projects, setProjects] = useState<ProjectSummary[]>(collaboration?.projects ?? []);
  const [rooms, setRooms] = useState<DemoRoom[]>(collaboration?.rooms.map(mapRoom) ?? []);
  const [documents, setDocuments] = useState<DocumentSummary[]>(collaboration?.documents ?? []);
  const [participants, setParticipants] = useState<Participant[]>(initialParticipants);
  const [activeRoomId, setActiveRoomId] = useState(collaboration?.rooms[0]?.id ?? "");
  const [messagesByRoom, setMessagesByRoom] = useState<Record<string, DisplayMessage[]>>(() =>
    groupMessages(collaboration, initialParticipants, locale),
  );
  const [roomDialogOpen, setRoomDialogOpen] = useState(false);
  const [projectDialogOpen, setProjectDialogOpen] = useState(false);
  const [documentDialogOpen, setDocumentDialogOpen] = useState(false);
  const writableProjects = projects.filter(
    (project) => project.currentActorRole === "lead" || project.currentActorRole === "contributor",
  );

  useEffect(() => {
    if (collaboration === undefined) return;
    const nextParticipants = collaboration.participants.map(mapParticipant);
    const nextRooms = collaboration.rooms.map(mapRoom);
    setProjects(collaboration.projects);
    setRooms(nextRooms);
    setDocuments(collaboration.documents);
    setParticipants(nextParticipants);
    setMessagesByRoom(groupMessages(collaboration, nextParticipants, locale));
    setActiveRoomId(nextRooms[0]?.id ?? "");
  }, [collaboration, locale]);

  function requestCreateRoom(): void {
    if (projects.length === 0 && canCreateProject) {
      setProjectDialogOpen(true);
      onNotify(dictionary.projectRequired);
      return;
    }
    if (writableProjects.length === 0) {
      onNotify(dictionary.noProjectWriteAccess);
      return;
    }
    setRoomDialogOpen(true);
  }

  async function createProject(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const input: CreateProjectInput = {
      name: String(form.get("name") ?? "").trim(),
      description: "",
      goal: String(form.get("goal") ?? "").trim(),
      expectedArtifact: String(form.get("expectedArtifact") ?? "").trim(),
      completionCriteria: "",
    };
    if (input.name.length === 0) return;
    if (!callbacks.onCreateProject) {
      onNotify(dictionary.errorReply);
      return;
    }
    try {
      const project = await callbacks.onCreateProject(input);
      setProjects((current) => [...current, project]);
      setProjectDialogOpen(false);
      onNotify(dictionary.projectCreated);
    } catch {
      onNotify(dictionary.errorReply);
    }
  }

  async function createRoom(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const projectId = String(form.get("projectId") ?? "");
    const input: CreateRoomInput = {
      name: String(form.get("name") ?? "").trim(),
      goal: String(form.get("goal") ?? "").trim(),
      expectedArtifact: String(form.get("expectedArtifact") ?? "").trim(),
      completionCriteria: "",
      visibility: form.get("visibility") === "workspace" ? "workspace" : "private",
    };
    if (input.name.length === 0 || input.goal.length === 0 || projectId.length === 0) return;
    if (!callbacks.onCreateRoom) {
      onNotify(dictionary.errorReply);
      return;
    }
    try {
      const created = await callbacks.onCreateRoom(projectId, input);
      const room: DemoRoom = { id: created.id, projectId, ...input, unread: 0 };
      setRooms((current) => [...current, room]);
      setMessagesByRoom((current) => ({ ...current, [room.id]: [] }));
      setActiveRoomId(room.id);
      setRoomDialogOpen(false);
      onActivateRoom(room.id);
      onNotify(dictionary.roomCreated);
    } catch {
      onNotify(dictionary.errorReply);
    }
  }

  async function createDocument(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const projectId = String(form.get("projectId") ?? "");
    const title = String(form.get("title") ?? "").trim();
    const roomId = String(form.get("roomId") ?? "");
    if (projectId.length === 0 || title.length === 0) return;
    if (!callbacks.onCreateDocument) {
      onNotify(dictionary.errorReply);
      return;
    }
    try {
      const document = await callbacks.onCreateDocument(projectId, {
        title,
        ...(roomId.length > 0 ? { roomId } : {}),
      });
      setDocuments((current) => [...current, document]);
      setDocumentDialogOpen(false);
      onNotify(dictionary.documentCreated);
    } catch {
      onNotify(dictionary.errorReply);
    }
  }

  return {
    activeRoomId,
    documentDialogOpen,
    documents,
    messagesByRoom,
    participants,
    projectDialogOpen,
    projects,
    roomDialogOpen,
    rooms,
    writableProjects,
    createDocument,
    createProject,
    createRoom,
    requestCreateRoom,
    setActiveRoomId,
    setDocumentDialogOpen,
    setMessagesByRoom,
    setParticipants,
    setProjectDialogOpen,
    setRoomDialogOpen,
    setRooms,
  };
}
