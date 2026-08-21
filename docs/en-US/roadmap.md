# HaloAI delivery roadmap

> Current progress: phase 0 has a runnable framework. Phase 1 now includes PostgreSQL foundations, real login sessions, workspace creation and switching, invitation acceptance, member listing, and built-in role protection. Durable HTTP data paths for rooms, messages, and documents remain next.

## Phase 0 — foundation

- Product shell and responsive navigation.
- Typed domain model, permission policy, and agent contracts.
- Chinese/English dictionaries and theme tokens.
- Demo conversation and shared-document experience.
- Architecture, security, and repository guidance.

## Phase 1 — usable internal alpha

- PostgreSQL repositories and migrations (foundation complete; identity, document, and runtime repositories continue next).
- [x] Authentication, workspace creation and switching, invitation acceptance, and built-in role protection.
- [x] Workspace audit, allocated model catalog, read-only security snapshot, member suspend/restore, and account display name.
- [ ] Project memberships and room-level authorization.
- Real room/message/document APIs.
- One configurable model provider, connected by a system administrator and allocated to a pilot tenant, with streaming.
- Agent creation, mention routing, run budgets, and audit timeline.
- Local document versions and human approval flow.

### Current non-AI durable data slice

This slice completes REST paths for projects, project membership, rooms, room membership, and document metadata without implementing message sending, model calls, or Agent Runs early:

- Workspace Owners and Admins can create projects; the creator automatically becomes the project `lead`.
- Owners, Admins, and project `lead`s can add active people from the current workspace to a project. A person must be a project member before joining a private room.
- Project members can list only authorized projects. Private rooms require explicit room membership, while workspace-visible rooms still require project membership.
- Project `lead`s and `contributor`s can create rooms and document metadata. `reviewer`s and `observer`s remain read-only.
- Browsers cannot submit or override trusted `workspaceId`, `actorId`, membership role, or resource ownership fields. The API derives them from the session and server-side membership.
- Cross-workspace IDs, missing project membership, revoked room membership, and disallowed project roles fail closed.
- Under real authentication, collaboration loads projects, rooms, and the document directory from the API. Local Demo mode keeps isolated sample data.

Acceptance requires a lead to create a project, add a member, create a private room, and create document metadata. Data survives refresh, and the entire path makes no AI call.

## Phase 2 — team beta

- WebSocket presence and reliable message delivery.
- Yjs-backed collaborative editing and comments.
- Durable job queue, retries, cancellation, and resume.
- Governed knowledge sources and permission-aware retrieval.
- Provider vault on the platform, per-tenant allocation, cost dashboards, and usage limits.
- PWA installability, push notifications, and offline draft support.

## Phase 3 — controlled action

- MCP registry and per-agent tool allowlists.
- Isolated TypeScript workers and restricted egress.
- Approval inbox for external or irreversible actions.
- Signed webhooks, integration identities, and immutable audit export.
- SSO, SCIM, retention, legal hold, and enterprise deployment profiles.

## Success measures

- Time from room creation to first accepted artifact.
- Percentage of AI suggestions accepted or edited into the final document.
- Human review time saved without increasing correction rate.
- Cost and latency per accepted contribution.
- Denied or escalated risky actions and policy false-positive rate.
