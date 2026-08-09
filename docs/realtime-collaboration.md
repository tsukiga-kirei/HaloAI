# HaloAI realtime collaboration specification

## Purpose

This document defines HaloAI's message consistency, Server-Sent Events recovery, collaborative document synchronization, presence, AI document proposal, PWA, and offline behavior.

The goal is not to make every interaction instant at any cost. The goal is to make collaboration predictable: accepted user intent is never duplicated, durable work survives disconnects, authorization remains server-enforced, and users can always understand whether their local view is current.

## Invariants

1. PostgreSQL-backed domain records are the durable source of truth for rooms, messages, runs, proposals, approvals, versions, and audit events.
2. Yjs binary state is the canonical collaborative document state. JSON, HTML, and plain text are derived projections.
3. Presence is ephemeral and never grants authorization.
4. The server assigns durable identifiers, timestamps, stream sequence numbers, and Actor attribution.
5. Client retries are idempotent and cannot create duplicate messages, tool calls, approvals, or document operations.
6. Every realtime connection is authorized for a specific tenant, workspace, room, document, or run. Missing scope fails closed.
7. AI never receives a human session. Every AI event and document operation records its Agent identity, delegating human, profile version, and run identifier.
8. A transient transport failure must not become a permanent “generating” or “saving” state.
9. The client may be optimistic, but it never becomes the authority for permission, completion, or durable ordering.

## Collaboration topology

```text
Web / installed PWA
  -> REST commands and snapshot queries
  <- SSE room and Agent run events
  <-> Hocuspocus WebSocket for Yjs and Awareness

API
  -> authorization and idempotency
  -> message, run, proposal, and approval transactions
  -> durable event/outbox records

Worker
  -> recoverable Agent execution
  -> document projection and compaction

PostgreSQL
  -> durable domain records, replay cursors, Yjs snapshots, and audit
```

REST accepts commands and returns canonical acknowledgements. SSE carries ordered server-to-client events. Hocuspocus WebSocket carries document synchronization and ephemeral Awareness. No transport is permitted to bypass the same server-side authorization policy used by ordinary API requests.

## Message model

### Durable message

A message contains at least:

```text
id
workspaceId
roomId
actorId
actorType
clientMutationId
replyToMessageId?
threadRootId?
status
createdAt
editedAt?
deletedAt?
agentRunId?
```

Message content is represented as typed parts, for example text, document reference, attachment reference, source citation, tool summary, approval reference, and system event. Mentions are stored as explicit relations and are not re-parsed from rendered text when deciding which AI teammates to invoke.

Messages are append-oriented:

- Editing creates a revision and retains attribution.
- Deletion creates a tombstone according to retention policy.
- Retrying an AI answer creates another answer version or run; it does not overwrite history.
- Attachments are separate authorized resources, not trusted inline payloads.

### Send lifecycle

1. The client creates a cryptographically strong `clientMutationId` and an optimistic local message.
2. The API authenticates the human session and derives tenant and room scope from trusted server context.
3. The API validates content, attachment references, mentions, rate limits, and `message.create` permission.
4. One transaction inserts the message, mention relations, required Agent jobs, and an outbox event.
5. A unique constraint on `(actorId, roomId, clientMutationId)` returns the existing message for retries.
6. The API returns the canonical message ID, server timestamp, and room stream cursor.
7. The client replaces the optimistic identity without remounting or visually duplicating the bubble.

Failure behavior:

- Validation and authorization failures remain inline and preserve the draft.
- An ambiguous network failure is retried with the same mutation identifier.
- The client never generates a second mutation identifier automatically for the same user intent.
- An Agent mention is queued only after the human message transaction commits.

### Ordering

Created time is display metadata, not a concurrency primitive. Durable room ordering uses a server-assigned monotonic room sequence. Threads use the same room sequence and explicit parent relations. Clients may temporarily show optimistic messages after the latest canonical item, then reconcile when the server sequence arrives.

## Realtime event envelope

Every durable SSE event uses a versioned envelope:

```text
eventId
streamId
seq
type
workspaceId
roomId?
runId?
occurredAt
payloadVersion
payload
```

Rules:

- `seq` is strictly increasing within one `streamId`.
- A sequence is never shared across tenants.
- `eventId` is globally unique and safe to log; it contains no secret.
- Event payloads contain references and authorized presentation data, not credentials or unrestricted domain rows.
- Unknown optional event types are ignored and recorded for telemetry.
- Unknown breaking payload versions stop that stream and trigger a snapshot refresh.

Initial event families:

```text
room.message.created
room.message.revised
room.message.deleted
room.member.changed
room.unread.changed
run.queued
run.started
run.progress
run.text.delta
run.approval.required
run.completed
run.cancelled
run.failed
proposal.created
proposal.changed
approval.resolved
```

Progress events describe observable stages such as reading authorized documents or applying an approved proposal. They must not include hidden model reasoning.

## SSE subscription and recovery

### Subscription handshake

1. The client fetches the canonical room or run snapshot.
2. The snapshot response includes `streamId` and `snapshotSeq`.
3. The client subscribes with `after=snapshotSeq`, or sends the equivalent last-event cursor.
4. The API revalidates the session and access to the exact stream.
5. The server replays retained events after the cursor, then switches to live delivery.
6. A heartbeat keeps intermediaries and client liveness checks active.

The snapshot and subscription boundary must avoid a race. An event committed after the snapshot query is recoverable because its sequence is greater than `snapshotSeq`.

### Client reducer

For each stream, the client stores the highest contiguous applied sequence.

- `seq <= appliedSeq`: ignore as duplicate.
- `seq === appliedSeq + 1`: apply and advance.
- `seq > appliedSeq + 1`: pause visible reduction, fetch the missing range, then resume.
- An event for a different `streamId`: reject it from the current reducer.

Reducers are deterministic and idempotent. Applying the same event twice produces the same user-visible state. Durable state comes from event payloads or a refreshed snapshot, not from arrival timing.

### Reconnect policy

- Reconnect with exponential backoff and jitter: approximately 1, 2, 4, 8, 16, then at most 30 seconds.
- Do not show an error toast for a connection recovered within two seconds.
- After two seconds, show one low-noise reconnecting indicator.
- Keep the current readable content visible during reconnect.
- Refresh an expired short-lived credential once, then require sign-in if refresh fails.
- On reconnect, send the last contiguous sequence, not the last event merely observed.

### Replay gap and expiry

If the requested sequence is no longer retained:

1. The server returns a replay-expired signal.
2. The client fetches a fresh canonical snapshot.
3. It atomically replaces the affected stream state.
4. It subscribes after the new `snapshotSeq`.

Incremental Agent text events may be compacted after completion because the final durable message is canonical. Compaction must never remove the final answer, source references, usage summary, tool/approval record, or audit attribution.

### Streaming and backpressure

- Buffer model deltas and emit chunks roughly every 50–150ms or after a small payload threshold.
- Do not persist or render one event per token.
- Give every delta a run-local sequence and stable content part identifier.
- Slow clients are disconnected and recover from their cursor; the server does not maintain an unbounded per-connection buffer.
- SSE responses use no-store caching and periodic heartbeat comments or events.
- A terminal `completed`, `cancelled`, or `failed` event closes the run stream after all prior chunks are committed.

### Cancellation

The client sends a REST cancellation command with an idempotency key. The run enters `cancelling` until the worker acknowledges the abort. Only a durable `run.cancelled`, `run.completed`, or `run.failed` event is terminal. Closing the browser connection alone does not cancel a run.

## Multi-tab behavior

- Each tab maintains a correct cursor and can recover independently.
- A local broadcast channel may share unread counts, message acknowledgements, and connection hints, but it is not trusted for authorization or durable state.
- If a single-tab connection leader is introduced later, another tab must take over after leader failure without losing its last durable cursor.
- Logging out or changing account clears local stream state in every tab.

## Collaborative document state

### Canonical Yjs document

Each collaborative document has a stable document ID and Yjs state. Named fragments may separate title and body, but comments, approvals, permissions, and audit records remain explicit domain records unless a deliberate schema decision places them in the shared document.

Persistence rules:

- Store Yjs state as binary bytes.
- Never rebuild a previously collaborative document from JSON on every connection; doing so creates a new history and can duplicate content.
- Store a debounced working snapshot and explicit version checkpoints.
- Record document schema version and snapshot checksum.
- Produce JSON, HTML, and plain-text projections asynchronously for search, preview, export, and authorized AI context.
- A failed projection does not invalidate the canonical Yjs state.

Suggested persistence cadence:

- Debounce normal working snapshots by approximately one second.
- Enforce a maximum delay of approximately five seconds while changes continue.
- Flush pending state during graceful shutdown.
- Create immediate checkpoints for publication, accepted AI proposals, named versions, and permission-sensitive transitions.

### Hocuspocus connection authorization

1. The client requests a short-lived, single-document collaboration ticket.
2. The API verifies tenant, workspace, document, current Actor, and read/edit capability.
3. The ticket binds document ID, Actor ID, capabilities, expiry, and a nonce.
4. Hocuspocus validates the ticket and derives the document name server-side.
5. Read-only participants may receive sync state but cannot submit updates.
6. Expired or revoked capability closes or downgrades the connection.

Document IDs and WebSocket parameters are selectors, never proof of authority. Long-lived session tokens are not placed in URLs or logs.

### Update handling

- Validate encoded update size and connection rate before applying.
- Attribute accepted updates to connection Actor context.
- Mark server-originated AI updates with Agent ID, delegating human, run ID, proposal ID, and transaction origin.
- Reject updates from read-only or expired connections.
- Reconnect by exchanging Yjs state vectors and only the missing update state.
- Protect the server from malformed updates, oversized documents, and update floods.
- Schema-incompatible clients enter read-only mode and must update before editing.

Yjs resolves concurrent structure changes; it does not replace product authorization, versions, approval, or semantic conflict handling.

## Presence and Awareness

Presence uses Yjs Awareness or an equivalent ephemeral channel. It may contain only minimal display information:

```text
actorId
actorType
displayName
avatarReference?
presenceColor
cursorOrSelection?
clientInstanceId
```

Presence must not contain email addresses unless already allowed for display, access tokens, permissions, prompt contents, private document data, or model credentials.

Rules:

- Presence is never persisted as document content or treated as an audit fact.
- Authorization is evaluated independently of presence.
- Cursor and selection updates are throttled.
- Stale clients disappear after disconnect or heartbeat expiry.
- The UI directly shows at most five collaborator avatars, then uses `+N`.
- Actor type is available to assistive technology and is not communicated by color alone.
- AI presence represents an active attributable document transaction or review session, not a fabricated always-online teammate.

## AI document proposals

### Proposal contract

AI does not freely mutate a document by default. It creates a proposal containing:

```text
proposalId
documentId
baseVersionId
baseStateVector?
agentId
agentProfileVersion
delegatedByActorId
runId
operations[]
rationale
citations[]
createdAt
expiresAt?
```

Initial operation types are deliberately narrow:

- Append a section
- Replace a section identified by stable node ID
- Insert a comment
- Suggest a title
- Add a summary

Arbitrary character offsets, unrestricted document replacement, executable content, and permission changes are not accepted operation types.

### Proposal state machine

```text
draft
-> pending_review
-> accepted | partially_accepted | rejected | stale | expired
-> applying
-> applied | apply_failed
```

The acting AI cannot approve its own proposal. Acceptance is bound to the exact proposal version and selected operation hashes.

### Review and application

1. Render an accessible before/after diff and source list.
2. Let the reviewer accept selected operations, accept all, reject, or request revision.
3. Revalidate reviewer permission and proposal expiry.
4. Compare the current document version/state with the proposal base.
5. Mark the proposal stale if the target section changed incompatibly.
6. Apply accepted operations through a server-controlled Yjs transaction with complete origin metadata.
7. Persist the new Yjs state, create a version checkpoint, and append an audit event.
8. Emit proposal and document events only after the durable transaction commits.

Independent section changes may be safely rebased when stable node identity and schema validation make the result unambiguous. Ambiguous conflicts require a refreshed diff or regenerated proposal; they are never silently forced.

## PWA lifecycle

### Installation and updates

- Provide a complete manifest, standalone display mode, theme metadata, and normal plus maskable icons.
- Offer installation only after the user has completed a meaningful action.
- Do not interrupt first-run onboarding with an install prompt.
- When a new application version is ready, show a non-blocking update notice.
- Do not activate an incompatible update while a document has unsynchronized local work.
- If the application and document schema are incompatible, require a safe refresh before allowing further edits.

### Cache policy

| Resource | Strategy |
| --- | --- |
| Versioned application shell, icons, and fonts | Precache or cache-first with versioned names |
| Navigation | Network-first with an offline shell fallback |
| Public immutable assets | Stale-while-revalidate |
| Authentication, permission, approval, and audit APIs | Network-only and no-store |
| SSE responses and run streams | Never cached |
| Authorized recent message/document summaries | Optional local storage only when policy permits |
| Attachments and sensitive documents | Not cached by default |

Local data is partitioned by account, tenant, workspace, and resource ID. Logout, account switch, remote session revocation, and cache schema upgrade clear or invalidate the applicable private data. Browser storage is treated as recoverable convenience storage, not as a trusted secure vault.

## Offline behavior

### MVP offline scope

Supported:

- Open the cached application shell.
- View explicitly permitted recent room and document summaries.
- Preserve unsent message drafts locally.
- Show clear offline and last-synchronized state.
- Copy local content for recovery.

Not supported in the MVP:

- Automatically send an AI invocation when connectivity returns.
- Approve a sensitive action offline.
- Replay an Agent mention without renewed human intent.
- Publish, delete, share, or change permissions offline.
- Promise full offline collaborative document editing.

An offline draft is not a sent message. When the connection returns, the user reviews and explicitly sends it. This avoids triggering an expensive or sensitive AI run long after the original context changed.

### Future offline document editing

Full offline Yjs editing may be enabled only after the product implements:

- Per-account and per-document local state partitioning
- Reliable cache clearing on logout and revocation
- Schema migration and old-client blocking
- Permission revalidation before upload
- Clear UX for locally edited content that can no longer be submitted
- Storage quota and document-size controls

When enabled, local updates synchronize through Yjs state vectors. Authorization is rechecked before accepting them; having local bytes never proves current edit permission.

### Push notifications

- Request permission only after the user experiences product value.
- Support preferences by workspace, room, mention, approval, and completed work.
- Respect quiet hours.
- Hide sensitive message content on lock screens by default.
- Use locale-aware deep links to the exact workspace, room, message, proposal, or approval.
- A notification is a hint; opening it still performs current authorization checks.

## Security and privacy boundaries

- SSE and WebSocket handshakes require authenticated, scoped authorization.
- Origin and cross-site request protections apply to commands and connection-ticket issuance.
- Short-lived collaboration tickets are audience-bound and single-purpose.
- Rendered AI text, rich text, source previews, and imported HTML are untrusted and pass through an allowlist renderer.
- Connection logs redact tokens, message bodies, document contents, and private proposal parameters.
- Rate limits apply by tenant, Actor, IP risk signal, room, document, and run where appropriate.
- Revocation propagates to active streams and collaboration connections within a bounded interval.
- Final audit records are separate from ephemeral transport events and follow the configured retention policy.

## Default limits and retention

Initial defensive defaults, adjustable through measured product needs:

```text
message text                    64 KiB
single SSE event payload        64 KiB
typical text delta chunk        1–8 KiB
single Awareness payload         2 KiB
Awareness updates              <= 20 per second per client
single encoded Yjs update        1 MiB
encoded collaborative document  20 MiB
active realtime connections     bounded per user and tenant
```

Attachments use a separate upload path with independent type, size, scanning, and storage policy.

Suggested replay policy:

- Retain durable room event replay for at least 24 hours or an equivalent bounded sequence window.
- Retain Agent delta events for at least 24 hours after terminal state, then compact them into the canonical message and run summary.
- Retain proposal, approval, version, source, usage, and audit records according to workspace policy; they are not discarded with stream chunks.

## Performance targets

- A canonical message acknowledgement normally arrives within 500ms in the deployment region, excluding attachment upload.
- An already-received SSE event reaches visible state within 100ms.
- Text delta rendering is batched and does not exceed approximately 20 visual updates per second.
- Same-region collaborative document changes normally appear remotely within 250ms.
- Presence updates remain smooth without exceeding the configured update rate.
- Normal SSE and Yjs reconnects converge within five seconds.
- A client with thousands of historical messages does not subscribe to or retain the entire history in memory.
- A slow connection cannot cause unbounded server memory growth.

## Verification matrix

### Message and SSE tests

- Duplicate send with the same mutation ID creates one message and one Agent invocation.
- Ambiguous timeout followed by retry returns the canonical existing message.
- Duplicate, delayed, and out-of-order events reduce to one correct state.
- A missing sequence triggers range recovery.
- An expired replay cursor triggers snapshot replacement.
- Refresh during streaming restores text and terminal state.
- Cancellation, completion, and failure races produce exactly one terminal result.
- Token expiry refreshes once and never leaks events from another tenant.
- Two browser contexts receive the same room order and independent unread state.

### Document collaboration tests

- Two authenticated browser contexts edit simultaneously and converge.
- Disconnect, local editing where allowed, and reconnect do not duplicate content.
- A read-only client cannot submit an update.
- Permission revocation downgrades or disconnects an active editor.
- Malformed, oversized, and flooded updates are rejected safely.
- Stored binary state reloads without rebuilding history from a projection.
- Projection failure leaves the canonical document intact.
- A schema-incompatible client cannot continue writing.

### Proposal tests

- AI cannot approve its own proposal.
- Approval is valid only for the exact proposal and selected operation hashes.
- A stale target section blocks silent application.
- Accepted operations apply once despite command retries.
- The resulting checkpoint, Actor attribution, sources, and audit event are complete.
- Rejected and expired proposals cannot mutate the document.

### PWA and offline tests

- The application shell opens offline without exposing another account's data.
- Logout and account switch clear private local state.
- Offline drafts survive reload but do not send automatically.
- SSE, authorization, approval, and audit responses are never served from cache.
- An update waits while local work is unsynchronized.
- Push deep links reauthorize the target before displaying it.

## Definition of done

Realtime collaboration is complete only when:

- Message commands are idempotent and server ordered.
- Every SSE stream can recover from duplicate, gap, disconnect, refresh, and replay expiry.
- No client remains permanently stuck in a non-terminal run state after the server has terminated it.
- Yjs binary state survives restart and concurrent editing converges.
- Hocuspocus connections enforce current document capability.
- Presence remains ephemeral, minimal, and non-authoritative.
- AI document changes use reviewable proposals and attributable server transactions.
- Offline behavior never silently invokes AI or approves sensitive work.
- Account and tenant boundaries hold across cache, stream, WebSocket, and multi-tab behavior.
- Performance, limits, recovery, security, and cross-browser tests pass.

