# HaloAI agent runtime specification

## Status and scope

This document defines the normative contract for HaloAI agent identity, collaboration, execution, tools, memory, approval, document proposals, recovery, and audit. It describes product and security behavior rather than a particular model provider, queue, database, or user interface.

The runtime is human-directed. An AI participant may reason, draft, and request an action, but application policy remains the authority for identity, access, approval, budgets, and durable writes.

The key words MUST, MUST NOT, SHOULD, SHOULD NOT, and MAY describe requirement strength.

## Core invariants

1. Actor identity, access role, room membership, and Agent persona are separate records.
2. An AI Actor MUST NOT receive, copy, or impersonate a human login session.
3. Every run MUST pin its delegating human or system Actor, Agent version, authorization snapshot, policy version, and budget.
4. The server MUST authorize retrieval, model calls, tool calls, memory writes, and document writes. Prompt instructions and client-side visibility are not authorization.
5. Missing tenant, project, room, or delegation context MUST fail closed.
6. Model output, uploaded files, retrieved text, web content, tool results, and MCP responses are untrusted data.
7. An AI Actor MUST NOT create roles, widen its tool set, approve its own action, or install an integration.
8. Every run MUST be cancellable and bounded by tokens, cost, time, turns, tool calls, concurrency, and participants.
9. External writes, publication, deletion, payments, permission changes, and sensitive-data operations require human approval by default.
10. AI-authored document changes MUST be proposals until an authorized human or an explicit low-risk policy accepts them.

## Identity and version model

### Actor

An Actor is an addressable participant that can own messages, events, decisions, and audit records.

Required fields:

| Field | Meaning |
| --- | --- |
| actorId | Stable identifier within one tenant |
| tenantId | Mandatory tenant boundary |
| kind | human, agent, or system |
| status | active, suspended, or retired |
| displayIdentity | Localized display metadata; never used for authorization |
| createdAt | Creation timestamp |

A human Actor is bound to an authenticated user. An agent Actor is bound to one AgentProfile but executes only through a pinned AgentVersion. A system Actor is reserved for named internal processes and MUST NOT be used as an anonymous authorization bypass.

### AccessRole and Membership

AccessRole is a reusable permission set. Membership assigns an Actor to an AccessRole within a workspace, project, or room. Membership is contextual and revocable; it is not embedded in Agent instructions.

Runtime authorization MUST use the intersection of:

- the run's immutable authorization snapshot;
- the Actor's current active memberships;
- the current resource policy;
- the AgentVersion tool allowlist;
- the room or task policy;
- any approval restriction.

Permission revocation takes effect immediately. Permission granted after a run starts MUST NOT silently expand that run; the run must be restarted or explicitly reauthorized.

### AgentProfile

AgentProfile is the stable product identity for an AI teammate. It contains the name, description, avatar metadata, owner, lifecycle state, and default governance references. It does not grant permissions.

### AgentVersion

AgentVersion is an immutable published configuration containing:

- persona and instructions;
- model selection policy and generation settings;
- allowed tool capability versions;
- collaboration behavior;
- context and memory policy;
- budget policy;
- output contracts;
- safety and approval policy references;
- a canonical content hash.

Draft versions MAY be edited. Published versions MUST be immutable. Retirement prevents new runs but MUST NOT break historical replay or audit. Every message, proposal, tool call, and final result produced by an AI Actor MUST retain agentProfileId and agentVersionId.

### Delegation

Each run has a RunDelegation containing:

- requestedByActorId;
- actingAgentActorId;
- membershipId or service delegation identifier;
- authorizationSnapshotId;
- policyVersionId;
- requestedAt;
- optional purpose and expiry.

Delegation grants no rights beyond the server-computed authorization intersection. It MUST NOT contain a reusable human access token.

## Collaboration modes

| Mode | Selection rule | Completion rule | Required guardrails |
| --- | --- | --- | --- |
| mention | Only explicitly mentioned AI Actors participate | Each mentioned participant may answer; one selected response may become the room result | Default mode; no hidden participants |
| facilitated | A coordinator selects the smallest eligible participant set | Coordinator produces a synthesis after bounded contributions | Selection event, participant cap, no extra coordinator permissions |
| workflow | A versioned graph selects order, branching, inputs, and approval gates | Published graph reaches a terminal node | Pinned workflow version and deterministic transition audit |
| roundtable | A fixed participant list discusses for bounded rounds | A named synthesizer produces the final response | Fixed rounds, participant cap, shared budget, no self-extension |

The initiating Actor and selected mode MUST be visible in the room. Participant selection MUST produce a durable event before any selected Agent receives context. A coordinator or synthesizer is a routing responsibility, not a privileged security role.

Mention is the default mode for the first production path. Other modes MUST reuse the same identity, authorization, budget, event, approval, and audit contracts.

## Persistent run state machine

### Run states

| State | Meaning |
| --- | --- |
| created | Durable run record exists but has not been dispatched |
| queued | Work is eligible for a worker lease |
| running | A worker owns a valid lease and may perform bounded computation |
| waiting_input | Human input is required; no model or tool work may continue |
| waiting_approval | A bound approval decision is required before the proposed action |
| paused | Execution was intentionally suspended at a safe checkpoint |
| completing | Final validation, persistence, and accounting are in progress |
| completed | Successful terminal state |
| failed | Unrecoverable terminal state with a stable error code |
| cancelled | Cancellation was acknowledged and no new side effect may start |
| expired | A deadline passed while waiting or queued |

### Allowed transitions

| From | Allowed next states |
| --- | --- |
| created | queued, cancelled |
| queued | running, cancelled, expired |
| running | waiting_input, waiting_approval, paused, completing, failed, cancelled |
| waiting_input | queued, cancelled, expired |
| waiting_approval | queued, failed, cancelled, expired |
| paused | queued, cancelled, expired |
| completing | completed, failed |
| completed, failed, cancelled, expired | none |

The server owns transitions. Every transition MUST compare an expected stateVersion and append a durable event in the same transaction as the state change. A stale command MUST return a conflict and MUST NOT overwrite a newer state.

A failed or completed run is immutable. A user-requested rerun creates a new run with parentRunId and a new budget, policy check, and authorization snapshot. Worker recovery within a non-terminal run increments attempt without changing runId.

### Leases and checkpoints

A worker lease contains runId, attempt, leaseOwner, leaseExpiresAt, and heartbeatAt. Only the current lease holder may commit execution events. A worker MUST checkpoint after every externally visible message, approval request, tool result, memory commit, and document proposal.

Lease loss stops new side effects. Another worker MAY resume from the last durable checkpoint after the lease expires. It MUST NOT replay a non-idempotent external write whose outcome is unknown.

### Cancellation

Cancellation is a server command, not a client-only signal. Once cancel_requested is observed:

- no new model or tool call may start;
- cancellable in-flight work SHOULD be aborted;
- an already completed external side effect MUST be recorded;
- accounting and audit MUST finish;
- the run transitions to cancelled at a safe checkpoint.

## Command and event protocol

### Commands

Runtime commands include StartRun, SubmitInput, ResolveApproval, PauseRun, ResumeRun, CancelRun, AcceptDocumentProposal, and RejectDocumentProposal.

Every command MUST carry:

- commandId;
- idempotencyKey;
- tenantId, projectId, and roomId;
- target runId or proposalId;
- authenticated actorId;
- expectedStateVersion when mutating existing state;
- issuedAt;
- validated payload.

Clients request commands; they never write runtime state directly.

### Event envelope

Every runtime event uses this logical envelope:

    interface RuntimeEventEnvelope<TPayload> {
      schemaVersion: 1;
      eventId: string;
      tenantId: string;
      projectId: string;
      roomId: string;
      runId: string;
      sequence: number;
      type: RuntimeEventType;
      occurredAt: string;
      actorId: string;
      correlationId: string;
      causationId: string | null;
      attempt: number;
      durability: "durable" | "transient";
      payload: TPayload;
    }

sequence is strictly increasing per run. Durable consumers MUST deduplicate by eventId and process in sequence order. Unknown event types or schema versions MUST be quarantined rather than interpreted loosely.

### Event families

The initial protocol includes:

- run.created, run.queued, run.started, run.paused, run.resumed;
- run.waiting_input, run.input_received;
- participant.selected, participant.completed, participant.skipped;
- context.assembled;
- model.started, model.delta, model.completed, model.failed;
- tool.requested, tool.started, tool.succeeded, tool.failed, tool.denied;
- approval.requested, approval.approved, approval.rejected, approval.expired;
- memory.proposed, memory.committed, memory.rejected, memory.expired;
- document.proposal_created, document.proposal_applied, document.proposal_rejected, document.proposal_conflicted;
- budget.updated, budget.warning, budget.exhausted;
- run.cancel_requested, run.completing, run.completed, run.failed, run.cancelled, run.expired.

Model deltas, typing indicators, and presence MAY be transient. State changes, complete messages, tool facts, approvals, budget updates, proposals, and terminal events MUST be durable. A reconnecting client provides its last durable sequence and receives the subsequent durable events plus any current transient snapshot.

Events MUST carry references and hashes instead of secrets or unrestricted raw content. Complete message content belongs in the authorized message store; the event may reference messageId.

## Context and memory

### Context assembly

Context is assembled in this order:

1. server-owned safety and policy instructions;
2. pinned AgentVersion instructions;
3. current task and room instructions;
4. explicitly selected authorized messages and document revisions;
5. authorized memory records;
6. authorized retrieval results;
7. bounded prior tool observations.

Authorization filtering MUST occur before semantic ranking or model context construction. The context assembler MUST create a ContextManifest containing each item's type, resource identifier, revision, content hash, token estimate, trust class, and policy decision. The manifest is auditable; it MUST NOT duplicate secret or unrestricted content.

Untrusted content MUST remain distinguishable from server instructions. Text inside an attachment, document, retrieval result, tool response, or MCP description cannot change policy, enable a tool, or grant permission.

### Memory scopes

| Scope | Purpose | Write rule | Read rule |
| --- | --- | --- | --- |
| turn | Temporary material for one run | Runtime may write within the run | Destroy or expire after the configured run retention |
| actor | Preferences private to one Actor | Explicit Actor action or governed proposal | Only that Actor and explicitly allowed assistants |
| project | Confirmed facts, decisions, and artifacts | Authorized human approval or explicit low-risk project policy | Authorized project members after resource filtering |
| workspace | Governed knowledge shared across projects | Workspace curator approval | Only projects and Actors allowed by workspace policy |

Raw chat history MUST NOT become durable memory automatically. A durable MemoryRecord includes scope, tenantId, projectId where applicable, ownerActorId, content, contentHash, originReferences, createdByActorId, approvedByActorId when required, sensitivity, retention policy, expiresAt, version, and status.

Memory retrieval MUST return record references with relevance and policy metadata. A user can inspect, correct, expire, export, or delete memory they control. Deletion MUST propagate to indexes and caches. A summary is a new derived record and retains references to the records it summarizes.

### Context limits

Input context and generated output have separate limits. When context exceeds its allowance, the runtime applies a deterministic policy: mandatory instructions, current request, referenced artifacts, recent relevant messages, governed memories, then optional background. Truncation MUST be reported in context.assembled with counts and categories, without exposing omitted secret content.

## Budget enforcement

Each run pins a BudgetPolicy with:

- maxInputTokens;
- maxOutputTokens;
- maxTotalTokens;
- maxCostMinorUnits and currency;
- maxDurationMs and deadlineAt;
- maxTurns;
- maxToolCalls;
- maxParticipants;
- maxParallelModelCalls;
- maxParallelToolCalls;
- optional per-tool and per-participant limits.

Budgets are cumulative across all collaboration participants, retries, model reasoning turns, summaries, and tool calls. Child activities reserve from the parent run budget; they do not receive independent unlimited allowances.

The server MUST reserve estimated capacity before a provider or tool call, then reconcile with measured usage. Durable counters MUST be updated atomically. A client or model cannot raise a budget. An authorized human may create a new budget revision only while the run is paused or waiting, and the change MUST be audited.

budget.warning SHOULD be emitted at configured thresholds. On a hard limit:

- no new costly or side-effecting action may start;
- in-flight accounting is completed;
- a safe partial response MAY be persisted as incomplete;
- the run ends with BUDGET_EXHAUSTED unless it already has a valid final result.

Time waiting for human input or approval is tracked separately from active execution time, while deadlineAt still limits total lifetime.

## Tool capability contract

### Tool definition

A registered ToolCapability contains:

- stable capabilityId and immutable version;
- localized name and description;
- input and output JSON Schemas;
- effect class: read, internal_write, external_write, destructive, financial, permission_change, or publish;
- risk level and approval policy;
- allowed resource scopes;
- timeout, response-size, retry, and concurrency limits;
- credential reference, never credential material;
- network and sandbox policy;
- provider adapter and integrity hash;
- lifecycle state.

Only published, active, explicitly allowed versions may be included in an AgentVersion.

### Tool gateway

Every invocation passes through one server-owned gateway in this order:

1. Resolve the stable capability and pinned version.
2. Intersect the run snapshot with current Actor, resource, room, and tool authorization.
3. Validate arguments against schema, resource ownership, and tenant scope.
4. Classify risk and resolve approval.
5. Check and reserve budget.
6. Create a side-effect idempotency key.
7. Inject scoped credentials after the model-visible boundary.
8. Execute through the configured network or sandbox policy.
9. Validate, size-limit, and redact the result.
10. Persist tool facts and budget usage.
11. Return the result to the model as untrusted data.

The model receives tool schemas, not credentials or arbitrary connection configuration. Tool selection MUST use server-issued identifiers. Model-generated URLs, capability IDs, resource IDs, and account IDs MUST be validated independently.

### Tool outcomes

Tool outcomes use stable categories:

- succeeded;
- invalid_arguments;
- authorization_denied;
- approval_required;
- retryable_failure;
- non_retryable_failure;
- uncertain_external_outcome;
- cancelled;
- timed_out.

Retries MUST obey the tool policy and remaining run budget. Authorization, approval, and validation failures are never converted into retryable model observations. An uncertain external outcome requires reconciliation or human review before another write attempt.

## MCP boundary

MCP is an adapter boundary behind the tool gateway, not an authorization system.

### Registration and discovery

- An MCP server configuration MUST be registered, versioned, and activated by an authorized human.
- Automatic installation or activation by an AI Actor is forbidden.
- Streamable HTTP is the primary remote transport. SSE MAY be enabled with the same policy controls.
- Initialization and tools/list discovery MUST be bounded by timeout, page count, response size, and duplicate-cursor protection.
- Discovered tool descriptions and schemas are untrusted configuration data.
- The local registry maps a remote tool name to a stable capabilityId and approved schema hash.
- A short-lived discovery cache MAY be used, but the exact tool and compatible schema MUST be revalidated before execution.

### Network policy

Outbound MCP traffic MUST:

- use HTTPS unless an explicitly isolated development policy permits otherwise;
- reject loopback, link-local, multicast, cloud metadata, and unauthorized private addresses;
- validate resolved IP addresses before connection and after DNS changes;
- deny redirects by default, or revalidate every redirect hop;
- use tenant or capability domain allowlists;
- enforce connection, request, idle, and total timeouts;
- cap request and response bytes;
- prevent credential forwarding to a different origin.

### Data and credentials

MCP credentials are obtained from a server-side broker and injected only for the approved capability and origin. They MUST NOT be exposed to the browser, model prompt, message store, or ordinary audit payload.

MCP responses, errors, tool annotations, and returned links are untrusted. They cannot request additional tools, modify the approval decision, or alter the active AgentVersion. Sensitive keys and values MUST be redacted before persistence or model reuse.

## Human approval

Approval is a one-time authorization for one fully bound proposed action. It is not a role grant.

Approval is required by default for external_write, destructive, financial, permission_change, publish, sensitive-data export, and any policy-selected high-risk action.

An ApprovalRequest contains:

- approvalId, runId, and stateVersion;
- capabilityId and version;
- canonical argument hash and a human-readable summary;
- target resources and effect class;
- acting Agent, delegating Actor, and requesting Actor;
- policy version and risk reasons;
- createdAt and expiresAt;
- required approver role and separation-of-duty rule.

Only an authenticated, currently authorized human may resolve an approval. AI and system Actors cannot approve. The approver MUST see the material action, target, and impact. Approval is invalid if arguments, target, tool version, Agent version, delegating Actor, policy version, or expiry changes.

Approval transitions the run to waiting_approval. Approval emits approval.approved and requeues the run; rejection emits approval.rejected and fails or safely skips the action according to the pinned plan. Expiry emits approval.expired. Every decision records approver, timestamp, optional comment, and the bound action hash.

## Document proposals

An AI Actor MUST NOT silently replace shared document content. It creates a DocumentProposal containing:

- proposalId, documentId, and baseRevisionId;
- structured block operations or patch;
- preview and concise rationale;
- author Actor, AgentProfile, AgentVersion, runId, and messageId;
- affected ranges or block identifiers;
- content and patch hashes;
- createdAt and expiry;
- status: open, applied, partially_applied, rejected, conflicted, or expired.

An authorized human may accept all, accept selected operations, reject, or request revision. Acceptance checks current document authorization and base revision. If the base changed, the proposal becomes conflicted and MUST be rebased or manually resolved; it MUST NOT use last-write-wins.

Applying a proposal creates a new immutable document revision and records the accepting human as the decision Actor while preserving the AI author. Publication or external delivery of the resulting document follows the normal tool and approval policy.

## Idempotency and recovery

### Command idempotency

The server stores the outcome of each idempotencyKey within its tenant and operation scope. Repeating the same key and payload returns the original result. Reusing a key with a different payload returns a conflict.

Message creation, run creation, approval resolution, proposal resolution, budget change, and tool dispatch MUST be idempotent.

### Transactional event publication

State changes and durable events MUST be committed atomically through a transactional outbox or equivalent guarantee. Event delivery is at least once. Consumers deduplicate by eventId and maintain a durable projection cursor.

### External side effects

Where supported, the runtime sends a stable idempotency key to external tools. A retry may occur automatically only when:

- the prior attempt is known not to have completed the side effect; or
- the external system guarantees idempotency for the same key.

Timeout after dispatch is uncertain_external_outcome. The run pauses for reconciliation or approval and MUST NOT blindly repeat the write.

### Recovery

A recoverable worker failure retains the run in a non-terminal state until lease expiry. Recovery:

1. acquires a new lease and increments attempt;
2. loads the latest snapshot and durable event sequence;
3. rebuilds derived state by replay;
4. reconciles any started but unfinished external activity;
5. resumes from the next safe checkpoint.

Projection loss MUST be recoverable from durable events and snapshots. Raw model deltas need not be replayable if the complete assistant message was durably committed.

## Audit, privacy, and retention

Audit records are append-only security facts distinct from operational logs and user-visible messages.

Every run audit trail MUST include:

- Actor identities and delegation;
- AgentProfile, AgentVersion, policy, workflow, and tool versions;
- authorization snapshot and current-policy decisions;
- ContextManifest references and hashes;
- model provider/model identifier and token/cost totals;
- tool arguments hash, result hash, status, duration, and idempotency key;
- approval request and resolution;
- memory proposals and commits;
- document proposal and revision decisions;
- state transitions, attempts, cancellation, and terminal reason.

Ordinary logs MUST NOT contain access tokens, provider secrets, tool credentials, raw sensitive attachments, or unrestricted prompts and results. Redaction MUST inspect both field names and value patterns. Sensitive audit payloads require separate access control, encryption, retention, and access auditing.

Audit queries always require tenant scope. Cross-tenant operator access is an explicit break-glass action with reason, expiry, and its own audit event. Retention, deletion, export, and legal-hold operations MUST cover the message store, memory, object storage, indexes, event payloads, and derived projections.

## Stable failure codes

At minimum, the runtime exposes:

- CONTEXT_SCOPE_MISSING;
- AUTHENTICATION_REQUIRED;
- AUTHORIZATION_DENIED;
- AGENT_VERSION_UNAVAILABLE;
- INVALID_STATE_TRANSITION;
- STATE_VERSION_CONFLICT;
- CONTEXT_LIMIT_EXCEEDED;
- BUDGET_EXHAUSTED;
- TOOL_NOT_ALLOWED;
- TOOL_ARGUMENT_INVALID;
- APPROVAL_REQUIRED;
- APPROVAL_INVALID;
- MCP_ENDPOINT_BLOCKED;
- MCP_PROTOCOL_ERROR;
- EXTERNAL_OUTCOME_UNCERTAIN;
- DOCUMENT_REVISION_CONFLICT;
- CANCELLED;
- RUN_DEADLINE_EXCEEDED;
- INTERNAL_RECOVERABLE;
- INTERNAL_FATAL.

Failure responses expose a safe user message, stable code, requestId, and retry guidance. They MUST NOT expose secrets, internal prompts, credentials, or cross-tenant identifiers.

## Acceptance criteria

### Identity and versions

1. Given an AI room member, every produced message, event, tool call, and proposal identifies its Actor, AgentProfile, AgentVersion, and delegating Actor.
2. Editing a draft and publishing a new version does not change any prior run or historical replay.
3. Suspending a membership or removing a permission blocks the next retrieval or tool call in an already running run.
4. Granting a new permission during a run does not expand that run without explicit reauthorization.

### Collaboration and state

5. Mention mode never starts an unmentioned AI participant.
6. Facilitated and roundtable modes cannot exceed their participant, turn, parallelism, or shared budget limits.
7. Each legal state transition increments stateVersion and emits exactly one logical durable event despite duplicate command delivery.
8. A stale stateVersion returns a conflict and leaves persisted state unchanged.
9. After worker termination, a new worker resumes from the last checkpoint without duplicating a committed message, approval, document revision, or tool side effect.
10. After cancellation is acknowledged, no new model or tool call starts.

### Events, context, and memory

11. Reconnecting with a last durable sequence returns all later durable events in order without logical duplicates.
12. An unauthorized message, document, memory, or retrieval item is filtered before ranking and never appears in the model context.
13. ContextManifest identifies every included item and reports deterministic truncation without copying restricted content.
14. Raw chat history is not promoted to actor, project, or workspace memory without the required explicit action or approval.
15. Deleting a governed memory removes it from subsequent retrieval and its derived indexes within the defined processing window.

### Budgets

16. Aggregate usage across multiple Agents and retries cannot exceed the pinned hard token, cost, duration, turn, tool-call, participant, or concurrency limit.
17. A hard budget breach prevents new costly actions, persists final accounting, and returns BUDGET_EXHAUSTED unless a valid final result already exists.
18. Client or model payloads attempting to raise a budget are ignored or rejected and create a security audit event.

### Tools and MCP

19. A tool call with an unknown capability, incompatible version, invalid schema, wrong tenant resource, revoked permission, or missing approval never reaches the adapter.
20. Tool credentials are absent from browser responses, prompts, messages, runtime events, ordinary logs, and model-visible tool results.
21. MCP requests to loopback, link-local, metadata, unauthorized private, disallowed-domain, or redirect-bypass targets are blocked before sending credentials.
22. An MCP tool missing from current discovery or presenting an incompatible schema is not called.
23. An uncertain external write is not retried automatically and moves to reconciliation or human review.

### Approval and documents

24. Changing any bound approval field invalidates the approval.
25. An AI or system Actor cannot approve, and an unauthorized human cannot resolve an approval.
26. An AI document edit remains a proposal until accepted by an authorized decision Actor or an explicit low-risk policy.
27. Applying a proposal against a changed base revision returns DOCUMENT_REVISION_CONFLICT and never overwrites newer content.
28. The created document revision preserves both the AI author and human acceptance decision.

### Audit and security

29. An authorized auditor can reconstruct Actor, delegation, Agent version, context references, policy decisions, budget, tool facts, approvals, document decisions, attempts, and terminal reason for one run.
30. Canary secrets injected into credentials, prompts, attachments, and tool results do not appear in ordinary logs or non-sensitive event payloads.
31. Missing tenant, project, room, or delegation context fails closed with a stable code.
32. Duplicate commands and at-least-once event delivery produce one logical outcome and one auditable decision.
