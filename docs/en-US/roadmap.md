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
- [ ] Project memberships and room-level authorization.
- Real room/message/document APIs.
- One configurable model provider with streaming.
- Agent creation, mention routing, run budgets, and audit timeline.
- Local document versions and human approval flow.

## Phase 2 — team beta

- WebSocket presence and reliable message delivery.
- Yjs-backed collaborative editing and comments.
- Durable job queue, retries, cancellation, and resume.
- Governed knowledge sources and permission-aware retrieval.
- Provider vault, model routing, cost dashboards, and usage limits.
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
