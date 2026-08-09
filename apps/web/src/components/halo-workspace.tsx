"use client";

import { Check } from "lucide-react";
import { type FormEvent, type KeyboardEvent, useEffect, useMemo, useRef, useState } from "react";
import { z } from "zod";
import { getDictionary, type Locale } from "@/lib/i18n";
import { ConversationPanel } from "./workspace/conversation-panel";
import { demoMessages, demoParticipants } from "./workspace/demo-data";
import { DocumentPanel } from "./workspace/document-panel";
import { MemberDialog } from "./workspace/member-dialog";
import { MobileNavigation, UtilityRail } from "./workspace/navigation";
import type {
  DisplayMessage,
  DocumentTab,
  MobileView,
  Participant,
  RoleKey,
  Theme,
} from "./workspace/types";
import { WorkspaceSidebar } from "./workspace/workspace-sidebar";

const streamEventSchema = z.object({
  type: z.string().min(1),
  sequence: z.number().int().positive().optional(),
  delta: z.string().optional(),
  code: z.string().optional(),
});

export function HaloWorkspace() {
  const [locale, setLocale] = useState<Locale>("zh-CN");
  const [theme, setTheme] = useState<Theme>("light");
  const [mobileView, setMobileView] = useState<MobileView>("chat");
  const [documentTab, setDocumentTab] = useState<DocumentTab>("document");
  const [messages, setMessages] = useState<DisplayMessage[]>(demoMessages);
  const [participants, setParticipants] = useState<Participant[]>(demoParticipants);
  const [input, setInput] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const [memberDialogOpen, setMemberDialogOpen] = useState(false);
  const [newMemberKind, setNewMemberKind] = useState<"human" | "agent">("agent");
  const [suggestionApplied, setSuggestionApplied] = useState(false);
  const [documentDirty, setDocumentDirty] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const endOfMessagesRef = useRef<HTMLDivElement>(null);
  const dictionary = useMemo(() => getDictionary(locale), [locale]);

  useEffect(() => {
    const savedLocale = window.localStorage.getItem("haloai.locale");
    const savedTheme = window.localStorage.getItem("haloai.theme");
    if (savedLocale === "zh-CN" || savedLocale === "en-US") setLocale(savedLocale);
    if (savedTheme === "light" || savedTheme === "dark") {
      setTheme(savedTheme);
    } else if (window.matchMedia("(prefers-color-scheme: dark)").matches) {
      setTheme("dark");
    }
  }, []);

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    document.documentElement.lang = locale;
    window.localStorage.setItem("haloai.theme", theme);
    window.localStorage.setItem("haloai.locale", locale);
  }, [locale, theme]);

  useEffect(() => {
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    endOfMessagesRef.current?.scrollIntoView({
      behavior: reduceMotion ? "auto" : "smooth",
      block: "end",
    });
  }, [messages]);

  useEffect(() => {
    if (notice === null) return;
    const timer = window.setTimeout(() => setNotice(null), 2_600);
    return () => window.clearTimeout(timer);
  }, [notice]);

  useEffect(() => {
    if (!memberDialogOpen) return;
    const closeOnEscape = (event: globalThis.KeyboardEvent) => {
      if (event.key === "Escape") setMemberDialogOpen(false);
    };
    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, [memberDialogOpen]);

  const toggleLocale = () => setLocale((current) => (current === "zh-CN" ? "en-US" : "zh-CN"));
  const toggleTheme = () => setTheme((current) => (current === "light" ? "dark" : "light"));

  /**
   * Foundation Demo 仍按正式 SSE 信封消费事件：校验 JSON、去重序号并拒绝事件缺口。
   * 正式客户端遇到缺口会携带 Last-Event-ID 重连；当前无持久服务，因此直接显示可重试错误。
   */
  async function streamAgentReply(message: string): Promise<void> {
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

    setMessages((current) => [...current, pendingReply]);
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
            setMessages((current) =>
              current.map((item) =>
                item.id === replyId ? { ...item, body: `${item.body ?? ""}${event.delta}` } : item,
              ),
            );
          }
          if (event.type === "run.failed") throw new Error(event.code ?? "RUN_FAILED");
        }
      }

      setMessages((current) =>
        current.map((item) => (item.id === replyId ? { ...item, pending: false } : item)),
      );
    } catch {
      setMessages((current) =>
        current.map((item) =>
          item.id === replyId
            ? { ...item, body: dictionary.errorReply, pending: false }
            : item,
        ),
      );
    } finally {
      setIsStreaming(false);
    }
  }

  async function submitMessage(): Promise<void> {
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
    setMessages((current) => [...current, userMessage]);
    setInput("");
    await streamAgentReply(trimmed);
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
    setNotice(dictionary.teammateAdded);
  }

  return (
    <div className={`halo-shell view-${mobileView}`} id="workspace">
      <WorkspaceSidebar dictionary={dictionary} onOpenChat={() => setMobileView("chat")} />
      <ConversationPanel
        dictionary={dictionary}
        participants={participants}
        messages={messages}
        input={input}
        isStreaming={isStreaming}
        endOfMessagesRef={endOfMessagesRef}
        onInputChange={setInput}
        onComposerKeyDown={handleComposerKeyDown}
        onSubmit={() => void submitMessage()}
        onOpenRooms={() => setMobileView("rooms")}
        onOpenDocument={() => setMobileView("document")}
        onOpenMemberDialog={() => setMemberDialogOpen(true)}
      />
      <DocumentPanel
        dictionary={dictionary}
        tab={documentTab}
        dirty={documentDirty}
        suggestionApplied={suggestionApplied}
        onTabChange={setDocumentTab}
        onDirtyChange={setDocumentDirty}
        onApplySuggestion={() => {
          setSuggestionApplied(true);
          setDocumentDirty(true);
        }}
        onCloseMobile={() => setMobileView("chat")}
      />
      <UtilityRail
        dictionary={dictionary}
        locale={locale}
        theme={theme}
        onToggleLocale={toggleLocale}
        onToggleTheme={toggleTheme}
      />
      <MobileNavigation dictionary={dictionary} view={mobileView} onViewChange={setMobileView} />

      {memberDialogOpen ? (
        <MemberDialog
          dictionary={dictionary}
          kind={newMemberKind}
          onKindChange={setNewMemberKind}
          onClose={() => setMemberDialogOpen(false)}
          onSubmit={handleAddMember}
        />
      ) : null}

      {notice === null ? null : (
        <div className="toast" role="status">
          <Check size={16} /> {notice}
        </div>
      )}
    </div>
  );
}
