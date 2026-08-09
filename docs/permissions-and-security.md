# HaloAI permissions and security specification

## 1. Purpose and normative language

This document defines HaloAI's authorization model, tenant boundary, security controls, and release acceptance criteria. `MUST`, `MUST NOT`, `SHOULD`, and `MAY` are normative requirements.

Every protected operation MUST be evaluated by the server as:

```text
authorize(subject, action, resource, context)
  -> allow | deny | require_approval
  + obligations
```

Obligations can require redaction, read-only access, a spending cap, a specific approver, or an audit event. The default decision is `deny`. Subject identity, workspace membership, and tenant scope MUST come from the authenticated server context, never from client-supplied identity or tenant fields.

## 2. Identity, role, and persona separation

`Actor`, `AccessRole`, and `Persona/AgentProfile` are separate concepts:

- An `Actor` is an accountable human or non-human identity.
- An `AccessRole` grants capabilities within a scope.
- A `Persona/AgentProfile` describes an AI teammate's behavior, model, instructions, and presentation. It grants no authority by itself.

### 2.1 Subject types

| Subject | Authentication source | Allowed role types | Mandatory constraints |
|---|---|---|---|
| Human user | Enterprise SSO or a first-party user session | Workspace and project roles | Session assurance, membership status, and optional device/IP conditions |
| AI actor | Dedicated agent identity and immutable agent version | Agent-scoped roles | No interactive login; every run records its delegator or sponsor |
| Service account | OAuth client or workload identity | Integration-specific roles | Short-lived, audience-bound, revocable credentials |
| External integration | OAuth grant, signed webhook, or approved connector | Connector-scoped roles | Tool allowlist, egress policy, and credential isolation |
| System worker | Internal workload identity | Queue-worker capabilities | May process only the workspace and resource named by a durable job |
| Support operator | Strong internal authentication | Time-bound break-glass grant | Dual approval, customer-visible audit, and automatic expiry |

An AI actor MUST NOT obtain, copy, simulate, or refresh a human login session. A system worker MUST NOT inherit broad application-administrator authority merely because it runs trusted code.

### 2.2 Built-in role templates

| Role template | Default purpose |
|---|---|
| Workspace Owner | Workspace lifecycle, ownership, security, membership, billing, export, and deletion |
| Workspace Admin | Membership, projects, agents, and integrations, excluding secret disclosure and destructive ownership operations |
| Security Admin | Policies, session revocation, audit, retention, and integration approval |
| Billing Admin | Usage, budgets, and billing without automatic access to conversation or document contents |
| Agent Manager | Agent creation, versioning, model assignment, and tool-scope configuration |
| Member | Collaboration in explicitly accessible projects, rooms, and artifacts |
| Guest | Access only to resources explicitly shared with the guest membership |
| Auditor | Read-only audit and compliance export; content access requires a separate grant |
| Agent Member | Messaging and artifact actions within an explicitly delegated scope |

Built-in roles are templates over capabilities. Custom roles MUST be capability sets, not page paths or UI menu definitions. A principal MUST NOT assign capabilities it does not hold, except through a separately authorized administrative workflow.

## 3. Resource and action matrix

| Resource | Actions | Typical holders | Required conditions |
|---|---|---|---|
| Workspace | `read`, `update`, `export`, `delete` | Owner; selected Admin roles | Active membership; deletion requires step-up authentication and confirmation |
| Membership | `invite`, `read`, `update`, `remove` | Owner, Workspace Admin | Cannot remove the last Owner or grant above the caller's delegation ceiling |
| Role and policy | `create`, `read`, `update`, `delete`, `assign` | Owner, Security Admin | No self-elevation; policy version and changes are audited |
| Project and room | `create`, `read`, `update`, `archive`, `manage_members` | Authorized workspace members | Matching workspace, project scope, room ACL, and classification |
| Message and thread | `read`, `create`, `edit_own`, `delete_own`, `moderate` | Room participants and delegated agents | Membership is rechecked on read and send; edits preserve history |
| Artifact and document | `create`, `read`, `update`, `comment`, `approve`, `publish`, `delete`, `restore` | Project members and delegated agents | Artifact ACL, current version, classification, and approval policy |
| Artifact version | `read`, `compare`, `restore` | Artifact readers; editors for restore | Restore creates a new version and never overwrites history |
| File and attachment | `upload`, `read`, `download`, `delete` | Room or artifact participants | Malware scan, type/size limits, and short-lived signed delivery |
| Knowledge and memory | `read`, `write`, `mount`, `delete` | Explicit members and agents | Authorization filtering occurs before ranking or model context assembly |
| Agent profile and version | `create`, `read`, `update`, `delete`, `invoke` | Agent Manager; authorized invokers | Configuration and invocation are separate capabilities; run uses an immutable version |
| Secret and credential binding | `bind`, `rotate`, `revoke` | Owner, Security Admin | Plaintext is never returned; binding scope is narrower than the managing actor |
| Tool and integration | `install`, `configure`, `invoke`, `disable` | Admin for management; agents for scoped invocation | Allowlist, argument policy, risk class, egress policy, and approval state |
| Run and job | `create`, `read`, `cancel`, `retry` | Initiator, sponsor, project administrator | Budget, concurrency, idempotency, delegation, and current authorization |
| Approval | `request`, `read`, `approve`, `reject` | Named approvers | Requesting agent cannot approve; bound parameters and expiry still match |
| Usage and budget | `read`, `manage`, `export` | Owner, Billing Admin; scoped personal view | Workspace and reporting scope are explicit |
| Notification | `read`, `mark_read`, `delete` | Intended membership only | User, workspace, and membership all match |
| Audit event | `read`, `export` | Security Admin, Auditor | Read-only; sensitive fields are redacted by content permission |
| Retention policy | `read`, `update`, `legal_hold` | Owner, Security Admin | Legal hold overrides ordinary expiry and deletion |

## 4. Conditions and AI authority intersection

Policy evaluation MUST support at least these conditions:

- active workspace and project membership;
- resource workspace, project, room, and ACL membership;
- ownership and document classification;
- session assurance, recent MFA, device, IP, region, and time window where configured;
- agent version, sponsor, delegation expiry, and purpose;
- model, tool, connector, network, and argument restrictions;
- action risk class and approval state;
- token, monetary, time, turn, participant, and tool-call budget;
- data residency and retention policy.

An AI run's effective authority is:

```text
agent role grants
INTERSECT delegating human or sponsor grants
INTERSECT resource ACL
INTERSECT tool and connector policy
INTERSECT data-classification policy
INTERSECT active approval obligations
```

For an interactive run, the delegating human is the user who invoked the agent. For a scheduled or autonomous run, a designated sponsor or service principal MUST be recorded with an explicit purpose, scope, budget, and expiry.

An authorization snapshot records why a run was accepted, but it MUST NOT preserve revoked access. Authorization MUST be re-evaluated before every retrieval, secret binding, tool call, external side effect, and artifact publication. Approval MUST bind the tool, normalized argument digest, agent version, delegator, approver, workspace, and expiration. Any material parameter change invalidates the approval.

## 5. Tenant isolation

1. Every tenant-owned durable record MUST contain `workspace_id`; project-owned records MUST also contain `project_id` where applicable.
2. PostgreSQL row-level security MUST enforce workspace scope in addition to repository predicates. Missing tenant context MUST fail closed.
3. Composite uniqueness and foreign keys MUST include or validate workspace ownership so cross-workspace relationships cannot be created.
4. Object storage paths, cache keys, vector namespaces, search documents, realtime topics, rate-limit keys, and queue jobs MUST be workspace-namespaced.
5. Retrieval MUST apply authorization and tenant filters before semantic ranking, reranking, or model-context construction.
6. Signed file URLs MUST be short-lived and issued only after a fresh authorization check.
7. Workers MUST obtain workspace context from a signed durable job and revalidate resource ownership before execution.
8. Cross-workspace support access MUST use a time-bound break-glass grant. A query parameter is never sufficient authority.

No generic repository method may return an unscoped database handle when tenant context is absent. Platform-wide reporting MUST use a separate, explicitly privileged path with aggregated or redacted results.

## 6. Authentication and session security

- Browser sessions MUST use `HttpOnly`, `Secure`, and appropriate `SameSite` cookies. Access and refresh credentials MUST NOT be stored in `localStorage` or `sessionStorage`.
- The default access lifetime SHOULD be 15 minutes or less. Refresh sessions SHOULD be 30 days or less and MUST rotate on use.
- Refresh-token reuse MUST revoke the affected token family and produce a security audit event.
- State-changing cookie-authenticated requests MUST have CSRF protection and origin validation.
- Session records MUST support per-device and all-device revocation, idle timeout, absolute timeout, and workspace-role change invalidation.
- MFA or equivalent step-up authentication MUST protect ownership transfer, workspace deletion, credential changes, audit export, and break-glass access.
- Tokens MUST NOT appear in URLs. Realtime and streaming connections MUST use the authenticated cookie or a single-use, audience-bound, short-lived connection ticket.
- Workload and connector tokens MUST be short-lived, audience-bound, scope-bound, revocable, and distinct from user sessions.
- Logout, membership removal, account suspension, or role reduction MUST invalidate API and realtime access promptly.

## 7. Notification security

Each notification MUST be scoped by `user_id`, `workspace_id`, and `membership_id`. A notification may contain a category, typed i18n key and arguments, sanitized text summary, structured internal target, read timestamp, and non-sensitive metadata.

- Listing, realtime delivery, unread counts, and read mutations MUST match all three scope fields.
- Switching workspace or membership MUST not expose notifications from the previous context.
- Internal navigation targets MUST be structured resource references, not arbitrary scriptable URLs.
- Notification content MUST be plain text or strictly sanitized; it MUST NOT contain credentials, complete sensitive prompts, or unrestricted model HTML.
- Realtime topics MUST be authorized at subscribe time and revalidated after membership or role changes.
- Notifications are informational projections. Receiving a notification never grants access to its linked resource.

## 8. Credential and connector security

- Provider keys, OAuth refresh tokens, webhook secrets, and tool credentials MUST be envelope-encrypted with keys managed outside the application database.
- Plaintext credentials MUST never enter browser bundles, prompts, chat messages, notifications, ordinary logs, audit payloads, queue payloads, or model-provider requests that do not require them.
- Agents receive opaque credential bindings, not secret values. A server-side credential broker performs the authorized call or mints a narrower short-lived token.
- Third-party tokens MUST NOT be passed through to connector or MCP servers unless the protocol explicitly requires a correctly audience-bound token issued for that server.
- Each agent and integration MUST have an independent binding that can be rotated and revoked without affecting unrelated actors.
- Outbound connections MUST enforce HTTPS by default, destination allowlists, DNS/IP validation, redirect limits, response-size limits, cancellation, and timeouts.
- Loopback, link-local, cloud metadata, and private network destinations MUST be denied unless a reviewed integration policy explicitly permits them.
- Tool installation and scope expansion require an authorized human; an AI actor cannot install, approve, or widen its own tools.

## 9. Usage ledger and budgets

Usage accounting MUST use an append-only ledger rather than a mutable counter as the sole source of truth. Ledger entries include:

```text
reservation | settlement | release | adjustment
```

Every entry MUST include workspace, run, actor, agent version, provider/model, measured units, monetary amount when known, currency, idempotency key, and timestamp.

- A run reserves its worst-case bounded usage atomically before model or tool execution.
- Settlement replaces the reservation with provider-reported or policy-approved measured usage.
- Failure, cancellation, and expiry release unused reservations.
- Duplicate provider responses or worker retries MUST settle once through an idempotency key.
- Budgets MAY be configured per workspace, project, user, agent, model, tool, and time window.
- Limits MUST include tokens, money, duration, turns, participants, concurrent runs, and tool calls.
- Materialized counters are permitted for performance but MUST be rebuildable from the ledger and reconciled regularly.
- Budget exhaustion MUST stop new chargeable steps safely and MUST NOT silently skip audit or settlement.

## 10. Durable jobs, retries, and recovery

Long-running agent, indexing, projection, export, and cleanup work MUST use a durable queue and a transactional outbox. In-process promises, timers, or detached tasks are not a source of truth.

The minimum job state machine is:

```text
queued -> running -> waiting_approval -> running
                   -> succeeded
                   -> failed -> queued (retry)
                   -> dead_letter
queued/running/waiting_approval -> cancelled
```

- Delivery is at least once; handlers MUST be idempotent.
- Each job has a stable idempotency key, attempt number, lease, heartbeat, timeout, cancellation token, and workspace scope.
- Retry policy MUST classify retryable and permanent failures and use bounded exponential backoff with jitter.
- Non-idempotent side effects MUST use an external idempotency key or a persisted effect record before retry.
- Expired leases MUST be reclaimable after worker failure. Poison jobs move to a dead-letter queue with an operator-visible reason.
- Interactive, background, and scheduled work MUST use separate concurrency lanes. At least one execution slot SHOULD remain available for interactive work when capacity exceeds one.
- A resumed job MUST re-check membership, policy, approval, budget, resource version, and credential binding before continuing.
- Cancellation MUST stop future chargeable steps, release reservations, and preserve an auditable terminal state.

## 11. Audit specification

Security audit events are append-only and separate from diagnostic application logs. A minimum event contains:

```text
id, occurred_at, workspace_id,
subject_type, subject_id, membership_id,
on_behalf_of_subject_id, session_id, run_id, trace_id,
action, resource_type, resource_id,
decision, policy_version, obligations, approval_id,
agent_version, tool_id, model_provider, model_name,
request_summary_hash, before_hash, after_hash,
outcome, error_code, source_ip, user_agent
```

The system MUST audit authentication events, session revocation, membership and role changes, policy decisions for sensitive actions, agent/version changes, credential binding changes, tool calls, approvals, exports, publication, deletion, retention changes, break-glass access, and billing adjustments.

Audit records MUST NOT contain plaintext secrets. Full prompts, responses, and tool payloads belong in a separately encrypted, access-controlled payload store with a shorter retention period. Enterprise deployments SHOULD support tamper-evident hashing or write-once storage. Ordinary workspace administrators MUST NOT edit or delete audit records.

## 12. Retention, deletion, and legal hold

Retention is an enforced lifecycle, not a configuration-only field. Recommended defaults are:

| Data class | Recommended default | Required deletion behavior |
|---|---:|---|
| Access credential | 15 minutes | Invalid after expiry |
| Refresh session | Up to 30 days | Rotation and revocation invalidate immediately |
| Notification | 90 days | Remove body and metadata at expiry |
| Diagnostic log | 30 days | Must not contain secrets or full prompts |
| Full AI prompt/response payload | 30–90 days | Workspace may disable storage; encrypt separately |
| Chat and artifact content | Workspace policy | Soft-delete window followed by complete purge |
| Audit event | At least 365 days or enterprise policy | Append-only until expiry or legal-hold release |
| Usage ledger | Applicable accounting period | Preserve immutable accounting fields; minimize content |
| Backup | 30–35 day rolling window | Automatic expiry; support cryptographic erasure where required |

Deletion MUST propagate to primary rows, object storage, search indexes, vector stores, caches, derived memories, projections, and pending jobs. A legal hold prevents ordinary deletion and records who applied or released it. Cleanup jobs MUST be resumable, observable, and idempotent. The system MUST produce a deletion record without reproducing the deleted content. Backups MUST expire on schedule; urgent erasure MAY use per-workspace envelope-key destruction where physical backup rewriting is impractical.

## 13. Threat, control, and acceptance matrix

| Threat | Required controls | Acceptance evidence |
|---|---|---|
| Cross-tenant IDOR and data leakage | Server-derived scope, RLS, namespaced storage/cache/search/vector/realtime/queue | A workspace A credential cannot read, infer, subscribe to, retry, or mutate any known workspace B resource ID |
| Token theft, fixation, or replay | HttpOnly cookies, rotation, reuse detection, CSRF, revocation, MFA | XSS cannot read credentials; replayed refresh token revokes its family; logout terminates API and realtime use |
| Privilege escalation or confused deputy | Capability policy, delegation intersection, reauthorization, no self-elevation | Client-supplied role/workspace is ignored; revoked human authority blocks the next agent retrieval or tool call |
| Prompt injection and tool exfiltration | Treat content as data, external policy, argument schemas, sandbox, egress allowlist, approval | Malicious documents and webpages cannot reveal secrets, widen tools, or cause unapproved external writes |
| Retrieval leakage | ACL before ranking, scoped embeddings and caches | Forbidden chunks never appear in search candidates, citations, logs, or model context |
| Credential disclosure | Secret broker, encryption, redaction, short-lived bindings | Automated scans find no plaintext key in browser output, database payloads, queues, prompts, logs, or notifications |
| SSRF and hostile endpoints | Destination policy, DNS/IP checks, timeout, redirect and size limits | Loopback, metadata, private-address, and DNS-rebinding attempts are rejected |
| XSS and hostile files | Output sanitization, CSP, MIME/magic checks, malware scan, parser sandbox and limits | Markdown/SVG/HTML payloads do not execute; disguised files and decompression bombs are quarantined |
| Duplicate jobs and repeated side effects | Durable state, idempotency, lease, effect record, bounded retry | Process termination at each job boundary eventually completes once without duplicate publish, email, delete, or payment |
| Runaway agents and budget exhaustion | Atomic reservation, multi-scope limits, concurrency lanes, cancellation | Concurrent load cannot exceed budget; cancellation releases unused reservation and prevents further tool calls |
| Audit tampering | Append-only permissions, integrity protection, separate storage | Workspace administrators cannot alter or delete security events; traces reconstruct the action and delegation chain |
| Incomplete deletion | Enforced retention, deletion fan-out, legal hold, backup expiry | Time-based tests verify removal from every online store while held data remains until hold release |
| Insider support abuse | JIT break-glass, dual approval, expiry, customer-visible audit | Support access without a valid grant fails; expired access is immediately denied and every read/export is recorded |

## 14. Mandatory attack acceptance suite

The following tests are release gates for the affected capability:

1. `TEN-01`: Attempt cross-workspace REST, SSE, realtime, object download, search, vector retrieval, notification, job retry, and export access using known foreign UUIDs.
2. `TEN-02`: Remove tenant context from repository and worker calls; every path must fail closed.
3. `AUTH-01`: Run an XSS probe and verify browser credentials are unreadable and CSP blocks unauthorized execution.
4. `AUTH-02`: Replay a rotated refresh token and verify token-family revocation plus an audit event.
5. `AUTH-03`: Revoke a session or membership while realtime connections and an agent run are active; subsequent events and protected steps must stop.
6. `AUTHZ-01`: Modify client-supplied actor, workspace, role, owner, and approval fields; server-derived values must prevail.
7. `AUTHZ-02`: Reduce a delegator's role after run creation; the next retrieval, tool call, and publication must be denied or require a new approval.
8. `AI-01`: Insert instructions in a document, webpage, attachment, and connector response requesting secret disclosure or policy bypass; no authority may change.
9. `AI-02`: Submit tool arguments outside the schema, resource scope, destination allowlist, or approval digest; execution must fail before side effects.
10. `APR-01`: Let an agent attempt to approve its own action or reuse approval after changing parameters; both attempts must fail.
11. `SEC-01`: Scan browser bundles, prompts, payload tables, queues, notifications, diagnostic logs, and audit events for seeded secrets; no plaintext occurrence is allowed.
12. `EGR-01`: Probe loopback, link-local, cloud metadata, private IP, redirects, oversized responses, slow responses, and DNS rebinding.
13. `CNT-01`: Test scriptable Markdown, SVG/HTML, MIME confusion, macro files, path traversal, decompression bombs, and oversized parser inputs.
14. `QUE-01`: Terminate a worker after enqueue, lease, provider response, effect preparation, and result persistence; recovery must be deterministic.
15. `QUE-02`: Deliver the same job and provider response repeatedly; usage settlement and external effects must occur once.
16. `USE-01`: Start concurrent runs at the budget boundary; atomic reservations must prevent overspend.
17. `AUD-01`: Attempt audit update/deletion as Owner, Admin, Worker, and database application role; all unauthorized mutations must fail.
18. `RET-01`: Advance retention time and verify purge across database, objects, search, vectors, caches, derived memories, and jobs; repeat with legal hold enabled and then released.
19. `NOT-01`: Switch workspace and membership, then attempt to list, subscribe to, count, or mark a previous membership's notifications.
20. `SUP-01`: Attempt cross-workspace support access without approval, after expiry, and outside the approved resource scope.

## 15. Prohibited designs

HaloAI MUST NOT ship any of the following:

- authorization based only on prompts, hidden buttons, menus, page paths, or client-provided tenant IDs;
- a fail-open repository or worker path when workspace or project context is missing;
- an AI actor using or impersonating a human login session;
- access or refresh credentials in browser storage or URL query strings;
- plaintext secrets in prompts, messages, notifications, logs, audit records, queues, or ordinary downstream payloads;
- unrestricted token pass-through to tools, connectors, plugins, or MCP servers;
- indefinite storage of complete prompts and responses without policy, encryption, and deletion;
- in-memory-only jobs, approvals, usage settlement, or audit writes;
- retry of non-idempotent effects without an idempotency key or persisted effect record;
- a mutable `used_tokens` counter as the only accounting record;
- notifications scoped only by user rather than user, workspace, and membership;
- unsanitized model or connector HTML rendered in the product;
- arbitrary outbound network access or user-configured endpoints without SSRF controls;
- automatic plugin installation, tool-scope expansion, permission creation, or self-approval by AI;
- deletion of only the primary database row while derived or copied data remains;
- permanent, unlogged, or query-parameter-based support access to customer workspaces.

## 16. Definition of done

A new protected resource is incomplete until it defines its workspace and project scope, actions, default roles, policy conditions, audit events, retention class, deletion path, and negative authorization tests. A new tool or connector is incomplete until it defines its credential binding, destination policy, argument schema, risk class, approval rule, idempotency behavior, budget units, and attack acceptance tests.
