/**
 * 核心领域类型只表达业务语义，不依赖 React、数据库或任何模型 SDK。
 * 跨网络边界的数据必须另外经过 `@haloai/contracts` 的运行时校验；静态类型不能替代校验。
 */

export type Id = string;
export type ISODateTime = string;
export type Locale = "zh-CN" | "en-US";

export type ActorKind = "human" | "agent" | "system";
export type ActorStatus = "active" | "suspended" | "archived";

/** Actor 只解决“谁做了这件事”，不携带访问角色或 AI 人设。 */
export interface Actor {
  id: Id;
  workspaceId: Id;
  kind: ActorKind;
  displayName: string;
  handle: string;
  avatarUrl?: string;
  status: ActorStatus;
  createdAt: ISODateTime;
}

export type BuiltInWorkspaceRole = "owner" | "admin" | "member" | "guest";
export type ProjectRole = "lead" | "contributor" | "reviewer" | "observer";
export type MembershipStatus = "invited" | "active" | "suspended" | "left";

/** Membership 只属于人类账号；AI 通过 AgentProfile 和资源授权加入房间。 */
export interface WorkspaceMembership {
  id: Id;
  workspaceId: Id;
  actorId: Id;
  status: MembershipStatus;
  builtInRole: BuiltInWorkspaceRole;
  customRoleIds: readonly Id[];
  joinedAt?: ISODateTime;
}

export interface ProjectMembership {
  workspaceId: Id;
  projectId: Id;
  actorId: Id;
  role: ProjectRole;
  status: "active" | "removed";
}

export type Capability =
  | "workspace.read"
  | "workspace.manage"
  | "workspace.security.manage"
  | "member.invite"
  | "member.manage"
  | "agent.profile.read"
  | "agent.profile.create"
  | "agent.profile.publish"
  | "agent.invoke"
  | "room.read"
  | "room.manage"
  | "room.message.create"
  | "document.read"
  | "document.edit"
  | "document.proposal.create"
  | "document.proposal.review"
  | "document.publish"
  | "integration.tool.read.execute"
  | "integration.tool.write.execute"
  | "approval.request"
  | "approval.review"
  | "audit.read";

export interface AgentBudget {
  maxInputTokens: number;
  maxOutputTokens: number;
  maxToolCalls: number;
  maxSteps: number;
  maxParticipants: number;
  maxDurationMs: number;
  maxCostMicros: number;
}

export type MemoryScope = "turn" | "actor" | "project" | "workspace";
export type AgentInitiative = "mentioned_only" | "coordinator_invited" | "scheduled";

/** AgentProfile 是稳定目录身份；执行行为必须来自已发布的 AgentVersion。 */
export interface AgentProfile {
  id: Id;
  workspaceId: Id;
  actorId: Id;
  name: string;
  summary: string;
  ownerActorId: Id;
  status: "draft" | "active" | "paused" | "archived";
  currentVersionId?: Id;
  createdAt: ISODateTime;
}

export interface AgentVersion {
  id: Id;
  workspaceId: Id;
  profileId: Id;
  version: number;
  responsibility: string;
  nonResponsibilities: readonly string[];
  instructions: string;
  expertise: readonly string[];
  modelPolicy: {
    provider: string;
    model: string;
    fallbackModel?: string;
    temperature?: number;
  };
  allowedToolIds: readonly Id[];
  grantedCapabilities: ReadonlySet<Capability>;
  memoryScopes: readonly MemoryScope[];
  initiative: AgentInitiative;
  coordinator: boolean;
  budget: AgentBudget;
  requiresApprovalFor: ReadonlySet<Capability>;
  policyVersion: string;
  contentDigest: string;
  publishedAt: ISODateTime;
}

export type CollaborationMode = "mention" | "facilitated" | "workflow" | "roundtable";
export type RoomStatus = "active" | "waiting" | "completed" | "archived";

export interface ProjectRoom {
  id: Id;
  workspaceId: Id;
  projectId: Id;
  name: string;
  goal: string;
  expectedArtifact: string;
  completionCriteria: readonly string[];
  mode: CollaborationMode;
  visibility: "workspace" | "private";
  status: RoomStatus;
  createdAt: ISODateTime;
}

export type MessageFormat = "plain" | "rich_text" | "system_fact" | "action_card";

/**
 * 已保存 Message 是不可变事实。编辑、撤回或擦除由独立记录表达，禁止覆盖原始责任链。
 */
export interface Message {
  id: Id;
  workspaceId: Id;
  roomId: Id;
  authorActorId: Id;
  content: string;
  format: MessageFormat;
  contentLanguage?: Locale;
  replyToMessageId?: Id;
  agentRunId?: Id;
  createdAt: ISODateTime;
}

export interface Mention {
  id: Id;
  workspaceId: Id;
  messageId: Id;
  targetActorId: Id;
  start: number;
  end: number;
}

export type DocumentStatus = "draft" | "in_review" | "approved" | "published" | "archived";

export interface CollaborativeDocument {
  id: Id;
  workspaceId: Id;
  projectId: Id;
  roomId?: Id;
  title: string;
  status: DocumentStatus;
  currentVersionId?: Id;
  ownerActorId: Id;
  updatedAt: ISODateTime;
}

export interface DocumentVersion {
  id: Id;
  workspaceId: Id;
  documentId: Id;
  version: number;
  contentDigest: string;
  createdByActorId: Id;
  cause: "manual_checkpoint" | "proposal_accepted" | "review_approved" | "published";
  createdAt: ISODateTime;
}

export type ProposalOperation =
  | { kind: "insert_after"; anchorNodeId: string; content: unknown }
  | { kind: "replace_node"; targetNodeId: string; content: unknown }
  | { kind: "delete_node"; targetNodeId: string };

export interface DocumentProposalItem {
  id: Id;
  operation: ProposalOperation;
  rationale: string;
  sourceIds: readonly Id[];
  status: "pending" | "accepted" | "rejected" | "conflicted";
}

export interface DocumentProposal {
  id: Id;
  workspaceId: Id;
  documentId: Id;
  baseVersionId: Id;
  baseContentDigest: string;
  proposedByActorId: Id;
  delegatedByActorId: Id;
  agentRunId: Id;
  agentVersionId: Id;
  items: readonly DocumentProposalItem[];
  status: "pending" | "partially_accepted" | "accepted" | "rejected" | "conflicted" | "expired";
  expiresAt: ISODateTime;
}

export type ApprovalStatus = "pending" | "approved" | "rejected" | "expired" | "consumed";

export interface ApprovalRequest {
  id: Id;
  workspaceId: Id;
  requestedByActorId: Id;
  delegatedByActorId?: Id;
  capability: Capability;
  resourceType: string;
  resourceId: Id;
  argumentDigest: string;
  reason: string;
  status: ApprovalStatus;
  reviewedByActorId?: Id;
  expiresAt: ISODateTime;
  createdAt: ISODateTime;
}
