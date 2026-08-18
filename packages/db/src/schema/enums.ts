import { pgEnum } from "drizzle-orm/pg-core";

export const workspaceStatus = pgEnum("workspace_status", ["active", "suspended", "archived"]);

export const systemAdministratorStatus = pgEnum("system_administrator_status", [
  "active",
  "suspended",
]);
export const platformModelStatus = pgEnum("platform_model_status", ["active", "disabled"]);
export const platformModelApiFormat = pgEnum("platform_model_api_format", [
  "openai_chat_completions",
  "openai_responses",
  "anthropic_messages",
  "google_generate_content",
]);
export const modelAllocationStatus = pgEnum("model_allocation_status", ["active", "revoked"]);

export const userStatus = pgEnum("user_status", ["active", "suspended", "deleted"]);
export const actorKind = pgEnum("actor_kind", ["human", "agent", "system"]);
export const actorStatus = pgEnum("actor_status", ["active", "suspended", "archived"]);
export const membershipStatus = pgEnum("membership_status", [
  "invited",
  "active",
  "suspended",
  "left",
]);

export const roleStatus = pgEnum("access_role_status", ["active", "archived"]);
export const grantEffect = pgEnum("grant_effect", ["allow", "deny"]);
export const grantScope = pgEnum("grant_scope", ["workspace", "project", "room", "resource"]);
export const grantStatus = pgEnum("grant_status", ["active", "revoked", "expired"]);

export const projectStatus = pgEnum("project_status", ["active", "completed", "archived"]);
export const projectRole = pgEnum("project_role", ["lead", "contributor", "reviewer", "observer"]);
export const roomStatus = pgEnum("room_status", ["active", "waiting", "completed", "archived"]);
export const roomVisibility = pgEnum("room_visibility", ["workspace", "private"]);
export const collaborationMode = pgEnum("collaboration_mode", [
  "mention",
  "facilitated",
  "workflow",
  "roundtable",
]);
export const messageKind = pgEnum("message_kind", [
  "text",
  "rich_text",
  "system",
  "agent_response",
  "action_card",
]);
export const messageStatus = pgEnum("message_status", ["complete", "partial", "tombstoned"]);

export const agentProfileStatus = pgEnum("agent_profile_status", ["draft", "active", "archived"]);
export const agentVersionStatus = pgEnum("agent_version_status", ["draft", "published", "retired"]);
export const toolCapabilityStatus = pgEnum("tool_capability_status", [
  "draft",
  "active",
  "disabled",
  "retired",
]);
export const toolTransport = pgEnum("tool_transport", ["native", "mcp"]);
export const toolEffectClass = pgEnum("tool_effect_class", [
  "read",
  "internal_write",
  "external_write",
  "destructive",
  "financial",
  "permission_change",
  "publish",
]);
export const riskClass = pgEnum("risk_class", ["low", "medium", "high", "critical"]);

export const runStatus = pgEnum("agent_run_status", [
  "created",
  "queued",
  "preparing",
  "running",
  "streaming",
  "waiting_input",
  "waiting_approval",
  "paused",
  "cancelling",
  "completing",
  "completed",
  "failed",
  "cancelled",
  "expired",
]);
export const eventDurability = pgEnum("event_durability", ["durable", "transient"]);
export const runStepKind = pgEnum("run_step_kind", [
  "context",
  "model",
  "tool",
  "approval",
  "document",
  "memory",
  "synthesis",
]);
export const runStepStatus = pgEnum("run_step_status", [
  "queued",
  "running",
  "waiting",
  "succeeded",
  "failed",
  "skipped",
  "cancelled",
]);
export const toolCallStatus = pgEnum("tool_call_status", [
  "requested",
  "waiting_approval",
  "running",
  "succeeded",
  "failed",
  "denied",
  "cancelled",
  "timed_out",
  "uncertain",
]);
export const externalEffectStatus = pgEnum("external_effect_status", [
  "prepared",
  "dispatched",
  "confirmed",
  "uncertain",
  "compensated",
  "cancelled",
]);
export const contextTrustClass = pgEnum("context_trust_class", [
  "server_instruction",
  "authorized_content",
  "untrusted_content",
]);
export const runMessageRole = pgEnum("run_message_role", ["trigger", "input", "output", "partial"]);

export const documentStatus = pgEnum("document_status", ["active", "archived", "deleted"]);
export const documentSnapshotKind = pgEnum("document_snapshot_kind", [
  "working",
  "checkpoint",
  "version",
  "proposal",
]);
export const documentUpdateOrigin = pgEnum("document_update_origin", [
  "human",
  "agent",
  "system",
  "proposal",
]);
export const documentVersionCause = pgEnum("document_version_cause", [
  "manual",
  "proposal",
  "publish",
  "restore",
  "import",
]);
export const proposalStatus = pgEnum("document_proposal_status", [
  "draft",
  "pending_review",
  "accepted",
  "partially_accepted",
  "rejected",
  "stale",
  "expired",
  "applying",
  "applied",
  "apply_failed",
]);
export const proposalOperationType = pgEnum("proposal_operation_type", [
  "append_section",
  "replace_section",
  "insert_comment",
  "suggest_title",
  "add_summary",
]);
export const proposalOperationStatus = pgEnum("proposal_operation_status", [
  "pending",
  "accepted",
  "rejected",
  "applied",
  "failed",
  "conflicted",
]);

export const approvalStatus = pgEnum("approval_status", [
  "pending",
  "approved",
  "rejected",
  "expired",
  "consumed",
  "cancelled",
]);
export const policyDecision = pgEnum("policy_decision", [
  "allow",
  "deny",
  "require_approval",
  "not_applicable",
]);
export const auditOutcome = pgEnum("audit_outcome", ["succeeded", "failed", "denied", "cancelled"]);
export const usageLedgerEntryType = pgEnum("usage_ledger_entry_type", [
  "reservation",
  "settlement",
  "release",
  "adjustment",
]);
export const usageDirection = pgEnum("usage_direction", ["debit", "credit"]);
export const usageUnit = pgEnum("usage_unit", [
  "input_tokens",
  "output_tokens",
  "cost_minor",
  "duration_ms",
  "tool_calls",
]);
export const outboxStatus = pgEnum("outbox_status", [
  "pending",
  "processing",
  "published",
  "failed",
  "dead_letter",
]);
