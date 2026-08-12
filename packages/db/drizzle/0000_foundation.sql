CREATE TYPE "public"."actor_kind" AS ENUM('human', 'agent', 'system');--> statement-breakpoint
CREATE TYPE "public"."actor_status" AS ENUM('active', 'suspended', 'archived');--> statement-breakpoint
CREATE TYPE "public"."agent_profile_status" AS ENUM('draft', 'active', 'archived');--> statement-breakpoint
CREATE TYPE "public"."agent_version_status" AS ENUM('draft', 'published', 'retired');--> statement-breakpoint
CREATE TYPE "public"."approval_status" AS ENUM('pending', 'approved', 'rejected', 'expired', 'consumed', 'cancelled');--> statement-breakpoint
CREATE TYPE "public"."audit_outcome" AS ENUM('succeeded', 'failed', 'denied', 'cancelled');--> statement-breakpoint
CREATE TYPE "public"."collaboration_mode" AS ENUM('mention', 'facilitated', 'workflow', 'roundtable');--> statement-breakpoint
CREATE TYPE "public"."context_trust_class" AS ENUM('server_instruction', 'authorized_content', 'untrusted_content');--> statement-breakpoint
CREATE TYPE "public"."document_snapshot_kind" AS ENUM('working', 'checkpoint', 'version', 'proposal');--> statement-breakpoint
CREATE TYPE "public"."document_status" AS ENUM('active', 'archived', 'deleted');--> statement-breakpoint
CREATE TYPE "public"."document_update_origin" AS ENUM('human', 'agent', 'system', 'proposal');--> statement-breakpoint
CREATE TYPE "public"."document_version_cause" AS ENUM('manual', 'proposal', 'publish', 'restore', 'import');--> statement-breakpoint
CREATE TYPE "public"."event_durability" AS ENUM('durable', 'transient');--> statement-breakpoint
CREATE TYPE "public"."external_effect_status" AS ENUM('prepared', 'dispatched', 'confirmed', 'uncertain', 'compensated', 'cancelled');--> statement-breakpoint
CREATE TYPE "public"."grant_effect" AS ENUM('allow', 'deny');--> statement-breakpoint
CREATE TYPE "public"."grant_scope" AS ENUM('workspace', 'project', 'room', 'resource');--> statement-breakpoint
CREATE TYPE "public"."grant_status" AS ENUM('active', 'revoked', 'expired');--> statement-breakpoint
CREATE TYPE "public"."membership_status" AS ENUM('invited', 'active', 'suspended', 'left');--> statement-breakpoint
CREATE TYPE "public"."message_kind" AS ENUM('text', 'rich_text', 'system', 'agent_response', 'action_card');--> statement-breakpoint
CREATE TYPE "public"."message_status" AS ENUM('complete', 'partial', 'tombstoned');--> statement-breakpoint
CREATE TYPE "public"."outbox_status" AS ENUM('pending', 'processing', 'published', 'failed', 'dead_letter');--> statement-breakpoint
CREATE TYPE "public"."policy_decision" AS ENUM('allow', 'deny', 'require_approval', 'not_applicable');--> statement-breakpoint
CREATE TYPE "public"."project_status" AS ENUM('active', 'completed', 'archived');--> statement-breakpoint
CREATE TYPE "public"."proposal_operation_status" AS ENUM('pending', 'accepted', 'rejected', 'applied', 'failed', 'conflicted');--> statement-breakpoint
CREATE TYPE "public"."proposal_operation_type" AS ENUM('append_section', 'replace_section', 'insert_comment', 'suggest_title', 'add_summary');--> statement-breakpoint
CREATE TYPE "public"."document_proposal_status" AS ENUM('draft', 'pending_review', 'accepted', 'partially_accepted', 'rejected', 'stale', 'expired', 'applying', 'applied', 'apply_failed');--> statement-breakpoint
CREATE TYPE "public"."risk_class" AS ENUM('low', 'medium', 'high', 'critical');--> statement-breakpoint
CREATE TYPE "public"."access_role_status" AS ENUM('active', 'archived');--> statement-breakpoint
CREATE TYPE "public"."room_status" AS ENUM('active', 'waiting', 'completed', 'archived');--> statement-breakpoint
CREATE TYPE "public"."room_visibility" AS ENUM('workspace', 'private');--> statement-breakpoint
CREATE TYPE "public"."run_message_role" AS ENUM('trigger', 'input', 'output', 'partial');--> statement-breakpoint
CREATE TYPE "public"."agent_run_status" AS ENUM('created', 'queued', 'preparing', 'running', 'streaming', 'waiting_input', 'waiting_approval', 'paused', 'cancelling', 'completing', 'completed', 'failed', 'cancelled', 'expired');--> statement-breakpoint
CREATE TYPE "public"."run_step_kind" AS ENUM('context', 'model', 'tool', 'approval', 'document', 'memory', 'synthesis');--> statement-breakpoint
CREATE TYPE "public"."run_step_status" AS ENUM('queued', 'running', 'waiting', 'succeeded', 'failed', 'skipped', 'cancelled');--> statement-breakpoint
CREATE TYPE "public"."tool_call_status" AS ENUM('requested', 'waiting_approval', 'running', 'succeeded', 'failed', 'denied', 'cancelled', 'timed_out', 'uncertain');--> statement-breakpoint
CREATE TYPE "public"."tool_capability_status" AS ENUM('draft', 'active', 'disabled', 'retired');--> statement-breakpoint
CREATE TYPE "public"."tool_effect_class" AS ENUM('read', 'internal_write', 'external_write', 'destructive', 'financial', 'permission_change', 'publish');--> statement-breakpoint
CREATE TYPE "public"."tool_transport" AS ENUM('native', 'mcp');--> statement-breakpoint
CREATE TYPE "public"."usage_direction" AS ENUM('debit', 'credit');--> statement-breakpoint
CREATE TYPE "public"."usage_ledger_entry_type" AS ENUM('reservation', 'settlement', 'release', 'adjustment');--> statement-breakpoint
CREATE TYPE "public"."usage_unit" AS ENUM('input_tokens', 'output_tokens', 'cost_minor', 'duration_ms', 'tool_calls');--> statement-breakpoint
CREATE TYPE "public"."user_status" AS ENUM('active', 'suspended', 'deleted');--> statement-breakpoint
CREATE TYPE "public"."workspace_status" AS ENUM('active', 'suspended', 'archived');--> statement-breakpoint
CREATE TABLE "agent_actors" (
	"actor_id" uuid PRIMARY KEY NOT NULL,
	"workspace_id" uuid NOT NULL,
	"agent_profile_id" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "agent_actors" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "agent_profiles" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"workspace_id" uuid NOT NULL,
	"handle" varchar(128) NOT NULL,
	"name" text NOT NULL,
	"summary" text DEFAULT '' NOT NULL,
	"visual_identity" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"owner_actor_id" uuid NOT NULL,
	"status" "agent_profile_status" DEFAULT 'draft' NOT NULL,
	"archived_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "agent_profiles" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "agent_version_capability_grants" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"workspace_id" uuid NOT NULL,
	"agent_version_id" uuid NOT NULL,
	"capability_key" varchar(160) NOT NULL,
	"effect" "grant_effect" NOT NULL,
	"constraints" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"created_by_actor_id" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "agent_version_capability_grants" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "agent_version_tool_grants" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"workspace_id" uuid NOT NULL,
	"agent_version_id" uuid NOT NULL,
	"tool_capability_id" uuid NOT NULL,
	"constraints" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"max_calls_per_run" integer,
	"created_by_actor_id" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "agent_version_tool_grants_max_calls_check" CHECK ("agent_version_tool_grants"."max_calls_per_run" is null or "agent_version_tool_grants"."max_calls_per_run" > 0)
);
--> statement-breakpoint
ALTER TABLE "agent_version_tool_grants" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "agent_versions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"workspace_id" uuid NOT NULL,
	"agent_profile_id" uuid NOT NULL,
	"version_number" integer NOT NULL,
	"status" "agent_version_status" DEFAULT 'draft' NOT NULL,
	"responsibility" text DEFAULT '' NOT NULL,
	"non_responsibilities" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"instruction_document_ref" text NOT NULL,
	"instruction_digest" text NOT NULL,
	"model_policy" jsonb NOT NULL,
	"fallback_policy" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"output_contract" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"knowledge_selectors" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"collaboration_policy" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"budget_policy" jsonb NOT NULL,
	"policy_version" text NOT NULL,
	"schema_version" integer DEFAULT 1 NOT NULL,
	"content_digest" text NOT NULL,
	"created_by_actor_id" uuid NOT NULL,
	"published_by_actor_id" uuid,
	"published_at" timestamp with time zone,
	"retired_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "agent_versions_number_positive_check" CHECK ("agent_versions"."version_number" > 0),
	CONSTRAINT "agent_versions_publish_fields_check" CHECK ((("agent_versions"."status" = 'draft' and "agent_versions"."published_at" is null and "agent_versions"."published_by_actor_id" is null) or ("agent_versions"."status" in ('published', 'retired') and "agent_versions"."published_at" is not null and "agent_versions"."published_by_actor_id" is not null)))
);
--> statement-breakpoint
ALTER TABLE "agent_versions" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "tool_capabilities" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"workspace_id" uuid NOT NULL,
	"key" varchar(160) NOT NULL,
	"version_number" integer NOT NULL,
	"name" text NOT NULL,
	"description" text DEFAULT '' NOT NULL,
	"status" "tool_capability_status" DEFAULT 'draft' NOT NULL,
	"transport" "tool_transport" NOT NULL,
	"adapter_key" varchar(160) NOT NULL,
	"input_schema" jsonb NOT NULL,
	"output_schema" jsonb NOT NULL,
	"schema_digest" text NOT NULL,
	"effect_class" "tool_effect_class" NOT NULL,
	"risk" "risk_class" NOT NULL,
	"credential_policy_ref" text,
	"network_policy" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"approval_policy" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"max_duration_ms" integer NOT NULL,
	"max_response_bytes" integer NOT NULL,
	"created_by_actor_id" uuid NOT NULL,
	"activated_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "tool_capabilities_limits_check" CHECK ("tool_capabilities"."version_number" > 0 and "tool_capabilities"."max_duration_ms" > 0 and "tool_capabilities"."max_response_bytes" > 0)
);
--> statement-breakpoint
ALTER TABLE "tool_capabilities" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "access_roles" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"workspace_id" uuid NOT NULL,
	"key" varchar(128) NOT NULL,
	"name" text NOT NULL,
	"description" text DEFAULT '' NOT NULL,
	"status" "access_role_status" DEFAULT 'active' NOT NULL,
	"built_in" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "access_roles" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "actor_role_assignments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"workspace_id" uuid NOT NULL,
	"actor_id" uuid NOT NULL,
	"role_id" uuid NOT NULL,
	"scope" "grant_scope" NOT NULL,
	"scope_id" uuid NOT NULL,
	"status" "grant_status" DEFAULT 'active' NOT NULL,
	"granted_by_actor_id" uuid NOT NULL,
	"valid_from" timestamp with time zone DEFAULT now() NOT NULL,
	"expires_at" timestamp with time zone,
	"revoked_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "actor_role_assignments_workspace_scope_check" CHECK ("actor_role_assignments"."scope" <> 'workspace' or "actor_role_assignments"."scope_id" = "actor_role_assignments"."workspace_id"),
	CONSTRAINT "actor_role_assignments_expiry_check" CHECK ("actor_role_assignments"."expires_at" is null or "actor_role_assignments"."expires_at" > "actor_role_assignments"."valid_from")
);
--> statement-breakpoint
ALTER TABLE "actor_role_assignments" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "capabilities" (
	"key" varchar(160) PRIMARY KEY NOT NULL,
	"description_key" text NOT NULL,
	"risk" "risk_class" DEFAULT 'low' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "resource_grants" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"workspace_id" uuid NOT NULL,
	"actor_id" uuid,
	"role_id" uuid,
	"resource_type" varchar(96) NOT NULL,
	"resource_id" uuid NOT NULL,
	"capability_key" varchar(160) NOT NULL,
	"effect" "grant_effect" NOT NULL,
	"status" "grant_status" DEFAULT 'active' NOT NULL,
	"conditions" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"granted_by_actor_id" uuid NOT NULL,
	"expires_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "resource_grants_one_subject_check" CHECK (num_nonnulls("resource_grants"."actor_id", "resource_grants"."role_id") = 1)
);
--> statement-breakpoint
ALTER TABLE "resource_grants" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "role_capability_grants" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"workspace_id" uuid NOT NULL,
	"role_id" uuid NOT NULL,
	"capability_key" varchar(160) NOT NULL,
	"effect" "grant_effect" NOT NULL,
	"constraints" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"granted_by_actor_id" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "role_capability_grants" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "mentions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"workspace_id" uuid NOT NULL,
	"message_id" uuid NOT NULL,
	"target_actor_id" uuid NOT NULL,
	"semantic_node_id" varchar(160) NOT NULL,
	"range_start" integer,
	"range_end" integer,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "mentions_range_check" CHECK ((("mentions"."range_start" is null and "mentions"."range_end" is null) or ("mentions"."range_start" >= 0 and "mentions"."range_end" > "mentions"."range_start")))
);
--> statement-breakpoint
ALTER TABLE "mentions" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "message_revisions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"workspace_id" uuid NOT NULL,
	"message_id" uuid NOT NULL,
	"revision_number" integer NOT NULL,
	"edited_by_actor_id" uuid NOT NULL,
	"parts" jsonb NOT NULL,
	"content_digest" text NOT NULL,
	"reason" text DEFAULT '' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "message_revisions_number_positive_check" CHECK ("message_revisions"."revision_number" > 0)
);
--> statement-breakpoint
ALTER TABLE "message_revisions" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "message_tombstones" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"workspace_id" uuid NOT NULL,
	"message_id" uuid NOT NULL,
	"tombstoned_by_actor_id" uuid NOT NULL,
	"reason_code" varchar(96) NOT NULL,
	"erasure_job_reference" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "message_tombstones" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "messages" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"workspace_id" uuid NOT NULL,
	"room_id" uuid NOT NULL,
	"author_actor_id" uuid NOT NULL,
	"sequence" bigint NOT NULL,
	"client_mutation_id" uuid NOT NULL,
	"reply_to_message_id" uuid,
	"thread_root_id" uuid,
	"kind" "message_kind" DEFAULT 'text' NOT NULL,
	"status" "message_status" DEFAULT 'complete' NOT NULL,
	"parts" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"content_digest" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "messages_sequence_positive_check" CHECK ("messages"."sequence" > 0)
);
--> statement-breakpoint
ALTER TABLE "messages" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "project_memberships" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"workspace_id" uuid NOT NULL,
	"project_id" uuid NOT NULL,
	"actor_id" uuid NOT NULL,
	"status" "membership_status" DEFAULT 'active' NOT NULL,
	"added_by_actor_id" uuid NOT NULL,
	"joined_at" timestamp with time zone DEFAULT now() NOT NULL,
	"left_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "project_memberships" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "projects" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"workspace_id" uuid NOT NULL,
	"name" text NOT NULL,
	"description" text DEFAULT '' NOT NULL,
	"goal" text DEFAULT '' NOT NULL,
	"expected_artifact" text DEFAULT '' NOT NULL,
	"completion_criteria" text DEFAULT '' NOT NULL,
	"status" "project_status" DEFAULT 'active' NOT NULL,
	"created_by_actor_id" uuid NOT NULL,
	"archived_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "projects" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "room_memberships" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"workspace_id" uuid NOT NULL,
	"room_id" uuid NOT NULL,
	"actor_id" uuid NOT NULL,
	"status" "membership_status" DEFAULT 'active' NOT NULL,
	"added_by_actor_id" uuid NOT NULL,
	"muted" boolean DEFAULT false NOT NULL,
	"last_read_sequence" bigint DEFAULT 0 NOT NULL,
	"joined_at" timestamp with time zone DEFAULT now() NOT NULL,
	"left_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "room_memberships_last_read_check" CHECK ("room_memberships"."last_read_sequence" >= 0)
);
--> statement-breakpoint
ALTER TABLE "room_memberships" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "rooms" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"workspace_id" uuid NOT NULL,
	"project_id" uuid NOT NULL,
	"name" text NOT NULL,
	"goal" text DEFAULT '' NOT NULL,
	"expected_artifact" text DEFAULT '' NOT NULL,
	"completion_criteria" text DEFAULT '' NOT NULL,
	"visibility" "room_visibility" DEFAULT 'private' NOT NULL,
	"status" "room_status" DEFAULT 'active' NOT NULL,
	"collaboration_mode" "collaboration_mode" DEFAULT 'mention' NOT NULL,
	"created_by_actor_id" uuid NOT NULL,
	"last_sequence" bigint DEFAULT 0 NOT NULL,
	"archived_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "rooms_last_sequence_check" CHECK ("rooms"."last_sequence" >= 0)
);
--> statement-breakpoint
ALTER TABLE "rooms" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "document_proposals" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"workspace_id" uuid NOT NULL,
	"document_id" uuid NOT NULL,
	"proposal_version" integer DEFAULT 1 NOT NULL,
	"base_version_id" uuid NOT NULL,
	"base_content_digest" text NOT NULL,
	"base_state_vector" "bytea",
	"agent_actor_id" uuid NOT NULL,
	"agent_version_id" uuid NOT NULL,
	"delegated_by_actor_id" uuid NOT NULL,
	"run_id" uuid NOT NULL,
	"status" "document_proposal_status" DEFAULT 'draft' NOT NULL,
	"rationale_summary" text DEFAULT '' NOT NULL,
	"citations" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"policy_decision" "policy_decision" NOT NULL,
	"policy_version" text NOT NULL,
	"idempotency_key" varchar(200) NOT NULL,
	"expires_at" timestamp with time zone,
	"reviewed_by_actor_id" uuid,
	"reviewed_at" timestamp with time zone,
	"applied_snapshot_id" uuid,
	"applied_version_id" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "document_proposals_values_check" CHECK ("document_proposals"."proposal_version" > 0 and ("document_proposals"."expires_at" is null or "document_proposals"."expires_at" > "document_proposals"."created_at") and ("document_proposals"."reviewed_by_actor_id" is null or "document_proposals"."reviewed_by_actor_id" <> "document_proposals"."agent_actor_id"))
);
--> statement-breakpoint
ALTER TABLE "document_proposals" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "proposal_operations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"workspace_id" uuid NOT NULL,
	"proposal_id" uuid NOT NULL,
	"ordinal" integer NOT NULL,
	"type" "proposal_operation_type" NOT NULL,
	"target_node_id" varchar(200),
	"operation" jsonb NOT NULL,
	"operation_digest" text NOT NULL,
	"rationale_summary" text DEFAULT '' NOT NULL,
	"citations" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"status" "proposal_operation_status" DEFAULT 'pending' NOT NULL,
	"decided_by_actor_id" uuid,
	"decided_at" timestamp with time zone,
	"applied_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "proposal_operations_ordinal_check" CHECK ("proposal_operations"."ordinal" >= 0)
);
--> statement-breakpoint
ALTER TABLE "proposal_operations" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "document_versions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"workspace_id" uuid NOT NULL,
	"document_id" uuid NOT NULL,
	"version_number" integer NOT NULL,
	"name" text DEFAULT '' NOT NULL,
	"cause" "document_version_cause" NOT NULL,
	"snapshot_id" uuid NOT NULL,
	"content_digest" text NOT NULL,
	"rich_text_projection_ref" text,
	"plain_text_digest" text,
	"created_by_actor_id" uuid NOT NULL,
	"run_id" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "document_versions_number_positive_check" CHECK ("document_versions"."version_number" > 0)
);
--> statement-breakpoint
ALTER TABLE "document_versions" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "documents" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"workspace_id" uuid NOT NULL,
	"project_id" uuid NOT NULL,
	"room_id" uuid,
	"owner_actor_id" uuid NOT NULL,
	"title" text NOT NULL,
	"status" "document_status" DEFAULT 'active' NOT NULL,
	"document_schema_version" integer DEFAULT 1 NOT NULL,
	"archived_at" timestamp with time zone,
	"deleted_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "documents_schema_version_check" CHECK ("documents"."document_schema_version" > 0)
);
--> statement-breakpoint
ALTER TABLE "documents" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "yjs_snapshots" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"workspace_id" uuid NOT NULL,
	"document_id" uuid NOT NULL,
	"snapshot_sequence" bigint NOT NULL,
	"last_update_sequence" bigint NOT NULL,
	"kind" "document_snapshot_kind" NOT NULL,
	"state" "bytea" NOT NULL,
	"state_vector" "bytea" NOT NULL,
	"state_digest" text NOT NULL,
	"document_schema_version" integer NOT NULL,
	"created_by_actor_id" uuid NOT NULL,
	"run_id" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "yjs_snapshots_values_check" CHECK ("yjs_snapshots"."snapshot_sequence" > 0 and "yjs_snapshots"."last_update_sequence" >= 0 and "yjs_snapshots"."document_schema_version" > 0 and octet_length("yjs_snapshots"."state") between 1 and 20971520)
);
--> statement-breakpoint
ALTER TABLE "yjs_snapshots" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "yjs_updates" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"workspace_id" uuid NOT NULL,
	"document_id" uuid NOT NULL,
	"sequence" bigint NOT NULL,
	"update" "bytea" NOT NULL,
	"update_digest" text NOT NULL,
	"actor_id" uuid NOT NULL,
	"origin" "document_update_origin" NOT NULL,
	"client_mutation_id" uuid,
	"run_id" uuid,
	"transaction_origin" varchar(160) NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "yjs_updates_size_sequence_check" CHECK ("yjs_updates"."sequence" > 0 and octet_length("yjs_updates"."update") between 1 and 1048576)
);
--> statement-breakpoint
ALTER TABLE "yjs_updates" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "approvals" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"workspace_id" uuid NOT NULL,
	"project_id" uuid,
	"requested_by_actor_id" uuid NOT NULL,
	"delegated_by_actor_id" uuid,
	"reviewed_by_actor_id" uuid,
	"agent_version_id" uuid,
	"run_id" uuid,
	"tool_capability_id" uuid,
	"tool_call_id" uuid,
	"document_proposal_id" uuid,
	"capability_key" varchar(160),
	"operation_type" varchar(120) NOT NULL,
	"argument_digest" text NOT NULL,
	"operation_summary" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"affected_resources" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"risk" "risk_class" NOT NULL,
	"risk_explanation" text DEFAULT '' NOT NULL,
	"status" "approval_status" DEFAULT 'pending' NOT NULL,
	"policy_version" text NOT NULL,
	"idempotency_key" varchar(200) NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"decision_comment" text,
	"decided_at" timestamp with time zone,
	"consumed_at" timestamp with time zone,
	"cancelled_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "approvals_expiry_check" CHECK ("approvals"."expires_at" > "approvals"."created_at"),
	CONSTRAINT "approvals_separation_check" CHECK ("approvals"."reviewed_by_actor_id" is null or "approvals"."reviewed_by_actor_id" <> "approvals"."requested_by_actor_id"),
	CONSTRAINT "approvals_decision_fields_check" CHECK ((("approvals"."status" = 'pending' and "approvals"."decided_at" is null and "approvals"."reviewed_by_actor_id" is null) or ("approvals"."status" <> 'pending' and ("approvals"."status" in ('expired', 'cancelled') or ("approvals"."decided_at" is not null and "approvals"."reviewed_by_actor_id" is not null))))),
	CONSTRAINT "approvals_consumed_fields_check" CHECK ((("approvals"."status" = 'consumed') = ("approvals"."consumed_at" is not null)))
);
--> statement-breakpoint
ALTER TABLE "approvals" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "audit_events" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"workspace_id" uuid NOT NULL,
	"effective_principal_actor_id" uuid,
	"on_behalf_of_actor_id" uuid,
	"workspace_membership_id" uuid,
	"approval_id" uuid,
	"run_id" uuid,
	"agent_version_id" uuid,
	"tool_call_id" uuid,
	"session_id" text,
	"trace_id" uuid NOT NULL,
	"action" varchar(160) NOT NULL,
	"resource_type" varchar(96) NOT NULL,
	"resource_id" text NOT NULL,
	"decision" "policy_decision" NOT NULL,
	"policy_version" text NOT NULL,
	"obligations" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"request_summary_hash" text,
	"before_hash" text,
	"after_hash" text,
	"outcome" "audit_outcome" NOT NULL,
	"reason_code" varchar(120),
	"error_code" varchar(120),
	"source_ip" "inet",
	"user_agent" text,
	"sanitized_metadata" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"occurred_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "audit_events" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "usage_ledger_entries" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"workspace_id" uuid NOT NULL,
	"project_id" uuid,
	"run_id" uuid,
	"actor_id" uuid,
	"agent_version_id" uuid,
	"tool_call_id" uuid,
	"reservation_entry_id" uuid,
	"entry_type" "usage_ledger_entry_type" NOT NULL,
	"direction" "usage_direction" NOT NULL,
	"unit" "usage_unit" NOT NULL,
	"quantity" bigint NOT NULL,
	"monetary_amount_minor" bigint,
	"currency" varchar(3),
	"provider" varchar(120),
	"model" varchar(160),
	"idempotency_key" varchar(200) NOT NULL,
	"occurred_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "usage_ledger_quantity_check" CHECK ("usage_ledger_entries"."quantity" >= 0),
	CONSTRAINT "usage_ledger_currency_check" CHECK ((("usage_ledger_entries"."monetary_amount_minor" is null and "usage_ledger_entries"."currency" is null) or ("usage_ledger_entries"."monetary_amount_minor" is not null and "usage_ledger_entries"."monetary_amount_minor" >= 0 and "usage_ledger_entries"."currency" is not null))),
	CONSTRAINT "usage_ledger_reservation_link_check" CHECK ((("usage_ledger_entries"."entry_type" = 'reservation' and "usage_ledger_entries"."reservation_entry_id" is null) or ("usage_ledger_entries"."entry_type" in ('settlement', 'release') and "usage_ledger_entries"."reservation_entry_id" is not null) or "usage_ledger_entries"."entry_type" = 'adjustment'))
);
--> statement-breakpoint
ALTER TABLE "usage_ledger_entries" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "actors" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"workspace_id" uuid NOT NULL,
	"kind" "actor_kind" NOT NULL,
	"status" "actor_status" DEFAULT 'active' NOT NULL,
	"display_name" text NOT NULL,
	"handle" varchar(128) NOT NULL,
	"avatar_reference" text,
	"archived_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "actors" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "human_actors" (
	"actor_id" uuid PRIMARY KEY NOT NULL,
	"workspace_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "human_actors" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"primary_email" text NOT NULL,
	"email_verified_at" timestamp with time zone,
	"preferred_locale" varchar(32) DEFAULT 'zh-CN' NOT NULL,
	"time_zone" varchar(64) DEFAULT 'UTC' NOT NULL,
	"status" "user_status" DEFAULT 'active' NOT NULL,
	"deleted_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "users" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "workspace_memberships" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"workspace_id" uuid NOT NULL,
	"human_actor_id" uuid NOT NULL,
	"status" "membership_status" DEFAULT 'invited' NOT NULL,
	"is_owner" boolean DEFAULT false NOT NULL,
	"invited_by_actor_id" uuid,
	"joined_at" timestamp with time zone,
	"suspended_at" timestamp with time zone,
	"left_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "workspace_memberships_owner_active_check" CHECK (not "workspace_memberships"."is_owner" or "workspace_memberships"."status" = 'active')
);
--> statement-breakpoint
ALTER TABLE "workspace_memberships" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "workspaces" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"slug" varchar(128) NOT NULL,
	"name" text NOT NULL,
	"status" "workspace_status" DEFAULT 'active' NOT NULL,
	"default_locale" varchar(32) DEFAULT 'zh-CN' NOT NULL,
	"time_zone" varchar(64) DEFAULT 'UTC' NOT NULL,
	"retention_policy_version" text DEFAULT 'v1' NOT NULL,
	"created_by_user_id" uuid NOT NULL,
	"archived_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "workspaces" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "outbox_events" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"workspace_id" uuid NOT NULL,
	"event_id" uuid DEFAULT gen_random_uuid() NOT NULL,
	"aggregate_type" varchar(96) NOT NULL,
	"aggregate_id" text NOT NULL,
	"event_type" varchar(160) NOT NULL,
	"schema_version" integer DEFAULT 1 NOT NULL,
	"payload" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"status" "outbox_status" DEFAULT 'pending' NOT NULL,
	"attempts" integer DEFAULT 0 NOT NULL,
	"idempotency_key" varchar(200) NOT NULL,
	"available_at" timestamp with time zone DEFAULT now() NOT NULL,
	"lease_owner" text,
	"lease_expires_at" timestamp with time zone,
	"published_at" timestamp with time zone,
	"last_error_code" varchar(120),
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "outbox_events_values_check" CHECK ("outbox_events"."schema_version" > 0 and "outbox_events"."attempts" >= 0),
	CONSTRAINT "outbox_events_publish_check" CHECK ((("outbox_events"."status" = 'published' and "outbox_events"."published_at" is not null) or ("outbox_events"."status" <> 'published' and "outbox_events"."published_at" is null)))
);
--> statement-breakpoint
ALTER TABLE "outbox_events" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "agent_runs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"workspace_id" uuid NOT NULL,
	"project_id" uuid NOT NULL,
	"room_id" uuid NOT NULL,
	"agent_actor_id" uuid NOT NULL,
	"agent_version_id" uuid NOT NULL,
	"delegated_by_actor_id" uuid NOT NULL,
	"parent_run_id" uuid,
	"trigger_message_id" uuid,
	"idempotency_key" varchar(200) NOT NULL,
	"purpose" text DEFAULT '' NOT NULL,
	"status" "agent_run_status" DEFAULT 'created' NOT NULL,
	"state_version" integer DEFAULT 0 NOT NULL,
	"attempt" integer DEFAULT 0 NOT NULL,
	"authorization_snapshot_ref" text NOT NULL,
	"authorization_snapshot_digest" text NOT NULL,
	"policy_version" text NOT NULL,
	"budget_policy_version" text NOT NULL,
	"budget_policy" jsonb NOT NULL,
	"budget_reservation_key" varchar(200) NOT NULL,
	"consumed_input_tokens" bigint DEFAULT 0 NOT NULL,
	"consumed_output_tokens" bigint DEFAULT 0 NOT NULL,
	"consumed_cost_minor" bigint DEFAULT 0 NOT NULL,
	"completed_turns" integer DEFAULT 0 NOT NULL,
	"completed_tool_calls" integer DEFAULT 0 NOT NULL,
	"participant_count" integer DEFAULT 1 NOT NULL,
	"deadline_at" timestamp with time zone NOT NULL,
	"lease_owner" text,
	"lease_expires_at" timestamp with time zone,
	"heartbeat_at" timestamp with time zone,
	"cancel_requested_at" timestamp with time zone,
	"started_at" timestamp with time zone,
	"ended_at" timestamp with time zone,
	"result_summary" text,
	"terminal_reason_code" varchar(120),
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "agent_runs_counters_nonnegative_check" CHECK ("agent_runs"."state_version" >= 0 and "agent_runs"."attempt" >= 0 and "agent_runs"."consumed_input_tokens" >= 0 and "agent_runs"."consumed_output_tokens" >= 0 and "agent_runs"."consumed_cost_minor" >= 0 and "agent_runs"."completed_turns" >= 0 and "agent_runs"."completed_tool_calls" >= 0 and "agent_runs"."participant_count" > 0)
);
--> statement-breakpoint
ALTER TABLE "agent_runs" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "run_events" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"workspace_id" uuid NOT NULL,
	"run_id" uuid NOT NULL,
	"stream_id" uuid NOT NULL,
	"sequence" bigint NOT NULL,
	"type" varchar(160) NOT NULL,
	"payload_version" integer DEFAULT 1 NOT NULL,
	"payload" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"durability" "event_durability" DEFAULT 'durable' NOT NULL,
	"actor_id" uuid NOT NULL,
	"correlation_id" uuid NOT NULL,
	"causation_id" uuid,
	"attempt" integer DEFAULT 0 NOT NULL,
	"occurred_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "run_events_sequence_version_check" CHECK ("run_events"."sequence" > 0 and "run_events"."payload_version" > 0 and "run_events"."attempt" >= 0)
);
--> statement-breakpoint
ALTER TABLE "run_events" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "run_messages" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"workspace_id" uuid NOT NULL,
	"run_id" uuid NOT NULL,
	"message_id" uuid NOT NULL,
	"role" "run_message_role" NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "run_messages" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "run_steps" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"workspace_id" uuid NOT NULL,
	"run_id" uuid NOT NULL,
	"sequence" integer NOT NULL,
	"kind" "run_step_kind" NOT NULL,
	"status" "run_step_status" DEFAULT 'queued' NOT NULL,
	"attempt" integer DEFAULT 0 NOT NULL,
	"idempotency_key" varchar(200) NOT NULL,
	"input_digest" text,
	"output_digest" text,
	"observable_summary" text DEFAULT '' NOT NULL,
	"error_code" varchar(120),
	"started_at" timestamp with time zone,
	"ended_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "run_steps_sequence_attempt_check" CHECK ("run_steps"."sequence" > 0 and "run_steps"."attempt" >= 0)
);
--> statement-breakpoint
ALTER TABLE "run_steps" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "context_manifest_items" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"workspace_id" uuid NOT NULL,
	"manifest_id" uuid NOT NULL,
	"ordinal" integer NOT NULL,
	"kind" varchar(96) NOT NULL,
	"resource_type" varchar(96) NOT NULL,
	"resource_id" text NOT NULL,
	"resource_version" text,
	"content_digest" text NOT NULL,
	"token_estimate" integer NOT NULL,
	"trust_class" "context_trust_class" NOT NULL,
	"decision" "policy_decision" NOT NULL,
	"decision_reason_code" varchar(120) NOT NULL,
	"included" boolean NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "context_manifest_items_values_check" CHECK ("context_manifest_items"."ordinal" >= 0 and "context_manifest_items"."token_estimate" >= 0)
);
--> statement-breakpoint
ALTER TABLE "context_manifest_items" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "context_manifests" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"workspace_id" uuid NOT NULL,
	"run_id" uuid NOT NULL,
	"step_id" uuid,
	"policy_version" text NOT NULL,
	"manifest_digest" text NOT NULL,
	"total_item_count" integer NOT NULL,
	"included_item_count" integer NOT NULL,
	"truncated_item_count" integer DEFAULT 0 NOT NULL,
	"token_estimate" integer NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "context_manifests_counts_check" CHECK ("context_manifests"."total_item_count" >= 0 and "context_manifests"."included_item_count" >= 0 and "context_manifests"."truncated_item_count" >= 0 and "context_manifests"."token_estimate" >= 0 and "context_manifests"."included_item_count" <= "context_manifests"."total_item_count")
);
--> statement-breakpoint
ALTER TABLE "context_manifests" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "tool_calls" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"workspace_id" uuid NOT NULL,
	"run_id" uuid NOT NULL,
	"step_id" uuid NOT NULL,
	"tool_capability_id" uuid NOT NULL,
	"tool_version_number" integer NOT NULL,
	"schema_digest" text NOT NULL,
	"execution_principal_actor_id" uuid NOT NULL,
	"status" "tool_call_status" DEFAULT 'requested' NOT NULL,
	"risk" "risk_class" NOT NULL,
	"argument_digest" text NOT NULL,
	"argument_summary" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"credential_binding_ref" text,
	"network_policy_version" text,
	"idempotency_key" varchar(200) NOT NULL,
	"external_idempotency_key" varchar(200),
	"result_digest" text,
	"result_classification" varchar(96),
	"duration_ms" integer,
	"usage_summary" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"error_code" varchar(120),
	"requested_at" timestamp with time zone DEFAULT now() NOT NULL,
	"started_at" timestamp with time zone,
	"ended_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "tool_calls_values_check" CHECK ("tool_calls"."tool_version_number" > 0 and ("tool_calls"."duration_ms" is null or "tool_calls"."duration_ms" >= 0))
);
--> statement-breakpoint
ALTER TABLE "tool_calls" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "tool_effects" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"workspace_id" uuid NOT NULL,
	"tool_call_id" uuid NOT NULL,
	"status" "external_effect_status" DEFAULT 'prepared' NOT NULL,
	"external_idempotency_key" varchar(200) NOT NULL,
	"request_digest" text NOT NULL,
	"result_digest" text,
	"dispatched_at" timestamp with time zone,
	"confirmed_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "tool_effects" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE UNIQUE INDEX "agent_actors_workspace_actor_unique" ON "agent_actors" USING btree ("workspace_id","actor_id");--> statement-breakpoint
CREATE UNIQUE INDEX "agent_actors_workspace_profile_unique" ON "agent_actors" USING btree ("workspace_id","agent_profile_id");--> statement-breakpoint
CREATE UNIQUE INDEX "agent_profiles_workspace_id_unique" ON "agent_profiles" USING btree ("workspace_id","id");--> statement-breakpoint
CREATE UNIQUE INDEX "agent_profiles_workspace_handle_unique" ON "agent_profiles" USING btree ("workspace_id","handle");--> statement-breakpoint
CREATE INDEX "agent_profiles_workspace_status_idx" ON "agent_profiles" USING btree ("workspace_id","status");--> statement-breakpoint
CREATE UNIQUE INDEX "agent_version_cap_grants_workspace_id_unique" ON "agent_version_capability_grants" USING btree ("workspace_id","id");--> statement-breakpoint
CREATE UNIQUE INDEX "agent_version_cap_grants_cap_unique" ON "agent_version_capability_grants" USING btree ("workspace_id","agent_version_id","capability_key");--> statement-breakpoint
CREATE UNIQUE INDEX "agent_version_tool_grants_workspace_id_unique" ON "agent_version_tool_grants" USING btree ("workspace_id","id");--> statement-breakpoint
CREATE UNIQUE INDEX "agent_version_tool_grants_tool_unique" ON "agent_version_tool_grants" USING btree ("workspace_id","agent_version_id","tool_capability_id");--> statement-breakpoint
CREATE UNIQUE INDEX "agent_versions_workspace_id_unique" ON "agent_versions" USING btree ("workspace_id","id");--> statement-breakpoint
CREATE UNIQUE INDEX "agent_versions_profile_number_unique" ON "agent_versions" USING btree ("workspace_id","agent_profile_id","version_number");--> statement-breakpoint
CREATE INDEX "agent_versions_profile_status_idx" ON "agent_versions" USING btree ("workspace_id","agent_profile_id","status");--> statement-breakpoint
CREATE UNIQUE INDEX "tool_capabilities_workspace_id_unique" ON "tool_capabilities" USING btree ("workspace_id","id");--> statement-breakpoint
CREATE UNIQUE INDEX "tool_capabilities_key_version_unique" ON "tool_capabilities" USING btree ("workspace_id","key","version_number");--> statement-breakpoint
CREATE INDEX "tool_capabilities_status_idx" ON "tool_capabilities" USING btree ("workspace_id","status","transport");--> statement-breakpoint
CREATE UNIQUE INDEX "access_roles_workspace_id_unique" ON "access_roles" USING btree ("workspace_id","id");--> statement-breakpoint
CREATE UNIQUE INDEX "access_roles_workspace_key_unique" ON "access_roles" USING btree ("workspace_id","key");--> statement-breakpoint
CREATE INDEX "access_roles_workspace_status_idx" ON "access_roles" USING btree ("workspace_id","status");--> statement-breakpoint
CREATE UNIQUE INDEX "actor_role_assignments_workspace_id_unique" ON "actor_role_assignments" USING btree ("workspace_id","id");--> statement-breakpoint
CREATE UNIQUE INDEX "actor_role_assignments_scope_unique" ON "actor_role_assignments" USING btree ("workspace_id","actor_id","role_id","scope","scope_id");--> statement-breakpoint
CREATE INDEX "actor_role_assignments_lookup_idx" ON "actor_role_assignments" USING btree ("workspace_id","actor_id","status","scope");--> statement-breakpoint
CREATE INDEX "capabilities_risk_idx" ON "capabilities" USING btree ("risk");--> statement-breakpoint
CREATE UNIQUE INDEX "resource_grants_workspace_id_unique" ON "resource_grants" USING btree ("workspace_id","id");--> statement-breakpoint
CREATE UNIQUE INDEX "resource_grants_actor_unique" ON "resource_grants" USING btree ("workspace_id","actor_id","resource_type","resource_id","capability_key") WHERE "resource_grants"."actor_id" is not null;--> statement-breakpoint
CREATE UNIQUE INDEX "resource_grants_role_unique" ON "resource_grants" USING btree ("workspace_id","role_id","resource_type","resource_id","capability_key") WHERE "resource_grants"."role_id" is not null;--> statement-breakpoint
CREATE INDEX "resource_grants_resource_idx" ON "resource_grants" USING btree ("workspace_id","resource_type","resource_id","status");--> statement-breakpoint
CREATE UNIQUE INDEX "role_capability_grants_workspace_id_unique" ON "role_capability_grants" USING btree ("workspace_id","id");--> statement-breakpoint
CREATE UNIQUE INDEX "role_capability_grants_role_cap_unique" ON "role_capability_grants" USING btree ("workspace_id","role_id","capability_key");--> statement-breakpoint
CREATE UNIQUE INDEX "mentions_workspace_id_unique" ON "mentions" USING btree ("workspace_id","id");--> statement-breakpoint
CREATE UNIQUE INDEX "mentions_semantic_node_unique" ON "mentions" USING btree ("workspace_id","message_id","target_actor_id","semantic_node_id");--> statement-breakpoint
CREATE INDEX "mentions_target_idx" ON "mentions" USING btree ("workspace_id","target_actor_id","created_at");--> statement-breakpoint
CREATE UNIQUE INDEX "message_revisions_workspace_id_unique" ON "message_revisions" USING btree ("workspace_id","id");--> statement-breakpoint
CREATE UNIQUE INDEX "message_revisions_number_unique" ON "message_revisions" USING btree ("workspace_id","message_id","revision_number");--> statement-breakpoint
CREATE UNIQUE INDEX "message_tombstones_workspace_id_unique" ON "message_tombstones" USING btree ("workspace_id","id");--> statement-breakpoint
CREATE UNIQUE INDEX "message_tombstones_message_unique" ON "message_tombstones" USING btree ("workspace_id","message_id");--> statement-breakpoint
CREATE UNIQUE INDEX "messages_workspace_id_unique" ON "messages" USING btree ("workspace_id","id");--> statement-breakpoint
CREATE UNIQUE INDEX "messages_workspace_room_id_unique" ON "messages" USING btree ("workspace_id","room_id","id");--> statement-breakpoint
CREATE UNIQUE INDEX "messages_room_sequence_unique" ON "messages" USING btree ("workspace_id","room_id","sequence");--> statement-breakpoint
CREATE UNIQUE INDEX "messages_client_mutation_unique" ON "messages" USING btree ("workspace_id","room_id","author_actor_id","client_mutation_id");--> statement-breakpoint
CREATE INDEX "messages_room_time_idx" ON "messages" USING btree ("workspace_id","room_id","created_at");--> statement-breakpoint
CREATE UNIQUE INDEX "project_memberships_workspace_id_unique" ON "project_memberships" USING btree ("workspace_id","id");--> statement-breakpoint
CREATE UNIQUE INDEX "project_memberships_actor_unique" ON "project_memberships" USING btree ("workspace_id","project_id","actor_id");--> statement-breakpoint
CREATE INDEX "project_memberships_lookup_idx" ON "project_memberships" USING btree ("workspace_id","project_id","status");--> statement-breakpoint
CREATE UNIQUE INDEX "projects_workspace_id_unique" ON "projects" USING btree ("workspace_id","id");--> statement-breakpoint
CREATE INDEX "projects_workspace_status_idx" ON "projects" USING btree ("workspace_id","status");--> statement-breakpoint
CREATE UNIQUE INDEX "room_memberships_workspace_id_unique" ON "room_memberships" USING btree ("workspace_id","id");--> statement-breakpoint
CREATE UNIQUE INDEX "room_memberships_actor_unique" ON "room_memberships" USING btree ("workspace_id","room_id","actor_id");--> statement-breakpoint
CREATE INDEX "room_memberships_lookup_idx" ON "room_memberships" USING btree ("workspace_id","room_id","status");--> statement-breakpoint
CREATE UNIQUE INDEX "rooms_workspace_id_unique" ON "rooms" USING btree ("workspace_id","id");--> statement-breakpoint
CREATE UNIQUE INDEX "rooms_workspace_project_id_unique" ON "rooms" USING btree ("workspace_id","project_id","id");--> statement-breakpoint
CREATE INDEX "rooms_project_status_idx" ON "rooms" USING btree ("workspace_id","project_id","status");--> statement-breakpoint
CREATE UNIQUE INDEX "document_proposals_workspace_id_unique" ON "document_proposals" USING btree ("workspace_id","id");--> statement-breakpoint
CREATE UNIQUE INDEX "document_proposals_workspace_document_id_unique" ON "document_proposals" USING btree ("workspace_id","document_id","id");--> statement-breakpoint
CREATE UNIQUE INDEX "document_proposals_idempotency_unique" ON "document_proposals" USING btree ("workspace_id","idempotency_key");--> statement-breakpoint
CREATE INDEX "document_proposals_review_idx" ON "document_proposals" USING btree ("workspace_id","document_id","status","created_at");--> statement-breakpoint
CREATE UNIQUE INDEX "proposal_operations_workspace_id_unique" ON "proposal_operations" USING btree ("workspace_id","id");--> statement-breakpoint
CREATE UNIQUE INDEX "proposal_operations_ordinal_unique" ON "proposal_operations" USING btree ("workspace_id","proposal_id","ordinal");--> statement-breakpoint
CREATE INDEX "proposal_operations_status_idx" ON "proposal_operations" USING btree ("workspace_id","proposal_id","status");--> statement-breakpoint
CREATE UNIQUE INDEX "document_versions_workspace_id_unique" ON "document_versions" USING btree ("workspace_id","id");--> statement-breakpoint
CREATE UNIQUE INDEX "document_versions_workspace_document_id_unique" ON "document_versions" USING btree ("workspace_id","document_id","id");--> statement-breakpoint
CREATE UNIQUE INDEX "document_versions_number_unique" ON "document_versions" USING btree ("workspace_id","document_id","version_number");--> statement-breakpoint
CREATE UNIQUE INDEX "documents_workspace_id_unique" ON "documents" USING btree ("workspace_id","id");--> statement-breakpoint
CREATE UNIQUE INDEX "documents_workspace_project_id_unique" ON "documents" USING btree ("workspace_id","project_id","id");--> statement-breakpoint
CREATE INDEX "documents_project_status_idx" ON "documents" USING btree ("workspace_id","project_id","status");--> statement-breakpoint
CREATE UNIQUE INDEX "yjs_snapshots_workspace_id_unique" ON "yjs_snapshots" USING btree ("workspace_id","id");--> statement-breakpoint
CREATE UNIQUE INDEX "yjs_snapshots_workspace_document_id_unique" ON "yjs_snapshots" USING btree ("workspace_id","document_id","id");--> statement-breakpoint
CREATE UNIQUE INDEX "yjs_snapshots_document_sequence_unique" ON "yjs_snapshots" USING btree ("workspace_id","document_id","snapshot_sequence");--> statement-breakpoint
CREATE INDEX "yjs_snapshots_latest_idx" ON "yjs_snapshots" USING btree ("workspace_id","document_id","snapshot_sequence");--> statement-breakpoint
CREATE UNIQUE INDEX "yjs_updates_workspace_id_unique" ON "yjs_updates" USING btree ("workspace_id","id");--> statement-breakpoint
CREATE UNIQUE INDEX "yjs_updates_document_sequence_unique" ON "yjs_updates" USING btree ("workspace_id","document_id","sequence");--> statement-breakpoint
CREATE UNIQUE INDEX "yjs_updates_client_mutation_unique" ON "yjs_updates" USING btree ("workspace_id","document_id","actor_id","client_mutation_id") WHERE "yjs_updates"."client_mutation_id" is not null;--> statement-breakpoint
CREATE INDEX "yjs_updates_document_time_idx" ON "yjs_updates" USING btree ("workspace_id","document_id","created_at");--> statement-breakpoint
CREATE UNIQUE INDEX "approvals_workspace_id_unique" ON "approvals" USING btree ("workspace_id","id");--> statement-breakpoint
CREATE UNIQUE INDEX "approvals_idempotency_unique" ON "approvals" USING btree ("workspace_id","idempotency_key");--> statement-breakpoint
CREATE UNIQUE INDEX "approvals_tool_call_unique" ON "approvals" USING btree ("workspace_id","tool_call_id") WHERE "approvals"."tool_call_id" is not null;--> statement-breakpoint
CREATE UNIQUE INDEX "approvals_document_proposal_unique" ON "approvals" USING btree ("workspace_id","document_proposal_id") WHERE "approvals"."document_proposal_id" is not null;--> statement-breakpoint
CREATE INDEX "approvals_pending_idx" ON "approvals" USING btree ("workspace_id","status","expires_at","created_at");--> statement-breakpoint
CREATE UNIQUE INDEX "audit_events_workspace_id_unique" ON "audit_events" USING btree ("workspace_id","id");--> statement-breakpoint
CREATE INDEX "audit_events_resource_idx" ON "audit_events" USING btree ("workspace_id","resource_type","resource_id","occurred_at");--> statement-breakpoint
CREATE INDEX "audit_events_trace_idx" ON "audit_events" USING btree ("workspace_id","trace_id","occurred_at");--> statement-breakpoint
CREATE INDEX "audit_events_actor_idx" ON "audit_events" USING btree ("workspace_id","effective_principal_actor_id","occurred_at");--> statement-breakpoint
CREATE UNIQUE INDEX "usage_ledger_workspace_id_unique" ON "usage_ledger_entries" USING btree ("workspace_id","id");--> statement-breakpoint
CREATE UNIQUE INDEX "usage_ledger_idempotency_unique" ON "usage_ledger_entries" USING btree ("workspace_id","idempotency_key");--> statement-breakpoint
CREATE INDEX "usage_ledger_run_idx" ON "usage_ledger_entries" USING btree ("workspace_id","run_id","occurred_at");--> statement-breakpoint
CREATE INDEX "usage_ledger_workspace_time_idx" ON "usage_ledger_entries" USING btree ("workspace_id","occurred_at");--> statement-breakpoint
CREATE UNIQUE INDEX "actors_workspace_id_unique" ON "actors" USING btree ("workspace_id","id");--> statement-breakpoint
CREATE UNIQUE INDEX "actors_workspace_handle_unique" ON "actors" USING btree ("workspace_id","handle");--> statement-breakpoint
CREATE INDEX "actors_workspace_kind_idx" ON "actors" USING btree ("workspace_id","kind","status");--> statement-breakpoint
CREATE UNIQUE INDEX "human_actors_workspace_actor_unique" ON "human_actors" USING btree ("workspace_id","actor_id");--> statement-breakpoint
CREATE UNIQUE INDEX "human_actors_workspace_user_unique" ON "human_actors" USING btree ("workspace_id","user_id");--> statement-breakpoint
CREATE UNIQUE INDEX "users_primary_email_unique" ON "users" USING btree ("primary_email");--> statement-breakpoint
CREATE UNIQUE INDEX "workspace_memberships_workspace_id_unique" ON "workspace_memberships" USING btree ("workspace_id","id");--> statement-breakpoint
CREATE UNIQUE INDEX "workspace_memberships_actor_unique" ON "workspace_memberships" USING btree ("workspace_id","human_actor_id");--> statement-breakpoint
CREATE INDEX "workspace_memberships_status_idx" ON "workspace_memberships" USING btree ("workspace_id","status");--> statement-breakpoint
CREATE UNIQUE INDEX "workspaces_slug_unique" ON "workspaces" USING btree ("slug");--> statement-breakpoint
CREATE UNIQUE INDEX "outbox_events_workspace_id_unique" ON "outbox_events" USING btree ("workspace_id","id");--> statement-breakpoint
CREATE UNIQUE INDEX "outbox_events_event_id_unique" ON "outbox_events" USING btree ("workspace_id","event_id");--> statement-breakpoint
CREATE UNIQUE INDEX "outbox_events_idempotency_unique" ON "outbox_events" USING btree ("workspace_id","idempotency_key");--> statement-breakpoint
CREATE INDEX "outbox_events_dispatch_idx" ON "outbox_events" USING btree ("status","available_at","lease_expires_at");--> statement-breakpoint
CREATE INDEX "outbox_events_aggregate_idx" ON "outbox_events" USING btree ("workspace_id","aggregate_type","aggregate_id","created_at");--> statement-breakpoint
CREATE UNIQUE INDEX "agent_runs_workspace_id_unique" ON "agent_runs" USING btree ("workspace_id","id");--> statement-breakpoint
CREATE UNIQUE INDEX "agent_runs_idempotency_unique" ON "agent_runs" USING btree ("workspace_id","idempotency_key");--> statement-breakpoint
CREATE INDEX "agent_runs_room_status_idx" ON "agent_runs" USING btree ("workspace_id","room_id","status","created_at");--> statement-breakpoint
CREATE INDEX "agent_runs_lease_idx" ON "agent_runs" USING btree ("status","lease_expires_at");--> statement-breakpoint
CREATE UNIQUE INDEX "run_events_workspace_id_unique" ON "run_events" USING btree ("workspace_id","id");--> statement-breakpoint
CREATE UNIQUE INDEX "run_events_run_sequence_unique" ON "run_events" USING btree ("workspace_id","run_id","sequence");--> statement-breakpoint
CREATE UNIQUE INDEX "run_events_stream_sequence_unique" ON "run_events" USING btree ("workspace_id","stream_id","sequence");--> statement-breakpoint
CREATE INDEX "run_events_replay_idx" ON "run_events" USING btree ("workspace_id","stream_id","sequence");--> statement-breakpoint
CREATE UNIQUE INDEX "run_messages_workspace_id_unique" ON "run_messages" USING btree ("workspace_id","id");--> statement-breakpoint
CREATE UNIQUE INDEX "run_messages_relation_unique" ON "run_messages" USING btree ("workspace_id","run_id","message_id","role");--> statement-breakpoint
CREATE UNIQUE INDEX "run_steps_workspace_id_unique" ON "run_steps" USING btree ("workspace_id","id");--> statement-breakpoint
CREATE UNIQUE INDEX "run_steps_run_sequence_unique" ON "run_steps" USING btree ("workspace_id","run_id","sequence");--> statement-breakpoint
CREATE UNIQUE INDEX "run_steps_idempotency_unique" ON "run_steps" USING btree ("workspace_id","run_id","idempotency_key");--> statement-breakpoint
CREATE INDEX "run_steps_status_idx" ON "run_steps" USING btree ("workspace_id","run_id","status");--> statement-breakpoint
CREATE UNIQUE INDEX "context_manifest_items_workspace_id_unique" ON "context_manifest_items" USING btree ("workspace_id","id");--> statement-breakpoint
CREATE UNIQUE INDEX "context_manifest_items_ordinal_unique" ON "context_manifest_items" USING btree ("workspace_id","manifest_id","ordinal");--> statement-breakpoint
CREATE UNIQUE INDEX "context_manifests_workspace_id_unique" ON "context_manifests" USING btree ("workspace_id","id");--> statement-breakpoint
CREATE INDEX "context_manifests_run_idx" ON "context_manifests" USING btree ("workspace_id","run_id","created_at");--> statement-breakpoint
CREATE UNIQUE INDEX "tool_calls_workspace_id_unique" ON "tool_calls" USING btree ("workspace_id","id");--> statement-breakpoint
CREATE UNIQUE INDEX "tool_calls_idempotency_unique" ON "tool_calls" USING btree ("workspace_id","idempotency_key");--> statement-breakpoint
CREATE INDEX "tool_calls_run_status_idx" ON "tool_calls" USING btree ("workspace_id","run_id","status");--> statement-breakpoint
CREATE UNIQUE INDEX "tool_effects_workspace_id_unique" ON "tool_effects" USING btree ("workspace_id","id");--> statement-breakpoint
CREATE UNIQUE INDEX "tool_effects_external_key_unique" ON "tool_effects" USING btree ("workspace_id","external_idempotency_key");--> statement-breakpoint
CREATE INDEX "tool_effects_status_idx" ON "tool_effects" USING btree ("workspace_id","status","updated_at");--> statement-breakpoint
ALTER TABLE "agent_actors" ADD CONSTRAINT "agent_actors_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "agent_actors" ADD CONSTRAINT "agent_actors_actor_fk" FOREIGN KEY ("workspace_id","actor_id") REFERENCES "public"."actors"("workspace_id","id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "agent_actors" ADD CONSTRAINT "agent_actors_profile_fk" FOREIGN KEY ("workspace_id","agent_profile_id") REFERENCES "public"."agent_profiles"("workspace_id","id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "agent_profiles" ADD CONSTRAINT "agent_profiles_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "agent_profiles" ADD CONSTRAINT "agent_profiles_owner_fk" FOREIGN KEY ("workspace_id","owner_actor_id") REFERENCES "public"."actors"("workspace_id","id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "agent_version_capability_grants" ADD CONSTRAINT "agent_version_capability_grants_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "agent_version_capability_grants" ADD CONSTRAINT "agent_version_capability_grants_capability_key_capabilities_key_fk" FOREIGN KEY ("capability_key") REFERENCES "public"."capabilities"("key") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "agent_version_capability_grants" ADD CONSTRAINT "agent_version_cap_grants_version_fk" FOREIGN KEY ("workspace_id","agent_version_id") REFERENCES "public"."agent_versions"("workspace_id","id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "agent_version_capability_grants" ADD CONSTRAINT "agent_version_cap_grants_creator_fk" FOREIGN KEY ("workspace_id","created_by_actor_id") REFERENCES "public"."actors"("workspace_id","id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "agent_version_tool_grants" ADD CONSTRAINT "agent_version_tool_grants_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "agent_version_tool_grants" ADD CONSTRAINT "agent_version_tool_grants_version_fk" FOREIGN KEY ("workspace_id","agent_version_id") REFERENCES "public"."agent_versions"("workspace_id","id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "agent_version_tool_grants" ADD CONSTRAINT "agent_version_tool_grants_tool_fk" FOREIGN KEY ("workspace_id","tool_capability_id") REFERENCES "public"."tool_capabilities"("workspace_id","id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "agent_version_tool_grants" ADD CONSTRAINT "agent_version_tool_grants_creator_fk" FOREIGN KEY ("workspace_id","created_by_actor_id") REFERENCES "public"."actors"("workspace_id","id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "agent_versions" ADD CONSTRAINT "agent_versions_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "agent_versions" ADD CONSTRAINT "agent_versions_profile_fk" FOREIGN KEY ("workspace_id","agent_profile_id") REFERENCES "public"."agent_profiles"("workspace_id","id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "agent_versions" ADD CONSTRAINT "agent_versions_creator_fk" FOREIGN KEY ("workspace_id","created_by_actor_id") REFERENCES "public"."actors"("workspace_id","id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "agent_versions" ADD CONSTRAINT "agent_versions_publisher_fk" FOREIGN KEY ("workspace_id","published_by_actor_id") REFERENCES "public"."actors"("workspace_id","id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tool_capabilities" ADD CONSTRAINT "tool_capabilities_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tool_capabilities" ADD CONSTRAINT "tool_capabilities_creator_fk" FOREIGN KEY ("workspace_id","created_by_actor_id") REFERENCES "public"."actors"("workspace_id","id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "access_roles" ADD CONSTRAINT "access_roles_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "actor_role_assignments" ADD CONSTRAINT "actor_role_assignments_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "actor_role_assignments" ADD CONSTRAINT "actor_role_assignments_actor_fk" FOREIGN KEY ("workspace_id","actor_id") REFERENCES "public"."actors"("workspace_id","id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "actor_role_assignments" ADD CONSTRAINT "actor_role_assignments_role_fk" FOREIGN KEY ("workspace_id","role_id") REFERENCES "public"."access_roles"("workspace_id","id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "actor_role_assignments" ADD CONSTRAINT "actor_role_assignments_granter_fk" FOREIGN KEY ("workspace_id","granted_by_actor_id") REFERENCES "public"."actors"("workspace_id","id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "resource_grants" ADD CONSTRAINT "resource_grants_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "resource_grants" ADD CONSTRAINT "resource_grants_capability_key_capabilities_key_fk" FOREIGN KEY ("capability_key") REFERENCES "public"."capabilities"("key") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "resource_grants" ADD CONSTRAINT "resource_grants_actor_fk" FOREIGN KEY ("workspace_id","actor_id") REFERENCES "public"."actors"("workspace_id","id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "resource_grants" ADD CONSTRAINT "resource_grants_role_fk" FOREIGN KEY ("workspace_id","role_id") REFERENCES "public"."access_roles"("workspace_id","id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "resource_grants" ADD CONSTRAINT "resource_grants_granter_fk" FOREIGN KEY ("workspace_id","granted_by_actor_id") REFERENCES "public"."actors"("workspace_id","id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "role_capability_grants" ADD CONSTRAINT "role_capability_grants_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "role_capability_grants" ADD CONSTRAINT "role_capability_grants_capability_key_capabilities_key_fk" FOREIGN KEY ("capability_key") REFERENCES "public"."capabilities"("key") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "role_capability_grants" ADD CONSTRAINT "role_capability_grants_role_fk" FOREIGN KEY ("workspace_id","role_id") REFERENCES "public"."access_roles"("workspace_id","id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "role_capability_grants" ADD CONSTRAINT "role_capability_grants_granter_fk" FOREIGN KEY ("workspace_id","granted_by_actor_id") REFERENCES "public"."actors"("workspace_id","id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "mentions" ADD CONSTRAINT "mentions_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "mentions" ADD CONSTRAINT "mentions_message_fk" FOREIGN KEY ("workspace_id","message_id") REFERENCES "public"."messages"("workspace_id","id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "mentions" ADD CONSTRAINT "mentions_target_actor_fk" FOREIGN KEY ("workspace_id","target_actor_id") REFERENCES "public"."actors"("workspace_id","id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "message_revisions" ADD CONSTRAINT "message_revisions_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "message_revisions" ADD CONSTRAINT "message_revisions_message_fk" FOREIGN KEY ("workspace_id","message_id") REFERENCES "public"."messages"("workspace_id","id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "message_revisions" ADD CONSTRAINT "message_revisions_editor_fk" FOREIGN KEY ("workspace_id","edited_by_actor_id") REFERENCES "public"."actors"("workspace_id","id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "message_tombstones" ADD CONSTRAINT "message_tombstones_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "message_tombstones" ADD CONSTRAINT "message_tombstones_message_fk" FOREIGN KEY ("workspace_id","message_id") REFERENCES "public"."messages"("workspace_id","id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "message_tombstones" ADD CONSTRAINT "message_tombstones_actor_fk" FOREIGN KEY ("workspace_id","tombstoned_by_actor_id") REFERENCES "public"."actors"("workspace_id","id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "messages" ADD CONSTRAINT "messages_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "messages" ADD CONSTRAINT "messages_room_fk" FOREIGN KEY ("workspace_id","room_id") REFERENCES "public"."rooms"("workspace_id","id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "messages" ADD CONSTRAINT "messages_author_fk" FOREIGN KEY ("workspace_id","author_actor_id") REFERENCES "public"."actors"("workspace_id","id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "messages" ADD CONSTRAINT "messages_reply_fk" FOREIGN KEY ("workspace_id","room_id","reply_to_message_id") REFERENCES "public"."messages"("workspace_id","room_id","id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "messages" ADD CONSTRAINT "messages_thread_root_fk" FOREIGN KEY ("workspace_id","room_id","thread_root_id") REFERENCES "public"."messages"("workspace_id","room_id","id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "project_memberships" ADD CONSTRAINT "project_memberships_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "project_memberships" ADD CONSTRAINT "project_memberships_project_fk" FOREIGN KEY ("workspace_id","project_id") REFERENCES "public"."projects"("workspace_id","id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "project_memberships" ADD CONSTRAINT "project_memberships_actor_fk" FOREIGN KEY ("workspace_id","actor_id") REFERENCES "public"."actors"("workspace_id","id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "project_memberships" ADD CONSTRAINT "project_memberships_adder_fk" FOREIGN KEY ("workspace_id","added_by_actor_id") REFERENCES "public"."actors"("workspace_id","id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "projects" ADD CONSTRAINT "projects_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "projects" ADD CONSTRAINT "projects_creator_fk" FOREIGN KEY ("workspace_id","created_by_actor_id") REFERENCES "public"."actors"("workspace_id","id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "room_memberships" ADD CONSTRAINT "room_memberships_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "room_memberships" ADD CONSTRAINT "room_memberships_room_fk" FOREIGN KEY ("workspace_id","room_id") REFERENCES "public"."rooms"("workspace_id","id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "room_memberships" ADD CONSTRAINT "room_memberships_actor_fk" FOREIGN KEY ("workspace_id","actor_id") REFERENCES "public"."actors"("workspace_id","id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "room_memberships" ADD CONSTRAINT "room_memberships_adder_fk" FOREIGN KEY ("workspace_id","added_by_actor_id") REFERENCES "public"."actors"("workspace_id","id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "rooms" ADD CONSTRAINT "rooms_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "rooms" ADD CONSTRAINT "rooms_project_fk" FOREIGN KEY ("workspace_id","project_id") REFERENCES "public"."projects"("workspace_id","id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "rooms" ADD CONSTRAINT "rooms_creator_fk" FOREIGN KEY ("workspace_id","created_by_actor_id") REFERENCES "public"."actors"("workspace_id","id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "document_proposals" ADD CONSTRAINT "document_proposals_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "document_proposals" ADD CONSTRAINT "document_proposals_document_fk" FOREIGN KEY ("workspace_id","document_id") REFERENCES "public"."documents"("workspace_id","id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "document_proposals" ADD CONSTRAINT "document_proposals_base_version_fk" FOREIGN KEY ("workspace_id","document_id","base_version_id") REFERENCES "public"."document_versions"("workspace_id","document_id","id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "document_proposals" ADD CONSTRAINT "document_proposals_agent_actor_fk" FOREIGN KEY ("workspace_id","agent_actor_id") REFERENCES "public"."agent_actors"("workspace_id","actor_id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "document_proposals" ADD CONSTRAINT "document_proposals_agent_version_fk" FOREIGN KEY ("workspace_id","agent_version_id") REFERENCES "public"."agent_versions"("workspace_id","id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "document_proposals" ADD CONSTRAINT "document_proposals_delegator_fk" FOREIGN KEY ("workspace_id","delegated_by_actor_id") REFERENCES "public"."actors"("workspace_id","id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "document_proposals" ADD CONSTRAINT "document_proposals_run_fk" FOREIGN KEY ("workspace_id","run_id") REFERENCES "public"."agent_runs"("workspace_id","id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "document_proposals" ADD CONSTRAINT "document_proposals_reviewer_fk" FOREIGN KEY ("workspace_id","reviewed_by_actor_id") REFERENCES "public"."actors"("workspace_id","id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "document_proposals" ADD CONSTRAINT "document_proposals_applied_snapshot_fk" FOREIGN KEY ("workspace_id","document_id","applied_snapshot_id") REFERENCES "public"."yjs_snapshots"("workspace_id","document_id","id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "document_proposals" ADD CONSTRAINT "document_proposals_applied_version_fk" FOREIGN KEY ("workspace_id","document_id","applied_version_id") REFERENCES "public"."document_versions"("workspace_id","document_id","id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "proposal_operations" ADD CONSTRAINT "proposal_operations_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "proposal_operations" ADD CONSTRAINT "proposal_operations_proposal_fk" FOREIGN KEY ("workspace_id","proposal_id") REFERENCES "public"."document_proposals"("workspace_id","id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "proposal_operations" ADD CONSTRAINT "proposal_operations_decider_fk" FOREIGN KEY ("workspace_id","decided_by_actor_id") REFERENCES "public"."actors"("workspace_id","id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "document_versions" ADD CONSTRAINT "document_versions_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "document_versions" ADD CONSTRAINT "document_versions_document_fk" FOREIGN KEY ("workspace_id","document_id") REFERENCES "public"."documents"("workspace_id","id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "document_versions" ADD CONSTRAINT "document_versions_snapshot_fk" FOREIGN KEY ("workspace_id","document_id","snapshot_id") REFERENCES "public"."yjs_snapshots"("workspace_id","document_id","id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "document_versions" ADD CONSTRAINT "document_versions_creator_fk" FOREIGN KEY ("workspace_id","created_by_actor_id") REFERENCES "public"."actors"("workspace_id","id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "document_versions" ADD CONSTRAINT "document_versions_run_fk" FOREIGN KEY ("workspace_id","run_id") REFERENCES "public"."agent_runs"("workspace_id","id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "documents" ADD CONSTRAINT "documents_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "documents" ADD CONSTRAINT "documents_project_fk" FOREIGN KEY ("workspace_id","project_id") REFERENCES "public"."projects"("workspace_id","id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "documents" ADD CONSTRAINT "documents_room_fk" FOREIGN KEY ("workspace_id","project_id","room_id") REFERENCES "public"."rooms"("workspace_id","project_id","id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "documents" ADD CONSTRAINT "documents_owner_fk" FOREIGN KEY ("workspace_id","owner_actor_id") REFERENCES "public"."actors"("workspace_id","id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "yjs_snapshots" ADD CONSTRAINT "yjs_snapshots_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "yjs_snapshots" ADD CONSTRAINT "yjs_snapshots_document_fk" FOREIGN KEY ("workspace_id","document_id") REFERENCES "public"."documents"("workspace_id","id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "yjs_snapshots" ADD CONSTRAINT "yjs_snapshots_creator_fk" FOREIGN KEY ("workspace_id","created_by_actor_id") REFERENCES "public"."actors"("workspace_id","id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "yjs_snapshots" ADD CONSTRAINT "yjs_snapshots_run_fk" FOREIGN KEY ("workspace_id","run_id") REFERENCES "public"."agent_runs"("workspace_id","id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "yjs_updates" ADD CONSTRAINT "yjs_updates_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "yjs_updates" ADD CONSTRAINT "yjs_updates_document_fk" FOREIGN KEY ("workspace_id","document_id") REFERENCES "public"."documents"("workspace_id","id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "yjs_updates" ADD CONSTRAINT "yjs_updates_actor_fk" FOREIGN KEY ("workspace_id","actor_id") REFERENCES "public"."actors"("workspace_id","id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "yjs_updates" ADD CONSTRAINT "yjs_updates_run_fk" FOREIGN KEY ("workspace_id","run_id") REFERENCES "public"."agent_runs"("workspace_id","id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "approvals" ADD CONSTRAINT "approvals_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "approvals" ADD CONSTRAINT "approvals_project_fk" FOREIGN KEY ("workspace_id","project_id") REFERENCES "public"."projects"("workspace_id","id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "approvals" ADD CONSTRAINT "approvals_requester_fk" FOREIGN KEY ("workspace_id","requested_by_actor_id") REFERENCES "public"."actors"("workspace_id","id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "approvals" ADD CONSTRAINT "approvals_delegator_fk" FOREIGN KEY ("workspace_id","delegated_by_actor_id") REFERENCES "public"."actors"("workspace_id","id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "approvals" ADD CONSTRAINT "approvals_reviewer_fk" FOREIGN KEY ("workspace_id","reviewed_by_actor_id") REFERENCES "public"."actors"("workspace_id","id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "approvals" ADD CONSTRAINT "approvals_agent_version_fk" FOREIGN KEY ("workspace_id","agent_version_id") REFERENCES "public"."agent_versions"("workspace_id","id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "approvals" ADD CONSTRAINT "approvals_run_fk" FOREIGN KEY ("workspace_id","run_id") REFERENCES "public"."agent_runs"("workspace_id","id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "approvals" ADD CONSTRAINT "approvals_tool_capability_fk" FOREIGN KEY ("workspace_id","tool_capability_id") REFERENCES "public"."tool_capabilities"("workspace_id","id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "approvals" ADD CONSTRAINT "approvals_tool_call_fk" FOREIGN KEY ("workspace_id","tool_call_id") REFERENCES "public"."tool_calls"("workspace_id","id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "approvals" ADD CONSTRAINT "approvals_document_proposal_fk" FOREIGN KEY ("workspace_id","document_proposal_id") REFERENCES "public"."document_proposals"("workspace_id","id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "approvals" ADD CONSTRAINT "approvals_capability_fk" FOREIGN KEY ("capability_key") REFERENCES "public"."capabilities"("key") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "audit_events" ADD CONSTRAINT "audit_events_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "audit_events" ADD CONSTRAINT "audit_events_principal_fk" FOREIGN KEY ("workspace_id","effective_principal_actor_id") REFERENCES "public"."actors"("workspace_id","id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "audit_events" ADD CONSTRAINT "audit_events_on_behalf_of_fk" FOREIGN KEY ("workspace_id","on_behalf_of_actor_id") REFERENCES "public"."actors"("workspace_id","id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "audit_events" ADD CONSTRAINT "audit_events_membership_fk" FOREIGN KEY ("workspace_id","workspace_membership_id") REFERENCES "public"."workspace_memberships"("workspace_id","id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "audit_events" ADD CONSTRAINT "audit_events_approval_fk" FOREIGN KEY ("workspace_id","approval_id") REFERENCES "public"."approvals"("workspace_id","id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "audit_events" ADD CONSTRAINT "audit_events_run_fk" FOREIGN KEY ("workspace_id","run_id") REFERENCES "public"."agent_runs"("workspace_id","id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "audit_events" ADD CONSTRAINT "audit_events_agent_version_fk" FOREIGN KEY ("workspace_id","agent_version_id") REFERENCES "public"."agent_versions"("workspace_id","id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "audit_events" ADD CONSTRAINT "audit_events_tool_call_fk" FOREIGN KEY ("workspace_id","tool_call_id") REFERENCES "public"."tool_calls"("workspace_id","id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "usage_ledger_entries" ADD CONSTRAINT "usage_ledger_entries_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "usage_ledger_entries" ADD CONSTRAINT "usage_ledger_project_fk" FOREIGN KEY ("workspace_id","project_id") REFERENCES "public"."projects"("workspace_id","id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "usage_ledger_entries" ADD CONSTRAINT "usage_ledger_run_fk" FOREIGN KEY ("workspace_id","run_id") REFERENCES "public"."agent_runs"("workspace_id","id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "usage_ledger_entries" ADD CONSTRAINT "usage_ledger_actor_fk" FOREIGN KEY ("workspace_id","actor_id") REFERENCES "public"."actors"("workspace_id","id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "usage_ledger_entries" ADD CONSTRAINT "usage_ledger_agent_version_fk" FOREIGN KEY ("workspace_id","agent_version_id") REFERENCES "public"."agent_versions"("workspace_id","id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "usage_ledger_entries" ADD CONSTRAINT "usage_ledger_tool_call_fk" FOREIGN KEY ("workspace_id","tool_call_id") REFERENCES "public"."tool_calls"("workspace_id","id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "usage_ledger_entries" ADD CONSTRAINT "usage_ledger_reservation_fk" FOREIGN KEY ("workspace_id","reservation_entry_id") REFERENCES "public"."usage_ledger_entries"("workspace_id","id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "actors" ADD CONSTRAINT "actors_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "human_actors" ADD CONSTRAINT "human_actors_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "human_actors" ADD CONSTRAINT "human_actors_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "human_actors" ADD CONSTRAINT "human_actors_workspace_actor_fk" FOREIGN KEY ("workspace_id","actor_id") REFERENCES "public"."actors"("workspace_id","id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "workspace_memberships" ADD CONSTRAINT "workspace_memberships_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "workspace_memberships" ADD CONSTRAINT "workspace_memberships_human_actor_fk" FOREIGN KEY ("workspace_id","human_actor_id") REFERENCES "public"."human_actors"("workspace_id","actor_id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "workspace_memberships" ADD CONSTRAINT "workspace_memberships_inviter_fk" FOREIGN KEY ("workspace_id","invited_by_actor_id") REFERENCES "public"."actors"("workspace_id","id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "workspaces" ADD CONSTRAINT "workspaces_created_by_user_id_users_id_fk" FOREIGN KEY ("created_by_user_id") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "outbox_events" ADD CONSTRAINT "outbox_events_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "agent_runs" ADD CONSTRAINT "agent_runs_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "agent_runs" ADD CONSTRAINT "agent_runs_project_fk" FOREIGN KEY ("workspace_id","project_id") REFERENCES "public"."projects"("workspace_id","id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "agent_runs" ADD CONSTRAINT "agent_runs_room_fk" FOREIGN KEY ("workspace_id","project_id","room_id") REFERENCES "public"."rooms"("workspace_id","project_id","id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "agent_runs" ADD CONSTRAINT "agent_runs_agent_actor_fk" FOREIGN KEY ("workspace_id","agent_actor_id") REFERENCES "public"."agent_actors"("workspace_id","actor_id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "agent_runs" ADD CONSTRAINT "agent_runs_agent_version_fk" FOREIGN KEY ("workspace_id","agent_version_id") REFERENCES "public"."agent_versions"("workspace_id","id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "agent_runs" ADD CONSTRAINT "agent_runs_delegator_fk" FOREIGN KEY ("workspace_id","delegated_by_actor_id") REFERENCES "public"."actors"("workspace_id","id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "agent_runs" ADD CONSTRAINT "agent_runs_parent_fk" FOREIGN KEY ("workspace_id","parent_run_id") REFERENCES "public"."agent_runs"("workspace_id","id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "agent_runs" ADD CONSTRAINT "agent_runs_trigger_message_fk" FOREIGN KEY ("workspace_id","room_id","trigger_message_id") REFERENCES "public"."messages"("workspace_id","room_id","id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "run_events" ADD CONSTRAINT "run_events_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "run_events" ADD CONSTRAINT "run_events_run_fk" FOREIGN KEY ("workspace_id","run_id") REFERENCES "public"."agent_runs"("workspace_id","id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "run_events" ADD CONSTRAINT "run_events_actor_fk" FOREIGN KEY ("workspace_id","actor_id") REFERENCES "public"."actors"("workspace_id","id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "run_messages" ADD CONSTRAINT "run_messages_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "run_messages" ADD CONSTRAINT "run_messages_run_fk" FOREIGN KEY ("workspace_id","run_id") REFERENCES "public"."agent_runs"("workspace_id","id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "run_messages" ADD CONSTRAINT "run_messages_message_fk" FOREIGN KEY ("workspace_id","message_id") REFERENCES "public"."messages"("workspace_id","id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "run_steps" ADD CONSTRAINT "run_steps_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "run_steps" ADD CONSTRAINT "run_steps_run_fk" FOREIGN KEY ("workspace_id","run_id") REFERENCES "public"."agent_runs"("workspace_id","id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "context_manifest_items" ADD CONSTRAINT "context_manifest_items_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "context_manifest_items" ADD CONSTRAINT "context_manifest_items_manifest_fk" FOREIGN KEY ("workspace_id","manifest_id") REFERENCES "public"."context_manifests"("workspace_id","id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "context_manifests" ADD CONSTRAINT "context_manifests_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "context_manifests" ADD CONSTRAINT "context_manifests_run_fk" FOREIGN KEY ("workspace_id","run_id") REFERENCES "public"."agent_runs"("workspace_id","id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "context_manifests" ADD CONSTRAINT "context_manifests_step_fk" FOREIGN KEY ("workspace_id","step_id") REFERENCES "public"."run_steps"("workspace_id","id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tool_calls" ADD CONSTRAINT "tool_calls_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tool_calls" ADD CONSTRAINT "tool_calls_run_fk" FOREIGN KEY ("workspace_id","run_id") REFERENCES "public"."agent_runs"("workspace_id","id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tool_calls" ADD CONSTRAINT "tool_calls_step_fk" FOREIGN KEY ("workspace_id","step_id") REFERENCES "public"."run_steps"("workspace_id","id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tool_calls" ADD CONSTRAINT "tool_calls_capability_fk" FOREIGN KEY ("workspace_id","tool_capability_id") REFERENCES "public"."tool_capabilities"("workspace_id","id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tool_calls" ADD CONSTRAINT "tool_calls_principal_fk" FOREIGN KEY ("workspace_id","execution_principal_actor_id") REFERENCES "public"."actors"("workspace_id","id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tool_effects" ADD CONSTRAINT "tool_effects_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tool_effects" ADD CONSTRAINT "tool_effects_tool_call_fk" FOREIGN KEY ("workspace_id","tool_call_id") REFERENCES "public"."tool_calls"("workspace_id","id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE POLICY "agent_actors_tenant" ON "agent_actors" AS PERMISSIVE FOR ALL TO public USING ("agent_actors"."workspace_id" = nullif(current_setting('haloai.workspace_id', true), '')::uuid) WITH CHECK ("agent_actors"."workspace_id" = nullif(current_setting('haloai.workspace_id', true), '')::uuid);--> statement-breakpoint
CREATE POLICY "agent_profiles_tenant" ON "agent_profiles" AS PERMISSIVE FOR ALL TO public USING ("agent_profiles"."workspace_id" = nullif(current_setting('haloai.workspace_id', true), '')::uuid) WITH CHECK ("agent_profiles"."workspace_id" = nullif(current_setting('haloai.workspace_id', true), '')::uuid);--> statement-breakpoint
CREATE POLICY "agent_ver_cap_grants_tenant" ON "agent_version_capability_grants" AS PERMISSIVE FOR ALL TO public USING ("agent_version_capability_grants"."workspace_id" = nullif(current_setting('haloai.workspace_id', true), '')::uuid) WITH CHECK ("agent_version_capability_grants"."workspace_id" = nullif(current_setting('haloai.workspace_id', true), '')::uuid);--> statement-breakpoint
CREATE POLICY "agent_ver_tool_grants_tenant" ON "agent_version_tool_grants" AS PERMISSIVE FOR ALL TO public USING ("agent_version_tool_grants"."workspace_id" = nullif(current_setting('haloai.workspace_id', true), '')::uuid) WITH CHECK ("agent_version_tool_grants"."workspace_id" = nullif(current_setting('haloai.workspace_id', true), '')::uuid);--> statement-breakpoint
CREATE POLICY "agent_versions_select" ON "agent_versions" AS PERMISSIVE FOR SELECT TO public USING ("agent_versions"."workspace_id" = nullif(current_setting('haloai.workspace_id', true), '')::uuid);--> statement-breakpoint
CREATE POLICY "agent_versions_insert" ON "agent_versions" AS PERMISSIVE FOR INSERT TO public WITH CHECK ("agent_versions"."workspace_id" = nullif(current_setting('haloai.workspace_id', true), '')::uuid);--> statement-breakpoint
CREATE POLICY "agent_versions_update_draft" ON "agent_versions" AS PERMISSIVE FOR UPDATE TO public USING ("agent_versions"."workspace_id" = nullif(current_setting('haloai.workspace_id', true), '')::uuid and "agent_versions"."status" = 'draft') WITH CHECK ("agent_versions"."workspace_id" = nullif(current_setting('haloai.workspace_id', true), '')::uuid);--> statement-breakpoint
CREATE POLICY "agent_versions_delete_draft" ON "agent_versions" AS PERMISSIVE FOR DELETE TO public USING ("agent_versions"."workspace_id" = nullif(current_setting('haloai.workspace_id', true), '')::uuid and "agent_versions"."status" = 'draft');--> statement-breakpoint
CREATE POLICY "tool_capabilities_tenant" ON "tool_capabilities" AS PERMISSIVE FOR ALL TO public USING ("tool_capabilities"."workspace_id" = nullif(current_setting('haloai.workspace_id', true), '')::uuid) WITH CHECK ("tool_capabilities"."workspace_id" = nullif(current_setting('haloai.workspace_id', true), '')::uuid);--> statement-breakpoint
CREATE POLICY "access_roles_tenant" ON "access_roles" AS PERMISSIVE FOR ALL TO public USING ("access_roles"."workspace_id" = nullif(current_setting('haloai.workspace_id', true), '')::uuid) WITH CHECK ("access_roles"."workspace_id" = nullif(current_setting('haloai.workspace_id', true), '')::uuid);--> statement-breakpoint
CREATE POLICY "actor_role_assign_tenant" ON "actor_role_assignments" AS PERMISSIVE FOR ALL TO public USING ("actor_role_assignments"."workspace_id" = nullif(current_setting('haloai.workspace_id', true), '')::uuid) WITH CHECK ("actor_role_assignments"."workspace_id" = nullif(current_setting('haloai.workspace_id', true), '')::uuid);--> statement-breakpoint
CREATE POLICY "resource_grants_tenant" ON "resource_grants" AS PERMISSIVE FOR ALL TO public USING ("resource_grants"."workspace_id" = nullif(current_setting('haloai.workspace_id', true), '')::uuid) WITH CHECK ("resource_grants"."workspace_id" = nullif(current_setting('haloai.workspace_id', true), '')::uuid);--> statement-breakpoint
CREATE POLICY "role_cap_grants_tenant" ON "role_capability_grants" AS PERMISSIVE FOR ALL TO public USING ("role_capability_grants"."workspace_id" = nullif(current_setting('haloai.workspace_id', true), '')::uuid) WITH CHECK ("role_capability_grants"."workspace_id" = nullif(current_setting('haloai.workspace_id', true), '')::uuid);--> statement-breakpoint
CREATE POLICY "mentions_select" ON "mentions" AS PERMISSIVE FOR SELECT TO public USING ("mentions"."workspace_id" = nullif(current_setting('haloai.workspace_id', true), '')::uuid);--> statement-breakpoint
CREATE POLICY "mentions_insert" ON "mentions" AS PERMISSIVE FOR INSERT TO public WITH CHECK ("mentions"."workspace_id" = nullif(current_setting('haloai.workspace_id', true), '')::uuid);--> statement-breakpoint
CREATE POLICY "message_revisions_select" ON "message_revisions" AS PERMISSIVE FOR SELECT TO public USING ("message_revisions"."workspace_id" = nullif(current_setting('haloai.workspace_id', true), '')::uuid);--> statement-breakpoint
CREATE POLICY "message_revisions_insert" ON "message_revisions" AS PERMISSIVE FOR INSERT TO public WITH CHECK ("message_revisions"."workspace_id" = nullif(current_setting('haloai.workspace_id', true), '')::uuid);--> statement-breakpoint
CREATE POLICY "message_tombstones_select" ON "message_tombstones" AS PERMISSIVE FOR SELECT TO public USING ("message_tombstones"."workspace_id" = nullif(current_setting('haloai.workspace_id', true), '')::uuid);--> statement-breakpoint
CREATE POLICY "message_tombstones_insert" ON "message_tombstones" AS PERMISSIVE FOR INSERT TO public WITH CHECK ("message_tombstones"."workspace_id" = nullif(current_setting('haloai.workspace_id', true), '')::uuid);--> statement-breakpoint
CREATE POLICY "messages_select" ON "messages" AS PERMISSIVE FOR SELECT TO public USING ("messages"."workspace_id" = nullif(current_setting('haloai.workspace_id', true), '')::uuid);--> statement-breakpoint
CREATE POLICY "messages_insert" ON "messages" AS PERMISSIVE FOR INSERT TO public WITH CHECK ("messages"."workspace_id" = nullif(current_setting('haloai.workspace_id', true), '')::uuid);--> statement-breakpoint
CREATE POLICY "project_memberships_tenant" ON "project_memberships" AS PERMISSIVE FOR ALL TO public USING ("project_memberships"."workspace_id" = nullif(current_setting('haloai.workspace_id', true), '')::uuid) WITH CHECK ("project_memberships"."workspace_id" = nullif(current_setting('haloai.workspace_id', true), '')::uuid);--> statement-breakpoint
CREATE POLICY "projects_tenant" ON "projects" AS PERMISSIVE FOR ALL TO public USING ("projects"."workspace_id" = nullif(current_setting('haloai.workspace_id', true), '')::uuid) WITH CHECK ("projects"."workspace_id" = nullif(current_setting('haloai.workspace_id', true), '')::uuid);--> statement-breakpoint
CREATE POLICY "room_memberships_tenant" ON "room_memberships" AS PERMISSIVE FOR ALL TO public USING ("room_memberships"."workspace_id" = nullif(current_setting('haloai.workspace_id', true), '')::uuid) WITH CHECK ("room_memberships"."workspace_id" = nullif(current_setting('haloai.workspace_id', true), '')::uuid);--> statement-breakpoint
CREATE POLICY "rooms_tenant" ON "rooms" AS PERMISSIVE FOR ALL TO public USING ("rooms"."workspace_id" = nullif(current_setting('haloai.workspace_id', true), '')::uuid) WITH CHECK ("rooms"."workspace_id" = nullif(current_setting('haloai.workspace_id', true), '')::uuid);--> statement-breakpoint
CREATE POLICY "document_proposals_tenant" ON "document_proposals" AS PERMISSIVE FOR ALL TO public USING ("document_proposals"."workspace_id" = nullif(current_setting('haloai.workspace_id', true), '')::uuid) WITH CHECK ("document_proposals"."workspace_id" = nullif(current_setting('haloai.workspace_id', true), '')::uuid);--> statement-breakpoint
CREATE POLICY "proposal_operations_tenant" ON "proposal_operations" AS PERMISSIVE FOR ALL TO public USING ("proposal_operations"."workspace_id" = nullif(current_setting('haloai.workspace_id', true), '')::uuid) WITH CHECK ("proposal_operations"."workspace_id" = nullif(current_setting('haloai.workspace_id', true), '')::uuid);--> statement-breakpoint
CREATE POLICY "document_versions_select" ON "document_versions" AS PERMISSIVE FOR SELECT TO public USING ("document_versions"."workspace_id" = nullif(current_setting('haloai.workspace_id', true), '')::uuid);--> statement-breakpoint
CREATE POLICY "document_versions_insert" ON "document_versions" AS PERMISSIVE FOR INSERT TO public WITH CHECK ("document_versions"."workspace_id" = nullif(current_setting('haloai.workspace_id', true), '')::uuid);--> statement-breakpoint
CREATE POLICY "documents_tenant" ON "documents" AS PERMISSIVE FOR ALL TO public USING ("documents"."workspace_id" = nullif(current_setting('haloai.workspace_id', true), '')::uuid) WITH CHECK ("documents"."workspace_id" = nullif(current_setting('haloai.workspace_id', true), '')::uuid);--> statement-breakpoint
CREATE POLICY "yjs_snapshots_select" ON "yjs_snapshots" AS PERMISSIVE FOR SELECT TO public USING ("yjs_snapshots"."workspace_id" = nullif(current_setting('haloai.workspace_id', true), '')::uuid);--> statement-breakpoint
CREATE POLICY "yjs_snapshots_insert" ON "yjs_snapshots" AS PERMISSIVE FOR INSERT TO public WITH CHECK ("yjs_snapshots"."workspace_id" = nullif(current_setting('haloai.workspace_id', true), '')::uuid);--> statement-breakpoint
CREATE POLICY "yjs_updates_select" ON "yjs_updates" AS PERMISSIVE FOR SELECT TO public USING ("yjs_updates"."workspace_id" = nullif(current_setting('haloai.workspace_id', true), '')::uuid);--> statement-breakpoint
CREATE POLICY "yjs_updates_insert" ON "yjs_updates" AS PERMISSIVE FOR INSERT TO public WITH CHECK ("yjs_updates"."workspace_id" = nullif(current_setting('haloai.workspace_id', true), '')::uuid);--> statement-breakpoint
CREATE POLICY "approvals_tenant" ON "approvals" AS PERMISSIVE FOR ALL TO public USING ("approvals"."workspace_id" = nullif(current_setting('haloai.workspace_id', true), '')::uuid) WITH CHECK ("approvals"."workspace_id" = nullif(current_setting('haloai.workspace_id', true), '')::uuid);--> statement-breakpoint
CREATE POLICY "audit_events_select" ON "audit_events" AS PERMISSIVE FOR SELECT TO public USING ("audit_events"."workspace_id" = nullif(current_setting('haloai.workspace_id', true), '')::uuid);--> statement-breakpoint
CREATE POLICY "audit_events_insert" ON "audit_events" AS PERMISSIVE FOR INSERT TO public WITH CHECK ("audit_events"."workspace_id" = nullif(current_setting('haloai.workspace_id', true), '')::uuid);--> statement-breakpoint
CREATE POLICY "usage_ledger_select" ON "usage_ledger_entries" AS PERMISSIVE FOR SELECT TO public USING ("usage_ledger_entries"."workspace_id" = nullif(current_setting('haloai.workspace_id', true), '')::uuid);--> statement-breakpoint
CREATE POLICY "usage_ledger_insert" ON "usage_ledger_entries" AS PERMISSIVE FOR INSERT TO public WITH CHECK ("usage_ledger_entries"."workspace_id" = nullif(current_setting('haloai.workspace_id', true), '')::uuid);--> statement-breakpoint
CREATE POLICY "actors_tenant" ON "actors" AS PERMISSIVE FOR ALL TO public USING ("actors"."workspace_id" = nullif(current_setting('haloai.workspace_id', true), '')::uuid) WITH CHECK ("actors"."workspace_id" = nullif(current_setting('haloai.workspace_id', true), '')::uuid);--> statement-breakpoint
CREATE POLICY "human_actors_tenant" ON "human_actors" AS PERMISSIVE FOR ALL TO public USING ("human_actors"."workspace_id" = nullif(current_setting('haloai.workspace_id', true), '')::uuid) WITH CHECK ("human_actors"."workspace_id" = nullif(current_setting('haloai.workspace_id', true), '')::uuid);--> statement-breakpoint
CREATE POLICY "workspace_memberships_tenant" ON "workspace_memberships" AS PERMISSIVE FOR ALL TO public USING ("workspace_memberships"."workspace_id" = nullif(current_setting('haloai.workspace_id', true), '')::uuid) WITH CHECK ("workspace_memberships"."workspace_id" = nullif(current_setting('haloai.workspace_id', true), '')::uuid);--> statement-breakpoint
CREATE POLICY "workspaces_tenant" ON "workspaces" AS PERMISSIVE FOR ALL TO public USING ("workspaces"."id" = nullif(current_setting('haloai.workspace_id', true), '')::uuid) WITH CHECK ("workspaces"."id" = nullif(current_setting('haloai.workspace_id', true), '')::uuid);--> statement-breakpoint
CREATE POLICY "outbox_events_tenant" ON "outbox_events" AS PERMISSIVE FOR ALL TO public USING ("outbox_events"."workspace_id" = nullif(current_setting('haloai.workspace_id', true), '')::uuid) WITH CHECK ("outbox_events"."workspace_id" = nullif(current_setting('haloai.workspace_id', true), '')::uuid);--> statement-breakpoint
CREATE POLICY "agent_runs_tenant" ON "agent_runs" AS PERMISSIVE FOR ALL TO public USING ("agent_runs"."workspace_id" = nullif(current_setting('haloai.workspace_id', true), '')::uuid) WITH CHECK ("agent_runs"."workspace_id" = nullif(current_setting('haloai.workspace_id', true), '')::uuid);--> statement-breakpoint
CREATE POLICY "run_events_select" ON "run_events" AS PERMISSIVE FOR SELECT TO public USING ("run_events"."workspace_id" = nullif(current_setting('haloai.workspace_id', true), '')::uuid);--> statement-breakpoint
CREATE POLICY "run_events_insert" ON "run_events" AS PERMISSIVE FOR INSERT TO public WITH CHECK ("run_events"."workspace_id" = nullif(current_setting('haloai.workspace_id', true), '')::uuid);--> statement-breakpoint
CREATE POLICY "run_messages_select" ON "run_messages" AS PERMISSIVE FOR SELECT TO public USING ("run_messages"."workspace_id" = nullif(current_setting('haloai.workspace_id', true), '')::uuid);--> statement-breakpoint
CREATE POLICY "run_messages_insert" ON "run_messages" AS PERMISSIVE FOR INSERT TO public WITH CHECK ("run_messages"."workspace_id" = nullif(current_setting('haloai.workspace_id', true), '')::uuid);--> statement-breakpoint
CREATE POLICY "run_steps_tenant" ON "run_steps" AS PERMISSIVE FOR ALL TO public USING ("run_steps"."workspace_id" = nullif(current_setting('haloai.workspace_id', true), '')::uuid) WITH CHECK ("run_steps"."workspace_id" = nullif(current_setting('haloai.workspace_id', true), '')::uuid);--> statement-breakpoint
CREATE POLICY "context_manifest_items_select" ON "context_manifest_items" AS PERMISSIVE FOR SELECT TO public USING ("context_manifest_items"."workspace_id" = nullif(current_setting('haloai.workspace_id', true), '')::uuid);--> statement-breakpoint
CREATE POLICY "context_manifest_items_insert" ON "context_manifest_items" AS PERMISSIVE FOR INSERT TO public WITH CHECK ("context_manifest_items"."workspace_id" = nullif(current_setting('haloai.workspace_id', true), '')::uuid);--> statement-breakpoint
CREATE POLICY "context_manifests_select" ON "context_manifests" AS PERMISSIVE FOR SELECT TO public USING ("context_manifests"."workspace_id" = nullif(current_setting('haloai.workspace_id', true), '')::uuid);--> statement-breakpoint
CREATE POLICY "context_manifests_insert" ON "context_manifests" AS PERMISSIVE FOR INSERT TO public WITH CHECK ("context_manifests"."workspace_id" = nullif(current_setting('haloai.workspace_id', true), '')::uuid);--> statement-breakpoint
CREATE POLICY "tool_calls_tenant" ON "tool_calls" AS PERMISSIVE FOR ALL TO public USING ("tool_calls"."workspace_id" = nullif(current_setting('haloai.workspace_id', true), '')::uuid) WITH CHECK ("tool_calls"."workspace_id" = nullif(current_setting('haloai.workspace_id', true), '')::uuid);--> statement-breakpoint
CREATE POLICY "tool_effects_tenant" ON "tool_effects" AS PERMISSIVE FOR ALL TO public USING ("tool_effects"."workspace_id" = nullif(current_setting('haloai.workspace_id', true), '')::uuid) WITH CHECK ("tool_effects"."workspace_id" = nullif(current_setting('haloai.workspace_id', true), '')::uuid);--> statement-breakpoint

-- 跨表 Actor 类型约束无法用普通 CHECK 表达，使用延迟触发器在事务提交前兜底。
CREATE FUNCTION haloai_assert_human_actor_kind() RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM actors
    WHERE workspace_id = NEW.workspace_id AND id = NEW.actor_id AND kind = 'human'
  ) THEN
    RAISE EXCEPTION 'human_actors.actor_id must reference a human actor'
      USING ERRCODE = 'check_violation';
  END IF;
  RETURN NEW;
END
$$;--> statement-breakpoint
CREATE CONSTRAINT TRIGGER human_actors_kind_constraint
AFTER INSERT OR UPDATE ON human_actors
DEFERRABLE INITIALLY DEFERRED
FOR EACH ROW EXECUTE FUNCTION haloai_assert_human_actor_kind();--> statement-breakpoint

CREATE FUNCTION haloai_assert_agent_actor_kind() RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM actors
    WHERE workspace_id = NEW.workspace_id AND id = NEW.actor_id AND kind = 'agent'
  ) THEN
    RAISE EXCEPTION 'agent_actors.actor_id must reference an agent actor'
      USING ERRCODE = 'check_violation';
  END IF;
  RETURN NEW;
END
$$;--> statement-breakpoint
CREATE CONSTRAINT TRIGGER agent_actors_kind_constraint
AFTER INSERT OR UPDATE ON agent_actors
DEFERRABLE INITIALLY DEFERRED
FOR EACH ROW EXECUTE FUNCTION haloai_assert_agent_actor_kind();--> statement-breakpoint

-- 最后一个 Owner 约束跨越多行并发状态，在事务结束时检查，允许同事务安全转移所有权。
CREATE FUNCTION haloai_assert_workspace_has_owner() RETURNS trigger
LANGUAGE plpgsql
AS $$
DECLARE
  target_workspace_id uuid;
BEGIN
  IF TG_TABLE_NAME = 'workspaces' THEN
    target_workspace_id := COALESCE(NEW.id, OLD.id);
  ELSE
    target_workspace_id := COALESCE(NEW.workspace_id, OLD.workspace_id);
  END IF;
  IF EXISTS (SELECT 1 FROM workspaces WHERE id = target_workspace_id)
     AND NOT EXISTS (
       SELECT 1 FROM workspace_memberships
       WHERE workspace_id = target_workspace_id AND is_owner = true AND status = 'active'
     ) THEN
    RAISE EXCEPTION 'workspace must retain an active owner'
      USING ERRCODE = 'check_violation';
  END IF;
  RETURN COALESCE(NEW, OLD);
END
$$;--> statement-breakpoint
CREATE CONSTRAINT TRIGGER workspaces_owner_constraint
AFTER INSERT ON workspaces
DEFERRABLE INITIALLY DEFERRED
FOR EACH ROW EXECUTE FUNCTION haloai_assert_workspace_has_owner();--> statement-breakpoint
CREATE CONSTRAINT TRIGGER workspace_memberships_owner_constraint
AFTER INSERT OR UPDATE OR DELETE ON workspace_memberships
DEFERRABLE INITIALLY DEFERRED
FOR EACH ROW EXECUTE FUNCTION haloai_assert_workspace_has_owner();--> statement-breakpoint

-- public 默认不能在 schema 中建对象；应用角色只获得现有业务表的 DML 权限且不拥有表。
REVOKE CREATE ON SCHEMA public FROM public;--> statement-breakpoint
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'haloai_app') THEN
    GRANT USAGE ON SCHEMA public TO haloai_app;
    GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO haloai_app;
  END IF;
END
$$;
