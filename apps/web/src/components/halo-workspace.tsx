"use client";

import { type FormEvent, type KeyboardEvent, useEffect, useMemo, useRef, useState } from "react";
import type { Route } from "next";
import { useRouter } from "next/navigation";
import {
  AssignableWorkspaceRoleSchema,
  type AuthenticatedUser,
  type CreateDocumentInput,
  type CreateProjectInput,
  type CreateRoomInput,
  type DocumentSummary,
  type ProjectSummary,
  type RoomMessageSummary,
  type RoomSummary,
  type WorkspaceCollaborationSnapshot,
  type WorkspaceSummary,
} from "@haloai/contracts";
import { getDictionary } from "@/lib/i18n";
import { clearClientPortalSession } from "@/lib/portals";
import { usePortalSurface, useShellPreferences } from "@/lib/shell-preferences";
import { notify, notifyError } from "@/components/toast-host";
import { apiFetch } from "@/lib/api-client";
import { ConversationPanel } from "./workspace/conversation-panel";
import { DocumentPanel } from "./workspace/document-panel";
import { DocumentDialog } from "./workspace/document-dialog";
import { MemberDialog } from "./workspace/member-dialog";
import { MobileNavigation } from "./workspace/navigation";
import { RoomDialog } from "./workspace/room-dialog";
import { ProjectDialog } from "./workspace/project-dialog";
import type { DisplayMessage, DocumentTab, MobileView, WorkspaceSection } from "./workspace/types";
import { WorkspaceHub } from "./workspace/workspace-hub";
import { WorkspaceSidebar } from "./workspace/workspace-sidebar";
import { WorkspaceAnnouncementBanner } from "./workspace/workspace-announcement-banner";
import { useWorkspaceEntities } from "./workspace/use-workspace-entities";

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
  onAppendMessage,
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
  onAppendMessage?:
    | ((
        roomId: string,
        input: { content: string; clientMutationId: string },
      ) => Promise<RoomMessageSummary>)
    | undefined;
} = {}) {
  const router = useRouter();
  const canCreateProject = activeWorkspace?.role === "owner" || activeWorkspace?.role === "admin";
  const {
    locale,
    setLocale,
    theme,
    setTheme,
    collapsed: sidebarCollapsed,
    setCollapsed: setSidebarCollapsed,
    sidebarMotion,
  } = useShellPreferences();
  usePortalSurface("member");
  const [mobileView, setMobileView] = useState<MobileView>("chat");
  const [workspaceSection, setWorkspaceSection] = useState<WorkspaceSection>("room");
  const [documentTab, setDocumentTab] = useState<DocumentTab>("document");
  const [input, setInput] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const [memberDialogOpen, setMemberDialogOpen] = useState(false);
  const [newMemberKind, setNewMemberKind] = useState<"human" | "agent">("agent");
  const endOfMessagesRef = useRef<HTMLDivElement>(null);
  const dictionary = useMemo(() => getDictionary(locale), [locale]);
  const {
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
    setProjectDialogOpen,
    setRoomDialogOpen,
    setRooms,
  } = useWorkspaceEntities({
    collaboration,
    dictionary,
    locale,
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
  const roomTitle = activeRoom?.name ?? "";
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
   * 人类消息写入协作 API 后立即展示。Agent 运行尚未接入，禁止再请求本地演示模型。
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

  async function submitMessage(): Promise<void> {
    const trimmed = input.trim();
    if (trimmed.length === 0 || isStreaming) return;
    if (!onAppendMessage) {
      notify(dictionary.errorReply);
      return;
    }

    const roomId = activeRoomId;
    const authorName = identity?.name ?? dictionary.messageYou;
    const authorInitials =
      authorName
        .split(/\s+/u)
        .map((part) => part.slice(0, 1))
        .join("")
        .slice(0, 2)
        .toLocaleUpperCase() || "HA";
    const time = new Intl.DateTimeFormat(locale, { hour: "2-digit", minute: "2-digit" }).format(
      new Date(),
    );

    setIsStreaming(true);
    try {
      const persisted = await onAppendMessage(roomId, {
        content: trimmed,
        clientMutationId: crypto.randomUUID(),
      });
      const userMessage: DisplayMessage = {
        id: persisted.id,
        authorId: persisted.authorActorId,
        authorName,
        roleKey: "roleProductLead",
        body: trimmed,
        time,
        ai: false,
        color: "ink",
        initials: authorInitials,
      };
      updateRoomMessages(roomId, (current) =>
        current.some((item) => item.id === userMessage.id) ? current : [...current, userMessage],
      );
      setInput("");
    } catch {
      notify(dictionary.errorReply);
    } finally {
      setIsStreaming(false);
    }
  }

  function handleComposerKeyDown(event: KeyboardEvent<HTMLTextAreaElement>): void {
    if (event.key === "Enter" && !event.shiftKey && !event.nativeEvent.isComposing) {
      event.preventDefault();
      void submitMessage();
    }
  }

  async function handleAddMember(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    if (newMemberKind === "agent") {
      notify(dictionary.memberInvitePending);
      setMemberDialogOpen(false);
      return;
    }
    if (!activeWorkspace) {
      notifyError(dictionary.memberInviteFailed, "workspace-invite-missing");
      return;
    }
    const form = new FormData(event.currentTarget);
    const email = String(form.get("email") ?? "")
      .trim()
      .toLowerCase();
    const parsedRole = AssignableWorkspaceRoleSchema.safeParse(
      String(form.get("role") ?? "member"),
    );
    try {
      await apiFetch(`/v1/workspaces/${activeWorkspace.id}/invitations`, {
        method: "POST",
        body: JSON.stringify({
          email,
          role: parsedRole.success ? parsedRole.data : "member",
        }),
      });
      notify(dictionary.memberInvited);
      setMemberDialogOpen(false);
    } catch {
      notifyError(dictionary.memberInviteFailed, "workspace-invite-error");
    }
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
        onOpenMemberDialog={() => setMemberDialogOpen(true)}
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
        portal="member"
        onToggleLocale={toggleLocale}
        onToggleTheme={toggleTheme}
        collapsed={sidebarCollapsed}
        onToggleCollapsed={() => setSidebarCollapsed((current) => !current)}
      />
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          flex: 1,
          minWidth: 0,
          height: "100%",
          overflow: "hidden",
        }}
      >
        <WorkspaceAnnouncementBanner />
        <div style={{ display: "flex", flex: 1, minWidth: 0, height: "100%", overflow: "hidden" }}>
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
                onOpenMemberDialog={() => setMemberDialogOpen(true)}
                onNotify={notify}
              />
              <DocumentPanel
                dictionary={dictionary}
                tab={documentTab}
                onTabChange={setDocumentTab}
                onCloseMobile={() => setMobileView("chat")}
              />
            </>
          ) : (
            <WorkspaceHub
              dictionary={dictionary}
              section={workspaceSection}
              rooms={rooms}
              projects={projects}
              documents={documents}
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
        </div>
      </div>
      <MobileNavigation dictionary={dictionary} view={mobileView} onViewChange={changeMobileView} />

      {memberDialogOpen ? (
        <MemberDialog
          dictionary={dictionary}
          kind={newMemberKind}
          workspaceId={activeWorkspace?.id}
          onKindChange={setNewMemberKind}
          onClose={() => setMemberDialogOpen(false)}
          onSubmit={(event) => void handleAddMember(event)}
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
