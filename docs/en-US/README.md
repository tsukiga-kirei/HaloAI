# HaloAI documentation

[简体中文](../zh-CN/README.md) · English

Every English document in `docs/en-US/` has a same-named counterpart in `docs/zh-CN/`. A product, architecture, protocol, or security change is complete only when both versions remain semantically aligned.

## Recommended reading order

1. Start with the [product brief](product-brief.md) and [product requirements](product-requirements.md).
2. Read the [domain model](domain-model.md) before changing contracts, tables, permissions, or prompts.
3. Use [architecture](architecture.md) and [technical decisions](technical-decisions.md) to understand component and dependency boundaries.
4. Read the specialist specification that owns the behavior being changed.
5. Confirm the applicable acceptance gates in [quality and testing](quality-and-testing.md).

## Product and experience

| Document                                                          | Owns                                                                                                           |
| ----------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------- |
| [Product brief](product-brief.md)                                 | Product promise, target users, first outcome, principles and non-goals                                         |
| [Product requirements](product-requirements.md)                   | Functional requirements, non-functional requirements, metrics and MVP definition of done                       |
| [UX and visual](ux-and-visual.md)                                 | Information architecture, responsive behavior, Quiet Halo visual language, accessibility and visual acceptance |
| [Frontend surface boundaries](frontend-surfaces.md)               | Routes, visual language, and authorization for collaboration and administration                                |
| [Authentication and onboarding](authentication-and-onboarding.md) | Login sessions, first workspace, invitations, roles, and Owner protection                                      |
| [Internationalization](internationalization.md)                   | Locale negotiation, ICU messages, content language, time zones, RTL readiness and CI rules                     |

## Domain and architecture

| Document                                              | Owns                                                                                             |
| ----------------------------------------------------- | ------------------------------------------------------------------------------------------------ |
| [Domain model](domain-model.md)                       | Bounded contexts, entities, invariants, attribution, lifecycle and relational outline            |
| [Architecture](architecture.md)                       | System boundaries, request paths, deployment shape and evolution                                 |
| [Technical decisions](technical-decisions.md)         | Adopted technologies, rejected complexity, replacement triggers and failure boundaries           |
| [Persistence and tenant transactions](persistence.md) | Database roles, migrations, RLS context, repositories, and acceptance                            |
| [Realtime collaboration](realtime-collaboration.md)   | REST/SSE/WebSocket responsibilities, replay, presence, CRDT persistence and offline behavior     |
| [Agent runtime](agent-runtime.md)                     | Versions, routing, durable state machine, events, memory, budgets, tools, approvals and recovery |

## Security, governance, and delivery

| Document                                                | Owns                                                                                                |
| ------------------------------------------------------- | --------------------------------------------------------------------------------------------------- |
| [Security baseline](security.md)                        | Compact mandatory security principles and launch gates                                              |
| [Permissions and security](permissions-and-security.md) | Resource/action matrix, tenant isolation, sessions, credentials, audit, deletion and attack suite   |
| [Quality and testing](quality-and-testing.md)           | Test layers, multi-user and realtime tests, visual QA, accessibility, performance and release gates |
| [Delivery roadmap](roadmap.md)                          | Foundation, Alpha, Beta, controlled actions and enterprise evolution                                |

## Maintenance rules

- Protocol values, event names, capabilities, status enums, and error codes stay in English and are never localized.
- User-visible prose belongs in typed locale messages; API errors return stable codes and structured parameters.
- A new tenant resource must define `workspaceId`, authorization actions, audit events, retention, erasure, and tests together.
- A new tool must define its risk class, credential scope, network policy, approval policy, limits, audit shape, and attack tests.
- Documents describe required behavior, not historical inspiration or source-project commentary.
- Run `pnpm docs:check` before handing off documentation changes.
