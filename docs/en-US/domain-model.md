# Domain Model

[简体中文](../zh-CN/domain-model.md) · English

This document is the semantic source of truth for HaloAI. Database tables, API contracts, UI labels, and agent prompts may project this model, but must not invent alternative meanings for the same concept.

## 1. Non-negotiable invariants

1. Every tenant-owned record carries a non-null `workspaceId`; missing tenant context fails closed.
2. `Actor` identifies who acted. `AccessRole` grants capabilities. `AgentProfile` describes how an AI contributes. They are never interchangeable.
3. An AI actor has no password, interactive session, refresh token, or implicit access through its delegator.
4. Effective AI permission is an intersection, never a union.
5. Persisted messages are immutable facts. Editing creates a revision; deletion creates a tombstone.
6. Published agent versions and formal document versions are immutable snapshots.
7. An agent run pins all behavior-affecting versions required to reproduce its decision boundary.
8. AI document work begins as a proposal. Canonical content changes only through an authorized transaction.
9. Side effects, denials, approvals, and policy versions are attributable through append-only audit events.
10. Soft deletion does not satisfy a legal deletion request; erasure must propagate to every projection and object.

## 2. Bounded contexts

| Context       | Owns                                                              | May reference                   | Must not own                    |
| ------------- | ----------------------------------------------------------------- | ------------------------------- | ------------------------------- |
| Identity      | users, sessions, authentication factors                           | actor link                      | workspace authorization         |
| Workspace     | workspaces, membership, invitations                               | human identity                  | prompt/persona details          |
| Authorization | roles, capabilities, resource grants, policy decisions            | actor, resource descriptor      | UI routes as permission truth   |
| Conversation  | projects, rooms, messages, revisions, mentions, attachments       | actor, run, document            | model-provider details          |
| Agent catalog | AI actors, profiles, versions, capability configuration           | workspace, credential reference | human sessions or raw secrets   |
| Agent runtime | runs, steps, events, context manifests, tool calls, budgets       | pinned agent version, delegator | mutable published configuration |
| Documents     | documents, CRDT state, projections, versions, proposals, comments | actor, run, source              | silent AI overwrite             |
| Governance    | approvals, audit events, usage ledger, retention and export jobs  | any resource descriptor         | secret plaintext                |
| Integration   | connection metadata, tool catalog, credential references          | workspace policy                | direct authorization decisions  |

Cross-context writes use an application service and one transaction where possible. Durable asynchronous consequences are emitted through a transactional outbox.

## 3. Identity and tenancy

### 3.1 User

A `User` is a human account that can authenticate. It contains global identity attributes only: verified addresses, preferred locale and time zone, authentication status, and account lifecycle. It grants no workspace access by itself.

### 3.2 Workspace

A `Workspace` is the primary tenant and policy boundary. It owns projects, rooms, agent profiles, documents, integrations, budgets, and retention policy. It does not own the platform model catalog or provider secrets; it only holds the right to use models a system administrator allocated to that tenant. Human-readable slugs are scoped but are never used as authorization evidence.

### 3.3 Actor

An `Actor` is the uniform attribution identity used by messages, edits, runs, and audit events.

```ts
type ActorKind = "human" | "agent" | "system";
type ActorStatus = "active" | "suspended" | "archived";
```

- A human actor links to exactly one `User` within one workspace.
- An agent actor links to exactly one `AgentProfile` within one workspace.
- A system actor represents a narrowly defined service function, not an all-powerful administrator.

### 3.4 Membership

A `Membership` binds one human actor to a workspace and lifecycle state. A project or private room may add narrower membership. Suspending workspace membership invalidates all descendants immediately.

Critical constraint: one workspace must always retain at least one active owner. Ownership transfer is transactional.

## 4. Authorization model

### 4.1 Capability

A capability is a stable, namespaced action such as:

```text
room.read
room.message.create
agent.invoke
agent.profile.publish
document.read
document.edit
document.proposal.review
integration.tool.execute
workspace.security.manage
```

Capabilities describe actions, not pages. Removing a button is not authorization.

### 4.2 AccessRole and grants

`AccessRole` groups capabilities for human administration. `ResourceGrant` narrows an actor or role to a specific resource. Explicit denial and membership status are evaluated before grants. Decisions return both an allow/deny result and a stable reason code.

For an AI run:

```text
effective capability
  = active delegator capabilities
  ∩ published agent grants
  ∩ resource ACL
  ∩ data classification policy
  ∩ tool execution policy
  ∩ remaining budget
  ∩ valid approval, when required
```

Every context read and every tool call re-evaluates the current decision. A run cannot cache permission for its entire lifetime.

## 5. Collaboration graph

### 5.1 Project and room

A `Project` groups work toward an outcome. A `Room` is the live collaboration boundary and contains:

- a goal, expected artifact, and completion criteria;
- explicit human and AI membership;
- visibility (`workspace` or `private`);
- lifecycle (`active`, `waiting`, `completed`, `archived`);
- links to one or more documents.

Room status is not a task engine. It communicates collaboration state and affects allowed mutations.

### 5.2 Message

A `Message` is an immutable envelope authored by an actor. Content may be plain text, structured rich text, a system fact, an agent response, or an action card. Model streaming chunks are temporary events; only the completed or explicitly partial response becomes a message fact.

`MessageRevision` records edited content, editor, reason, and timestamp. `MessageTombstone` hides content while preserving referential and audit integrity. Attachments are separate resources with their own ACL and scanning state.

### 5.3 Mention and routing

`Mention` is persisted when the message is accepted. It targets an actor and records the exact structured-text range or semantic node. Runtime routing consumes this relation; it never guesses agent names from plain strings after the fact.

Default routing invokes only explicitly mentioned AI actors. Coordinator mode creates an auditable `Delegation` relation with inviter, invitee, reason, limits, and synthesis owner.

## 6. Agent catalog

### 6.1 AgentProfile

An `AgentProfile` is mutable catalog identity: name, visual identity, summary, owner, lifecycle, and current draft. It is not the executable configuration.

### 6.2 AgentVersion

Publishing creates an immutable `AgentVersion` containing:

- responsibility and explicit non-responsibilities;
- behavior instructions and output contract;
- model policy and fallback policy (only platform model identifiers already allocated to this tenant);
- knowledge-source selectors;
- tool allowlist and per-tool constraints;
- initiative level and collaboration policy;
- token, cost, duration, step, and delegation budgets;
- referenced policy and schema versions.

Runs pin an `AgentVersion` identifier and content digest. Archiving the profile prevents new runs but does not damage history.

## 7. Agent runtime

### 7.1 AgentRun

An `AgentRun` represents one durable attempt, attributed to an AI actor and delegated by a human actor or an authorized coordinator run. It stores the room, trigger message, pinned versions, idempotency key, budget reservation, timestamps, result summary, and terminal reason.

```ts
type RunStatus =
  | "queued"
  | "preparing"
  | "running"
  | "streaming"
  | "waiting_input"
  | "waiting_approval"
  | "paused"
  | "completed"
  | "failed"
  | "cancelled";
```

Status transitions are validated server-side. Terminal states never transition back; retry creates a linked run.

### 7.2 RunEvent and step

`RunEvent` is the replayable user-facing event stream. `(runId, sequence)` is unique and monotonically increasing. Events may contain status, bounded progress summaries, content deltas, citations, approval requests, usage, warnings, and terminal results. Hidden model reasoning is never stored or displayed.

`RunStep` stores operational facts required for recovery and audit. It may reference a `ToolCall`, context read, model call, or document proposal. Event projection is idempotent.

### 7.3 ContextManifest

The manifest records which authorized source versions entered the run: message IDs, document versions, file digests, memories, and retrieval fragments. It stores provenance and policy decisions, not a redundant unredacted prompt dump.

### 7.4 ToolCall

A tool call stores schema version, risk class, normalized argument digest, credential reference, network policy, approval reference, execution principal, result classification, timing, usage, and error code. Secret values and unrestricted response bodies do not belong in ordinary audit payloads.

## 8. Documents and proposals

### 8.1 Document sources of truth

- The Yjs binary update log and compacted snapshot are the collaborative editing source of truth.
- A validated rich-text JSON projection supports APIs, indexing, export, and proposal operations.
- Plain text is a derived search and model-context projection.
- A `DocumentVersion` freezes a named checkpoint with content digest, creator, cause, and provenance.

Projection failure must not corrupt the CRDT source. A projector can rebuild derived forms from a checkpoint and subsequent updates.

### 8.2 DocumentProposal

An AI produces a `DocumentProposal`, never a direct canonical write. It pins:

- base document version and digest;
- ordered semantic operations using stable node identifiers;
- rationale and citations per operation;
- AI actor, agent version, run, and delegator;
- policy decision and expiry;
- status for each operation and the proposal as a whole.

Acceptance rechecks authorization and base compatibility, then applies accepted operations in one named Yjs transaction and creates a checkpoint. A stale proposal becomes `conflicted` and requires rebase or manual editing.

## 9. Governance records

### 9.1 Approval

An approval is capability-specific and one-time by default. It binds the requesting actor, delegator, operation type, normalized argument digest, affected resources, risk explanation, approver, decision, expiry, and consumption timestamp. Any material argument change invalidates it.

### 9.2 AuditEvent

Audit events are append-only and contain workspace, actor, effective principal, action, resource, policy version, request correlation, outcome, reason code, timestamp, and sanitized metadata. The audit stream records denied attempts as well as successful mutations.

### 9.3 UsageLedger

Usage is accounting, not a mutable counter. Reservation, settlement, and release entries use idempotency keys and reference runs/tool calls. Workspace, project, agent, and member views are projections of one ledger.

## 10. Relational outline

```text
users
  └─ human_actors ─ actors ─ workspace_memberships ─ workspaces
                         ├─ project_memberships ─ projects ─ rooms
                         ├─ room_memberships ───────┘   ├─ messages ─ message_revisions
                         │                              ├─ mentions
agent_profiles ─ agent_versions ─ agent_runs ─ run_steps/run_events/tool_calls
       └─ agent_actors ─ actors           ├─ context_manifests
                                         └─ document_proposals
documents ─ yjs_updates/yjs_snapshots ─ document_versions
     ├─ document_proposals ─ proposal_operations
     └─ comments/suggestions
approvals · audit_events · usage_ledger_entries · outbox_events
```

All tenant-owned foreign keys should include or validate the same `workspaceId`. PostgreSQL row-level security is defense in depth; application authorization remains mandatory.

## 11. Lifecycle, retention, and erasure

- Archive hides a resource from active work but preserves history.
- Suspend prevents new actions and invalidates active channels where applicable.
- Tombstone removes user-visible message content while retaining a minimal reference.
- Erase removes or irreversibly anonymizes personal content according to policy and legal hold.
- Derived search entries, document projections, AI memory, object storage, caches, and exports have deletion propagation jobs with observable completion.

Backups use a documented retention window. A deletion manifest records what was removed without retaining the erased content itself.

## 12. Model review checklist

Before adding a new entity or field, answer:

1. Which bounded context owns it?
2. Is `workspaceId` explicit and enforced?
3. Who is the actor and effective principal?
4. Which capability controls create/read/update/delete or execute?
5. Is the record immutable, revisioned, archived, tombstoned, or erasable?
6. Which audit event and outbox event are produced?
7. Can its content contain secrets, personal data, or untrusted model/tool data?
8. How does it appear in Chinese and English without localizing protocol values?
9. What happens during retry, duplicate delivery, revocation, and partial failure?
10. Which invariant test proves the boundary?
