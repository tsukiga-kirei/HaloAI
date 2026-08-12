# HaloAI Product Requirements Specification

> Status: Draft 0.1  
> Delivery stage: Foundation to Internal Alpha  
> This document defines the scope, behavior, and acceptance criteria of the first usable product. It intentionally does not prescribe page-level implementation.

## 1. Product goal

HaloAI enables a real team to work with multiple named AI members in one project room and deliver a reviewable artifact. It must solve four problems at the same time:

1. Context no longer needs to be copied manually between team chat, private AI conversations, and documents.
2. Every human and AI participant has a visible identity, responsibility, and permission boundary.
3. AI research, claims, and edits preserve provenance and remain subject to human review.
4. Conversation settles into documents, decisions, tasks, and approvals instead of disappearing in a message stream.

## 2. Non-goals

The first release is not:

- a complete office suite, CRM, project-management suite, or video-conferencing platform;
- a low-code workflow product that requires drawing a graph before a room can be useful;
- an autonomous society in which every AI speaks or recursively invokes another AI by default;
- a system where AI silently overwrites shared documents or performs irreversible external actions;
- a general-purpose shell, unrestricted SQL console, unrestricted web browser, or automatic plugin installer;
- a native iOS or Android application; the first mobile target is an installable PWA;
- a system for training a foundation model.

## 3. Users and actors

| Actor           | Goal                                       | Main capabilities                                        | Primary restriction                                         |
| --------------- | ------------------------------------------ | -------------------------------------------------------- | ----------------------------------------------------------- |
| Workspace owner | Establish a safe collaboration environment | Workspace, membership, roles, security, retention        | Sensitive changes require re-authentication or confirmation |
| Administrator   | Manage daily collaboration resources       | Projects, rooms, members, AI profiles, integrations      | Cannot read raw secrets by default                          |
| Project lead    | Deliver a specific outcome                 | Goals, room membership, documents, approvals, publishing | Can act only in authorized projects                         |
| Member          | Discuss and author                         | Messages, document editing, allowed AI invocation        | Cannot change security policy                               |
| Reviewer        | Protect outcome quality                    | Comments, suggestions, document or action approval       | Edit access is independent from reviewer status             |
| Guest           | Join narrowly scoped collaboration         | Read and comment on explicitly shared resources          | No implicit cross-project access                            |
| AI member       | Contribute within a delegation             | Reply, research, propose, use approved read-only tools   | No human session and no self-escalation                     |
| System worker   | Execute durable work                       | Retry, resume, project state, notify                     | Handles only the scope encoded in its job payload           |

`Actor`, `AccessRole`, and `AgentProfile` are separate concepts. A persona must never grant authorization, and an access role must never be treated as an AI prompt.

## 4. First complete job

### 4.1 Success path

1. An owner creates a workspace and project.
2. A project lead creates a room with a goal, expected artifact, and completion criteria.
3. The lead invites humans and creates named AI members from a guided setup or template.
4. A member adds source material and explicitly mentions an AI member in a message.
5. The API persists the message and mention relation, then creates a durable agent run.
6. The AI receives only context authorized to both the delegating human and AI profile, and streams a sourced response.
7. The AI creates a structured document proposal; the canonical document does not change yet.
8. Humans accept, edit, or reject individual proposal operations.
9. A lead requests review; an authorized reviewer approves a formal version.
10. Any final paragraph can be traced to humans, AI runs, sources, and approvals.

### 4.2 Failure and recovery paths

- A failed optimistic message keeps its draft and retry affordance, and an idempotency key prevents duplicates.
- A disconnected run resumes from a durable event sequence without repeating completed tool calls.
- Permission revocation immediately blocks later context reads and tool calls from an in-flight run.
- A proposal based on a stale document version becomes conflicted instead of overwriting newer content.
- Exhausted time, cost, token, step, or tool budgets stop the run explicitly and preserve reviewable partial work.
- An approval expires when its deadline passes or when the approved operation digest changes.

## 5. Functional requirements

Priorities use **Must**, **Should**, and **Later** for the current delivery horizon.

### 5.1 Workspaces and membership

| ID     | Requirement                                 | Priority | Acceptance criterion                                                                 |
| ------ | ------------------------------------------- | -------- | ------------------------------------------------------------------------------------ |
| WS-001 | Create, update, archive a workspace         | Must     | Only authorized actors can act; the last active owner cannot be removed              |
| WS-002 | Invite a human with a membership role       | Must     | Invitation binds workspace, address, role, expiry; repeated acceptance is idempotent |
| WS-003 | Switch workspace under one account          | Must     | The server re-resolves membership; an old scoped token cannot cross the boundary     |
| WS-004 | Define a custom access role                 | Should   | Stable capabilities compose roles; routes or UI labels do not define permissions     |
| WS-005 | List human, AI, guest, and disabled members | Must     | Type and status are distinguishable by both text and iconography                     |

### 5.2 Projects, rooms, and messages

| ID     | Requirement                                     | Priority | Acceptance criterion                                                                      |
| ------ | ----------------------------------------------- | -------- | ----------------------------------------------------------------------------------------- |
| RM-001 | Create a project room with goal and members     | Must     | Each room belongs to one workspace and project; private rooms require explicit membership |
| RM-002 | Send messages, replies, and threaded discussion | Must     | Persisted message content is immutable; edits create revisions                            |
| RM-003 | Persist explicit human and AI mentions          | Must     | Mention is a relation; workers never re-parse prose to guess routing                      |
| RM-004 | Optimistic send and retry                       | Must     | `clientMutationId` deduplicates; failed content remains editable                          |
| RM-005 | Cursor pagination and windowed rendering        | Must     | Initial load is bounded; a room with 10,000 messages remains usable                       |
| RM-006 | Room lifecycle                                  | Should   | Active, waiting, completed, and archived states have explicit policy and audit events     |
| RM-007 | Workspace and room search                       | Later    | ACL filtering occurs before ranking and leaks neither titles nor snippets                 |

### 5.3 AI members

| ID     | Requirement                                                        | Priority | Acceptance criterion                                                               |
| ------ | ------------------------------------------------------------------ | -------- | ---------------------------------------------------------------------------------- |
| AI-001 | Create a named AI actor                                            | Must     | AI actor is neither a human user nor an interactive login principal                |
| AI-002 | Configure responsibility, exclusions, knowledge, tools, and budget | Must     | The default editor does not require understanding low-level model parameters       |
| AI-003 | Draft and publish immutable agent versions                         | Must     | Every run pins one version; published history cannot be mutated                    |
| AI-004 | Route by explicit mention by default                               | Must     | Without a mention or explicit coordinator decision, an AI consumes no model budget |
| AI-005 | Optional coordinator delegation                                    | Should   | UI reveals invited agents, rationale, synthesis owner, and maximum rounds          |
| AI-006 | Pause, disable, or remove an AI from a room                        | Must     | No new runs start; in-flight behavior follows an explicit cancellation policy      |
| AI-007 | Support multiple model providers                                   | Should   | Provider changes do not alter actor, message, or authorization records             |

### 5.4 Agent runs

| ID      | Requirement                      | Priority | Acceptance criterion                                                                                                  |
| ------- | -------------------------------- | -------- | --------------------------------------------------------------------------------------------------------------------- |
| RUN-001 | Durable, explicit state machine  | Must     | Supports queued, preparing, running, streaming, waiting input, waiting approval, paused, completed, failed, cancelled |
| RUN-002 | Stream durable events and resume | Must     | Events have increasing sequence numbers; duplicate, gap, and out-of-order cases are handled                           |
| RUN-003 | Cancel, retry, and deduplicate   | Must     | Cancellation produces no new side effects; retry creates a new run linked to the old one                              |
| RUN-004 | Multi-dimensional budgets        | Must     | Token, cost, duration, step, tool-call, and participant limits can stop a run                                         |
| RUN-005 | Understandable process status    | Must     | Show concise activity such as “reading authorized sources”; never expose hidden reasoning                             |
| RUN-006 | Context manifest                 | Should   | Authorized users can inspect which messages, documents, memories, and files were used                                 |

### 5.5 Collaborative documents

| ID      | Requirement                           | Priority | Acceptance criterion                                                                      |
| ------- | ------------------------------------- | -------- | ----------------------------------------------------------------------------------------- |
| DOC-001 | Rich-text editing and autosave        | Must     | Local input does not wait on the network and save status is visible                       |
| DOC-002 | Formal versions and comparison        | Must     | Publishing, accepted AI work, or manual checkpoint can create a version                   |
| DOC-003 | Structured AI change proposal         | Must     | Includes base version, operations, rationale, citations, AI version, and delegator        |
| DOC-004 | Accept, edit, or reject per operation | Must     | Unaccepted content never enters canonical text; accepted change remains reversible        |
| DOC-005 | Comment and suggestion threads        | Should   | Anchors survive ordinary edits where possible and preserve actor and status               |
| DOC-006 | Multi-user CRDT editing               | Should   | Two clients converge deterministically without last-write-wins data loss                  |
| DOC-007 | Provenance and citations              | Must     | Authorized sources open at the relevant location; unauthorized viewers receive no snippet |

### 5.6 Approvals, notifications, and audit

| ID      | Requirement                     | Priority | Acceptance criterion                                                                   |
| ------- | ------------------------------- | -------- | -------------------------------------------------------------------------------------- |
| GOV-001 | Approve high-risk action        | Must     | Approval binds operation, argument digest, AI version, delegator, approver, and expiry |
| GOV-002 | Approval inbox                  | Must     | Shows impact, diff, external side effects, and one-time approval scope                 |
| GOV-003 | Membership-scoped notifications | Must     | Delivery binds user, workspace, and membership to prevent cross-tenant confusion       |
| GOV-004 | Append-only audit events        | Must     | Normal administrators cannot alter or delete events; denials are recorded too          |
| GOV-005 | Usage ledger                    | Should   | Reserve, settle, and release are idempotent; balance can be reconstructed              |
| GOV-006 | Retention, deletion, and export | Should   | Deletion propagates to primary data, objects, search, memory, and cache                |

## 6. Non-functional requirements

### 6.1 Security

- Access is deny-by-default and fails closed when workspace, membership, or resource context is missing.
- Human sessions use `HttpOnly`, `Secure`, `SameSite` cookies, rotation, revocation, and CSRF protection.
- Effective AI capability is the intersection of delegator, AI grant, resource ACL, tool policy, data policy, budget, and approval.
- Model output, files, retrieved pages, and tool results are untrusted data; authorization is repeated at the execution boundary.
- Secrets are injected by a server-side credential broker and never enter browser state, prompts, notifications, or ordinary logs.

### 6.2 Performance

- Production p75 targets: LCP at most 2.5 s, INP at most 200 ms, CLS at most 0.05.
- An optimistic message appears within 100 ms; a received SSE chunk commits to UI within 100 ms.
- Local document input feedback is at most 50 ms; same-region collaboration propagation is normally at most 250 ms.
- Message lists are virtualized or windowed; active message DOM nodes should normally remain below 150.

### 6.3 Usability and accessibility

- Target WCAG 2.2 AA.
- Core flows work with keyboard, touch, and screen reader.
- Touch targets are at least 44 by 44 CSS pixels and the interface remains usable at 200% zoom.
- Reduced motion is respected; status is never communicated by color or animation alone.

### 6.4 Internationalization

- Initial locales are `zh-CN` and `en-US`; CI fails on missing or orphaned message keys.
- UI uses ICU messages; API returns stable error codes and structured parameters rather than display prose.
- User-authored content keeps its original text and `contentLanguage`; translation is a traceable derivative.

## 7. Success measures

| Measure                        | Definition                                                          | Early interpretation                           |
| ------------------------------ | ------------------------------------------------------------------- | ---------------------------------------------- |
| Time to first artifact         | Room creation to first human-accepted document version              | Must improve on the team's fragmented baseline |
| AI proposal adoption           | Accepted or edited-then-accepted proposals divided by all proposals | Tests whether roles and context are useful     |
| Human rework                   | Published passages returned for factual or authorization defects    | Must not exceed a human-only baseline          |
| Outcome-producing rooms        | Active rooms producing a formal document or decision                | Prevents optimizing for chat volume alone      |
| Cost per accepted contribution | Model and tool cost divided by accepted contributions               | Supports controllable team budgets             |
| Risk interception quality      | Correctly escalated or denied risk decisions                        | Track both false positives and false negatives |

## 8. MVP definition of done

MVP is complete only when this chain passes in Chinese and English, on desktop and mobile:

1. Two humans reliably exchange messages in one room.
2. A human mentions one AI and receives a cancellable, retryable, resumable stream.
3. The AI reads only authorized messages and documents, and shows its sources.
4. The AI proposes document edits; a human sees the diff and accepts one operation.
5. Acceptance creates a new document version and complete audit chain.
6. Permission revocation invalidates existing WebSocket access, download access, and later tool calls.
7. Simulated disconnects, duplicate events, worker crashes, and budget exhaustion preserve consistent state.
