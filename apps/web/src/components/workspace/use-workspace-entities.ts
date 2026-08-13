"use client";

import { type FormEvent, useEffect, useState } from "react";
import type {
  CreateDocumentInput,
  CreateProjectInput,
  CreateRoomInput,
  DocumentSummary,
  ProjectSummary,
  RoomSummary,
  WorkspaceCollaborationSnapshot,
} from "@haloai/contracts";
import type { Dictionary } from "@/lib/i18n";
import { demoMessages, demoProjects, demoRooms } from "./demo-data";
import type { DemoRoom, DisplayMessage } from "./types";

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

/**
 * 演示数据与认证后的持久化数据在这一层明确分流，避免正式会话静默回退到本地假数据。
 * 所有持久化写入都只发送契约允许的字段，工作区与操作者身份仍由服务端会话推导。
 */
export function useWorkspaceEntities({
  collaboration,
  dictionary,
  onActivateRoom,
  onNotify,
  canCreateProject,
  ...callbacks
}: EntityCallbacks & {
  collaboration?: WorkspaceCollaborationSnapshot | undefined;
  dictionary: Dictionary;
  onActivateRoom: (roomId: string) => void;
  onNotify: (message: string) => void;
  canCreateProject: boolean;
}) {
  const durable = collaboration !== undefined;
  const [projects, setProjects] = useState<ProjectSummary[]>(
    collaboration?.projects ?? demoProjects,
  );
  const [rooms, setRooms] = useState<DemoRoom[]>(collaboration?.rooms.map(mapRoom) ?? demoRooms);
  const [documents, setDocuments] = useState<DocumentSummary[]>(collaboration?.documents ?? []);
  const [activeRoomId, setActiveRoomId] = useState(collaboration?.rooms[0]?.id ?? "launch");
  const [messagesByRoom, setMessagesByRoom] = useState<Record<string, DisplayMessage[]>>(() => ({
    launch: demoMessages,
    research: [],
    website: [],
  }));
  const [roomDialogOpen, setRoomDialogOpen] = useState(false);
  const [projectDialogOpen, setProjectDialogOpen] = useState(false);
  const [documentDialogOpen, setDocumentDialogOpen] = useState(false);
  const writableProjects = projects.filter(
    (project) => project.currentActorRole === "lead" || project.currentActorRole === "contributor",
  );

  useEffect(() => {
    if (collaboration === undefined) return;
    const nextRooms = collaboration.rooms.map(mapRoom);
    setProjects(collaboration.projects);
    setRooms(nextRooms);
    setDocuments(collaboration.documents);
    setMessagesByRoom(Object.fromEntries(nextRooms.map((room) => [room.id, []])));
    setActiveRoomId(nextRooms[0]?.id ?? "");
  }, [collaboration]);

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
    try {
      const now = new Date().toISOString();
      const project = callbacks.onCreateProject
        ? await callbacks.onCreateProject(input)
        : {
            id: crypto.randomUUID(),
            workspaceId: demoProjects[0]?.workspaceId ?? crypto.randomUUID(),
            ...input,
            status: "active" as const,
            currentActorRole: "lead" as const,
            createdAt: now,
            updatedAt: now,
          };
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
    try {
      const created = callbacks.onCreateRoom
        ? await callbacks.onCreateRoom(projectId, input)
        : { id: crypto.randomUUID(), projectId, ...input };
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
    try {
      const now = new Date().toISOString();
      const document = callbacks.onCreateDocument
        ? await callbacks.onCreateDocument(projectId, {
            title,
            ...(roomId.length > 0 ? { roomId } : {}),
          })
        : {
            id: crypto.randomUUID(),
            workspaceId: demoProjects[0]?.workspaceId ?? crypto.randomUUID(),
            projectId,
            roomId: roomId.length > 0 ? roomId : null,
            ownerActorId: crypto.randomUUID(),
            ownerDisplayName: dictionary.messageYou,
            title,
            status: "active" as const,
            createdAt: now,
            updatedAt: now,
          };
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
    durable,
    messagesByRoom,
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
    setProjectDialogOpen,
    setRoomDialogOpen,
    setRooms,
  };
}
