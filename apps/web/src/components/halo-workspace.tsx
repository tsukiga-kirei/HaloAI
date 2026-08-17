"use client";

import { type FormEvent, type KeyboardEvent, useEffect, useMemo, useRef, useState } from "react";
import type { Route } from "next";
import { useRouter } from "next/navigation";
import { z } from "zod";
import type {
  AuthenticatedUser,
  CreateDocumentInput,
  CreateProjectInput,
  CreateRoomInput,
  DocumentSummary,
  ProjectSummary,
  RoomSummary,
  WorkspaceCollaborationSnapshot,
  WorkspaceSummary,
} from "@haloai/contracts";
import { getDictionary } from "@/lib/i18n";
import { clearClientPortalSession } from "@/lib/portals";
import { useShellPreferences } from "@/lib/shell-preferences";
import { notify } from "@/components/toast-host";
import { ConversationPanel } from "./workspace/conversation-panel";
import { demoParticipants } from "./workspace/demo-data";
import { DocumentPanel } from "./workspace/document-panel";
import { DocumentDialog } from "./workspace/document-dialog";
import { MemberDialog } from "./workspace/member-dialog";
import { MobileNavigation } from "./workspace/navigation";
import { RoomDialog } from "./workspace/room-dialog";
import { ProjectDialog } from "./workspace/project-dialog";
import type {
  DisplayMessage,
  DocumentTab,
  MobileView,
  Participant,
  RoleKey,
  WorkspaceSection,
} from "./workspace/types";
import { WorkspaceHub } from "./workspace/workspace-hub";
import { WorkspaceSidebar } from "./workspace/workspace-sidebar";
import { useWorkspaceEntities } from "./workspace/use-workspace-entities";

const streamEventSchema = z.object({
  type: z.string().min(1),
  sequence: z.number().int().positive().optional(),
  delta: z.string().optional(),
  code: z.string().optional(),
});

export function HaloWorkspace({
  identity,
  workspaces = [],
  activeWorkspace,
  onWorkspaceChange,
  onSignOut,
  collaboration,
  onCreateProject,
  onCreateRoom,
  onCreateDocument,
}: {
  identity?: AuthenticatedUser | undefined;
  workspaces?: readonly WorkspaceSummary[];
  activeWorkspace?: WorkspaceSummary | undefined;
  onWorkspaceChange?: ((workspace: WorkspaceSummary) => void) | undefined;
  onSignOut?: (() => void) | undefined;
  collaboration?: WorkspaceCollaborationSnapshot | undefined;
  onCreateProject?: ((input: CreateProjectInput) => Promise<ProjectSummary>) | undefined;
  onCreateRoom?: ((projectId: string, input: CreateRoomInput) => Promise<RoomSummary>) | undefined;
  onCreateDocument?:
    ((projectId: string, input: CreateDocumentInput) => Promise<DocumentSummary>) | undefined;
} = {}) {
  const router = useRouter();
  const durableMode = collaboration !== undefined;
  const canCreateProject =
    !durableMode || activeWorkspace?.role === "owner" || activeWorkspace?.role === "admin";
  const {
    locale,
    setLocale,
    theme,
    setTheme,
    collapsed: sidebarCollapsed,
    setCollapsed: setSidebarCollapsed,
    portal,
    sidebarMotion,
  } = useShellPreferences();
  const [mobileView, setMobileView] = useState<MobileView>("chat");
  const [workspaceSection, setWorkspaceSection] = useState<WorkspaceSection>(
    durableMode ? "overview" : "room",
  );
  const [documentTab, setDocumentTab] = useState<DocumentTab>("document");
  const [participants, setParticipants] = useState<Participant[]>(() =>
    durableMode
      ? identity && activeWorkspace
        ? [
            {
              id: activeWorkspace.actorId,
              name: identity.name,
              roleKey: "roleProductLead",
              initials: identity.name.slice(0, 2).toLocaleUpperCase(),
              color: "ink",
              kind: "human",
              online: true,
            },
          ]
        : []
      : demoParticipants,
  );
  const [input, setInput] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const [memberDialogOpen, setMemberDialogOpen] = useState(false);
  const [newMemberKind, setNewMemberKind] = useState<"human" | "agent">("agent");
  const [suggestionApplied, setSuggestionApplied] = useState(false);
  const [documentDirty, setDocumentDirty] = useState(false);
  const [documentVersion, setDocumentVersion] = useState(3);
  const endOfMessagesRef = useRef<HTMLDivElement>(null);
  const dictionary = useMemo(() => getDictionary(locale), [locale]);
  const {
    activeRoomId,
    documentDialogOpen,
    documents,
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
  } = useWorkspaceEntities({
    collaboration,
    dictionary,
    onCreateProject,
    onCreateRoom,
    onCreateDocument,
    onNotify: notify,
    canCreateProject,
    onActivateRoom: () => {
      setWorkspaceSection("room");
      setMobileView("chat");
    },
  });
  const activeRoom = rooms.find((room) => room.id === activeRoomId) ?? rooms[0];
  const activeMessages = messagesByRoom[activeRoomId] ?? [];
  const roomTitle =
    activeRoom?.name ??
    (activeRoom?.nameKey === undefined ? dictionary.roomLaunch : dictionary[activeRoom.nameKey]);
  const roomGoal = activeRoom?.goal ?? "";
  const peopleCount = participants.filter((participant) => participant.kind === "human").length;
  const agentCount = participants.length - peopleCount;
  const memberSummary = dictionary.peopleAndAgents
    .replace("{total}", String(participants.length))
    .replace("{people}", String(peopleCount))
    .replace("{agents}", String(agentCount));

  useEffect(() => {
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    endOfMessagesRef.current?.scrollIntoView({
      behavior: reduceMotion ? "auto" : "smooth",
      block: "end",
    });
  }, [activeMessages]);

  useEffect(() => {
    if (collaboration !== undefined) setWorkspaceSection("overview");
  }, [collaboration]);

  useEffect(() => {
    if (!durableMode || !identity || !activeWorkspace) return;
    setParticipants([
      {
        id: activeWorkspace.actorId,
        name: identity.name,
        roleKey: "roleProductLead",
        initials: identity.name.slice(0, 2).toLocaleUpperCase(),
        color: "ink",
        kind: "human",
        online: true,
      },
    ]);
  }, [activeWorkspace, durableMode, identity]);

  useEffect(() => {
    if (!memberDialogOpen && !roomDialogOpen && !projectDialogOpen && !documentDialogOpen) return;
    const closeOnEscape = (event: globalThis.KeyboardEvent) => {
      if (event.key === "Escape") {
        setMemberDialogOpen(false);
        setRoomDialogOpen(false);
        setProjectDialogOpen(false);
        setDocumentDialogOpen(false);
      }
    };
    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, [documentDialogOpen, memberDialogOpen, projectDialogOpen, roomDialogOpen]);

  const toggleLocale = () => setLocale((current) => (current === "zh-CN" ? "en-US" : "zh-CN"));
  const toggleTheme = () => setTheme((current) => (current === "light" ? "dark" : "light"));

  /**
   * Foundation Demo ???? SSE ????????? JSON?????????????
   * ???????????? Last-Event-ID ???????????????????????
   */
  function updateRoomMessages(
    roomId: string,
    update: (current: DisplayMessage[]) => DisplayMessage[],
  ): void {
    setMessagesByRoom((current) => ({
      ...current,
      [roomId]: update(current[roomId] ?? []),
    }));
  }

  async function streamAgentReply(message: string, roomId: string): Promise<void> {
    const replyId = crypto.randomUUID();
    const pendingReply: DisplayMessage = {
      id: replyId,
      authorId: "halo",
      authorName: "Halo",
      roleKey: "roleFacilitator",
      body: "",
      time: new Intl.DateTimeFormat(locale, { hour: "2-digit", minute: "2-digit" }).format(
        new Date(),
      ),
      ai: true,
      color: "halo",
      initials: "H",
      pending: true,
    };

    updateRoomMessages(roomId, (current) => [...current, pendingReply]);
    setIsStreaming(true);

    try {
      const response = await fetch("/api/demo-agent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message, locale }),
      });
      if (!response.ok || response.body === null) throw new Error("STREAM_UNAVAILABLE");

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      let lastSequence = 0;

      while (true) {
        const result = await reader.read();
        if (result.done) break;
        buffer += decoder.decode(result.value, { stream: true });
        const frames = buffer.split("\n\n");
        buffer = frames.pop() ?? "";

        for (const frame of frames) {
          const dataLine = frame.split("\n").find((line) => line.startsWith("data: "));
          if (dataLine === undefined) continue;
          const event = streamEventSchema.parse(JSON.parse(dataLine.slice(6)));
          if (event.sequence !== undefined) {
            if (event.sequence <= lastSequence) continue;
            if (event.sequence !== lastSequence + 1) throw new Error("EVENT_SEQUENCE_GAP");
            lastSequence = event.sequence;
          }
          if (event.type === "message.delta" && event.delta !== undefined) {
            updateRoomMessages(roomId, (current) =>
              current.map((item) =>
                item.id === replyId ? { ...item, body: `${item.body ?? ""}${event.delta}` } : item,
              ),
            );
          }
          if (event.type === "run.failed") throw new Error(event.code ?? "RUN_FAILED");
        }
      }

      updateRoomMessages(roomId, (current) =>
        current.map((item) => (item.id === replyId ? { ...item, pending: false } : item)),
      );
    } catch {
      updateRoomMessages(roomId, (current) =>
        current.map((item) =>
          item.id === replyId ? { ...item, body: dictionary.errorReply, pending: false } : item,
        ),
      );
    } finally {
      setIsStreaming(false);
    }
  }

  async function submitMessage(): Promise<void> {
    if (durableMode) {
      notify(dictionary.durableDataBoundary);
      return;
    }
    const trimmed = input.trim();
    if (trimmed.length === 0 || isStreaming) return;

    const userMessage: DisplayMessage = {
      id: crypto.randomUUID(),
      authorId: "you",
      nameKey: "messageYou",
      roleKey: "roleProductLead",
      body: trimmed,
      time: new Intl.DateTimeFormat(locale, { hour: "2-digit", minute: "2-digit" }).format(
        new Date(),
      ),
      ai: false,
      color: "ink",
      initials: "AY",
    };
    const roomId = activeRoomId;
    updateRoomMessages(roomId, (current) => [...current, userMessage]);
    setInput("");
    await streamAgentReply(trimmed, roomId);
  }

  function handleComposerKeyDown(event: KeyboardEvent<HTMLTextAreaElement>): void {
    if (event.key === "Enter" && !event.shiftKey && !event.nativeEvent.isComposing) {
      event.preventDefault();
      void submitMessage();
    }
  }

  function handleAddMember(event: FormEvent<HTMLFormElement>): void {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const name = String(form.get("name") ?? "").trim();
    if (name.length === 0) return;
    const roleKey: RoleKey = newMemberKind === "agent" ? "roleResearchAgent" : "roleProductLead";
    setParticipants((current) => [
      ...current,
      {
        id: crypto.randomUUID(),
        name,
        roleKey,
        initials: name.slice(0, 2).toLocaleUpperCase(),
        color: newMemberKind === "agent" ? "mint" : "amber",
        kind: newMemberKind,
        online: true,
      },
    ]);
    setMemberDialogOpen(false);
    notify(dictionary.teammateAdded);
  }

  function selectRoom(roomId: string): void {
    setActiveRoomId(roomId);
    setWorkspaceSection("room");
    setRooms((current) =>
      current.map((room) => (room.id === roomId ? { ...room, unread: 0 } : room)),
    );
    setMobileView("chat");
  }

  function selectWorkspaceSection(section: WorkspaceSection): void {
    setWorkspaceSection(section);
    if (section !== "room") setMobileView("inbox");
  }

  function openRoomDocument(roomId: string): void {
    setActiveRoomId(roomId);
    setWorkspaceSection("room");
    setDocumentTab("document");
    setMobileView("document");
  }

  function changeMobileView(view: MobileView): void {
    if (view === "inbox") {
      setWorkspaceSection("overview");
    } else if (view === "chat" || view === "document") {
      setWorkspaceSection("room");
    }
    setMobileView(view);
  }

  return (
    <div
      className={`halo-shell view-${mobileView}${sidebarCollapsed ? " is-collapsed" : ""}${
        sidebarMotion ? " is-sidebar-motion" : ""
      }`}
      id="workspace"
    >
      <WorkspaceSidebar
        dictionary={dictionary}
        rooms={rooms}
        activeRoomId={activeRoomId}
        onRoomSelect={selectRoom}
        onCreateRoom={requestCreateRoom}
        onOpenMemberDialog={() =>
          durableMode ? notify(dictionary.durableDataBoundary) : setMemberDialogOpen(true)
        }
        onNotify={notify}
        identity={identity}
        workspaces={workspaces}
        activeWorkspace={activeWorkspace}
        onWorkspaceChange={onWorkspaceChange}
        onSignOut={() => {
          if (onSignOut) {
            onSignOut();
            return;
          }
          clearClientPortalSession();
          router.replace("/login" as Route);
          router.refresh();
        }}
        activeSection={workspaceSection}
        onSectionSelect={selectWorkspaceSection}
        locale={locale}
        theme={theme}
        portal={portal}
        onToggleLocale={toggleLocale}
        onToggleTheme={toggleTheme}
        collapsed={sidebarCollapsed}
        onToggleCollapsed={() => setSidebarCollapsed((current) => !current)}
      />
      {workspaceSection === "room" ? (
        <>
          <ConversationPanel
            dictionary={dictionary}
            roomTitle={roomTitle}
            roomGoal={roomGoal}
            memberSummary={memberSummary}
            participants={participants}
            messages={activeMessages}
            input={input}
            isStreaming={isStreaming}
            endOfMessagesRef={endOfMessagesRef}
            onInputChange={setInput}
            onComposerKeyDown={handleComposerKeyDown}
            onSubmit={() => void submitMessage()}
            onOpenRooms={() => setMobileView("rooms")}
            onOpenDocument={() => setMobileView("document")}
            onOpenMemberDialog={() =>
              durableMode ? notify(dictionary.durableDataBoundary) : setMemberDialogOpen(true)
            }
            onNotify={notify}
            chatEnabled={!durableMode}
          />
          <DocumentPanel
            dictionary={dictionary}
            tab={documentTab}
            version={documentVersion}
            dirty={documentDirty}
            suggestionApplied={suggestionApplied}
            onTabChange={setDocumentTab}
            onDirtyChange={setDocumentDirty}
            onSave={() => {
              setDocumentDirty(false);
              setDocumentVersion((current) => current + 1);
              notify(dictionary.versionSaved);
            }}
            onApplySuggestion={() => {
              setSuggestionApplied(true);
              setDocumentDirty(true);
            }}
            onCloseMobile={() => setMobileView("chat")}
            onNotify={notify}
            demoContent={!durableMode}
          />
        </>
      ) : (
        <WorkspaceHub
          dictionary={dictionary}
          section={workspaceSection}
          rooms={rooms}
          projects={projects}
          documents={documents}
          durable={durableMode}
          canCreateProject={canCreateProject}
          canCreateArtifact={writableProjects.length > 0}
          onSectionChange={selectWorkspaceSection}
          onCreateRoom={requestCreateRoom}
          onCreateProject={() => setProjectDialogOpen(true)}
          onCreateDocument={() =>
            writableProjects.length === 0 ? requestCreateRoom() : setDocumentDialogOpen(true)
          }
          onOpenRoom={selectRoom}
          onOpenDocument={openRoomDocument}
          onNotify={notify}
        />
      )}
      <MobileNavigation dictionary={dictionary} view={mobileView} onViewChange={changeMobileView} />

      {memberDialogOpen ? (
        <MemberDialog
          dictionary={dictionary}
          kind={newMemberKind}
          onKindChange={setNewMemberKind}
          onClose={() => setMemberDialogOpen(false)}
          onSubmit={handleAddMember}
        />
      ) : null}

      {roomDialogOpen ? (
        <RoomDialog
          dictionary={dictionary}
          projects={writableProjects}
          onClose={() => setRoomDialogOpen(false)}
          onSubmit={(event) => void createRoom(event)}
        />
      ) : null}

      {projectDialogOpen ? (
        <ProjectDialog
          dictionary={dictionary}
          onClose={() => setProjectDialogOpen(false)}
          onSubmit={(event) => void createProject(event)}
        />
      ) : null}

      {documentDialogOpen ? (
        <DocumentDialog
          dictionary={dictionary}
          projects={writableProjects}
          rooms={rooms}
          onClose={() => setDocumentDialogOpen(false)}
          onSubmit={(event) => void createDocument(event)}
        />
      ) : null}
    </div>
  );
}
