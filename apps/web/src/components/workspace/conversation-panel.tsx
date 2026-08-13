import {
  AtSign,
  CirclePlus,
  FileText,
  Hash,
  Menu,
  MoreHorizontal,
  PanelRight,
  Paperclip,
  Send,
  UserRoundPlus,
} from "lucide-react";
import type { KeyboardEventHandler, RefObject } from "react";
import { Avatar } from "./primitives";
import type { DisplayMessage, Participant, WorkspaceViewProps } from "./types";

interface ConversationPanelProps extends WorkspaceViewProps {
  roomTitle: string;
  roomGoal: string;
  memberSummary: string;
  participants: readonly Participant[];
  messages: readonly DisplayMessage[];
  input: string;
  isStreaming: boolean;
  endOfMessagesRef: RefObject<HTMLDivElement | null>;
  onInputChange: (value: string) => void;
  onComposerKeyDown: KeyboardEventHandler<HTMLTextAreaElement>;
  onSubmit: () => void;
  onOpenRooms: () => void;
  onOpenDocument: () => void;
  onOpenMemberDialog: () => void;
  onNotify: (message: string) => void;
  chatEnabled: boolean;
}

export function ConversationPanel({
  dictionary,
  roomTitle,
  roomGoal,
  memberSummary,
  participants,
  messages,
  input,
  isStreaming,
  endOfMessagesRef,
  onInputChange,
  onComposerKeyDown,
  onSubmit,
  onOpenRooms,
  onOpenDocument,
  onOpenMemberDialog,
  onNotify,
  chatEnabled,
}: ConversationPanelProps) {
  return (
    <main className="conversation-panel">
      <header className="conversation-header">
        <div className="room-title-block">
          <button
            type="button"
            className="icon-button mobile-only"
            onClick={onOpenRooms}
            aria-label={dictionary.rooms}
          >
            <Menu size={20} />
          </button>
          <div className="room-symbol">
            <Hash size={18} />
          </div>
          <div>
            <div className="room-title-line">
              <h1>{roomTitle}</h1>
              {chatEnabled ? (
                <span className="room-mode">
                  <AtSign size={12} /> {dictionary.mentionMode}
                </span>
              ) : null}
            </div>
            {roomGoal.length > 0 ? <p>{roomGoal}</p> : null}
          </div>
        </div>

        <div className="header-actions">
          <div className="participant-stack" aria-label={memberSummary}>
            {participants.slice(0, 4).map((participant) => (
              <Avatar
                key={participant.id}
                initials={participant.initials}
                color={participant.color}
                ai={participant.kind === "agent"}
                size="small"
              />
            ))}
          </div>
          <button
            type="button"
            className="icon-button"
            aria-label={dictionary.addTeammate}
            onClick={onOpenMemberDialog}
          >
            <UserRoundPlus size={18} />
          </button>
          <button
            type="button"
            className="icon-button desktop-document-toggle"
            aria-label={dictionary.viewDocument}
            onClick={onOpenDocument}
          >
            <PanelRight size={18} />
          </button>
          <button
            type="button"
            className="icon-button"
            aria-label={dictionary.moreActions}
            onClick={() => onNotify(dictionary.moreActionsPreview)}
          >
            <MoreHorizontal size={19} />
          </button>
        </div>
      </header>

      <section className="message-timeline" aria-label={dictionary.chat}>
        <div className="date-separator">
          <span>{dictionary.today}</span>
        </div>
        {messages.length === 0 ? (
          <div className="conversation-empty">
            <p>{chatEnabled ? dictionary.conversationEmpty : dictionary.chatPending}</p>
          </div>
        ) : null}
        {messages.map((message) => {
          const author =
            message.nameKey === undefined
              ? (message.authorName ?? "Halo")
              : dictionary[message.nameKey];
          const body =
            message.bodyKey === undefined ? (message.body ?? "") : dictionary[message.bodyKey];
          return (
            <article className={`message ${message.ai ? "is-ai" : "is-human"}`} key={message.id}>
              <Avatar initials={message.initials} color={message.color} ai={message.ai} />
              <div className="message-content">
                <div className="message-meta">
                  <strong>{author}</strong>
                  <span className="role-label">{dictionary[message.roleKey]}</span>
                  {message.ai ? <span className="ai-label">AI</span> : null}
                  <time>{message.time}</time>
                </div>
                <div className={`message-bubble ${message.pending === true ? "is-pending" : ""}`}>
                  {body.length === 0 && message.pending === true ? (
                    <span className="typing-state" role="status">
                      <i />
                      <i />
                      <i /> {dictionary.thinking}
                    </span>
                  ) : (
                    <p>{body}</p>
                  )}
                </div>
                {message.authorId === "muse" ? (
                  <button type="button" className="artifact-link" onClick={onOpenDocument}>
                    <FileText size={15} />
                    <span>{dictionary.documentSubtitle}</span>
                    <span className="artifact-version">v3</span>
                  </button>
                ) : null}
              </div>
            </article>
          );
        })}
        <div ref={endOfMessagesRef} />
      </section>

      <footer className="composer-wrap">
        <div className="composer">
          <textarea
            value={input}
            disabled={!chatEnabled}
            onChange={(event) => onInputChange(event.target.value)}
            onKeyDown={onComposerKeyDown}
            placeholder={chatEnabled ? dictionary.messagePlaceholder : dictionary.chatPending}
            rows={1}
            aria-label={dictionary.messagePlaceholder}
          />
          <div className="composer-toolbar">
            <div>
              <button
                type="button"
                className="composer-tool"
                aria-label={dictionary.addAttachment}
                title={dictionary.addAttachment}
                onClick={() => onNotify(dictionary.attachmentPreview)}
                disabled={!chatEnabled}
              >
                <Paperclip size={18} />
              </button>
              <button
                type="button"
                className="composer-tool"
                aria-label={dictionary.mentionSomeone}
                title={dictionary.mentionSomeone}
                onClick={() => onInputChange(`${input}@halo `)}
                disabled={!chatEnabled}
              >
                <AtSign size={18} />
              </button>
              <button
                type="button"
                className="composer-tool"
                aria-label={dictionary.moreActions}
                title={dictionary.moreActions}
                onClick={() => onNotify(dictionary.moreActionsPreview)}
                disabled={!chatEnabled}
              >
                <CirclePlus size={18} />
              </button>
              <span className="composer-hint">{dictionary.messageHint}</span>
            </div>
            <button
              type="button"
              className="send-button"
              onClick={onSubmit}
              disabled={!chatEnabled || input.trim().length === 0 || isStreaming}
            >
              <span>{dictionary.send}</span>
              <Send size={16} />
            </button>
          </div>
        </div>
      </footer>
    </main>
  );
}
