# HaloAI quality and testing specification

## 1. Purpose and normative language

This specification defines how HaloAI proves correctness, isolation, collaboration convergence, accessibility, performance, security, and release readiness.

The words MUST, MUST NOT, SHOULD, SHOULD NOT, and MAY are normative. Tests are executable product contracts. A passing happy path is insufficient when a failure could cross a tenant, expand AI authority, duplicate an external effect, corrupt a shared document, lose work, or hide an approval boundary.

All application test harnesses, fixtures, simulators, and load drivers SHOULD be written in TypeScript. Native infrastructure tools MAY be used through reproducible commands, but the product must not require a second application language to express its quality model.

## 2. Quality principles

1. **Test invariants, not implementations.** Tests assert durable behavior at domain and boundary levels.
2. **Default-deny paths receive first-class coverage.** Every permission grant has corresponding denial, revocation, and cross-tenant tests.
3. **Concurrency is normal.** Duplicate, delayed, reordered, cancelled, disconnected, and resumed work is tested deliberately.
4. **Real boundaries remain real.** Policy, database isolation, queues, serialization, and browser storage are not mocked away in integration and end-to-end gates.
5. **AI is nondeterministic data behind deterministic control.** Provider text may vary; authority, schemas, budgets, approvals, state transitions, and effects may not.
6. **Accessibility and mobile behavior are correctness.** They are release criteria, not manual polish after functional testing.
7. **A rerun does not erase evidence.** Flakes and transient failures remain visible until classified and owned.

## 3. Risk tiers and required evidence

Every feature and change receives the highest applicable tier:

| Tier                        | Examples                                                                                                                      | Minimum required evidence                                                                                                |
| --------------------------- | ----------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------ |
| Q0 — boundary critical      | Authentication, tenant isolation, authorization, credentials, approvals, audit, retention, usage settlement, external effects | Invariant and branch tests, real-database integration, attack tests, negative multi-user E2E, review by a security owner |
| Q1 — collaboration critical | Messages, Agent runs, queues, SSE, WebSocket, CRDT, proposals, notifications, offline recovery                                | Unit/property tests, integration with recovery and concurrency, multi-context E2E, load or fault evidence                |
| Q2 — user-flow critical     | Workspace setup, role editing, document workflows, settings, exports                                                          | Component/contract tests, primary and error-path E2E, accessibility, visual and locale checks                            |
| Q3 — presentation limited   | Non-semantic styling and isolated copy                                                                                        | Static checks, affected component tests, visual and locale review                                                        |

Risk tier is recorded in the change description. Lowering the tier requires an explicit rationale. A change touching policy, tenant keys, state transitions, money or usage units, migrations, encryption, or retention is always Q0 even when the code diff is small.

Requirements link to named tests or suites. A release decision must be traceable from requirement to evidence, environment, commit, and result.

## 4. Test pyramid

The target distribution describes intent, not a quota:

| Layer                                 |          Approximate share | Purpose                                                                         | Typical runtime                |
| ------------------------------------- | -------------------------: | ------------------------------------------------------------------------------- | ------------------------------ |
| Static analysis                       |               Every change | Types, lint, dependency boundaries, catalog/schema consistency, unsafe patterns | Seconds                        |
| Unit, invariant, property             | 60–70% of behavioral tests | Pure policy, state, reducers, parsers, budgets, formatting                      | Milliseconds                   |
| Component and contract                |                     15–25% | UI states, accessibility semantics, API/event/provider contracts                | Milliseconds to seconds        |
| Integration                           |                     10–15% | Database isolation, queues, object storage, transactions, realtime recovery     | Seconds                        |
| End-to-end                            |                      5–10% | Critical multi-user journeys across real application boundaries                 | Seconds to minutes             |
| Load, resilience, attack, exploratory |         Risk-driven suites | Capacity, recovery, abuse, usability, and emergent behavior                     | Scheduled or release candidate |

Rules:

- Do not move combinatorial logic into E2E when a fast property or table test can prove it.
- Do not replace a critical boundary test with a unit mock.
- Every production defect adds the cheapest test that would have caught it, plus a boundary-level regression when the escaped risk crossed layers.
- Snapshot tests supplement semantic assertions; they never replace them.

## 5. Tooling and suite boundaries

The baseline suite uses:

- TypeScript strict checking and lint rules for static guarantees;
- Vitest for unit, property, component-compatible, and Node integration suites;
- Playwright for browser, multi-context, cross-browser, mobile, accessibility, and visual tests;
- axe-core within deterministic browser states for automated accessibility checks;
- real Postgres instances or isolated schemas for database and row-policy tests;
- production-compatible queue, cache, object, SSE, WebSocket, and collaboration services for boundary suites; and
- deterministic fake model, tool, mail, push, and connector servers with recorded contract cases.

Tool choice may evolve, but suite responsibilities and evidence MUST remain. Tests cannot depend on developer-global services, personal accounts, production credentials, or an already-running local process.

Repository scripts expose at least:

| Command intent   | Required scope                                                         |
| ---------------- | ---------------------------------------------------------------------- |
| typecheck        | Every workspace package under strict compiler settings                 |
| test             | Fast unit, invariant, and contract suites                              |
| test:integration | Database, queue, storage, realtime, and adapter boundaries             |
| test:e2e         | Critical Playwright journeys                                           |
| test:visual      | Deterministic viewport and locale screenshots                          |
| test:a11y        | Automated accessibility plus keyboard assertions                       |
| test:security    | Attack acceptance and unsafe-pattern scans                             |
| check            | Formatting/lint, typecheck, tests, build, and required spec validation |

Names may differ during bootstrapping, but CI presents these scopes separately so failures are attributable.

## 6. Deterministic environments and test data

Tests control time, randomness, IDs, network behavior, model output, and feature flags. A test that depends on the wall clock, suite order, locale of the host, or an external network is not deterministic.

Required practices:

- create a new workspace and membership graph per test unless a suite explicitly tests sharing;
- generate recognizable tenant-prefixed fixture IDs while still using valid production formats;
- use factories that require workspace, project, Actor, and classification explicitly;
- freeze or inject clock and time zone;
- seed pseudo-random generators and print the seed on failure;
- isolate database schema, queue prefix, object prefix, cache namespace, search index, and realtime channel by run;
- prohibit production data and redact captured payloads;
- use minimal fixtures that preserve the invariant under test;
- clean up by test-run scope, never through a broad unverified delete; and
- preserve failed-run artifacts long enough to debug them.

The CI environment is created from declared versions. Browser images, fonts, locale data, database extensions, and time-zone data are pinned. Tests verify migrations against both an empty database and a sanitized previous-release schema.

## 7. Static, unit, invariant, property, and fuzz testing

### 7.1 Static gates

Static checks include:

- TypeScript strict mode with no unchecked boundary casts;
- lint rules for floating promises, unsafe HTML, unhandled unions, and forbidden imports;
- package dependency-direction checks;
- API, event, state, permission, error-code, and locale exhaustiveness;
- schema and generated-artifact clean-tree checks;
- secret scanning and dependency risk scanning;
- no focused tests, accidental skips, or committed debug flags; and
- no client bundle import of server secrets or privileged adapters.

### 7.2 Unit and invariant suites

Pure tests cover:

- capability and condition evaluation;
- AI authority intersection;
- state transition reducers;
- usage reservation, settlement, release, and reconciliation;
- approval binding and expiry;
- retry and backoff decisions;
- event reduction, sequence-gap detection, and snapshot replacement;
- document operation validation;
- locale, time-zone, and API error mapping;
- retention and deletion planning; and
- serialization round trips.

Named invariants are tested directly. Important examples include “one terminal state,” “one usage settlement per reservation,” “an approval cannot authorize changed parameters,” and “a translation never broadens source access.”

### 7.3 Property and fuzz suites

Property tests generate action sequences, role combinations, duplicate messages, event permutations, CRDT edit schedules, boundary sizes, Unicode, ICU arguments, and daylight-saving instants.

Fuzz targets include parsers for API input, tool arguments, uploaded metadata, SSE events, WebSocket frames, Yjs updates, Markdown projections, route locales, and connector responses. Failures print a minimized reproducible case and become permanent regressions.

### 7.4 Coverage policy

Coverage is a guardrail, not proof:

| Scope                                                             |                                  Required floor |
| ----------------------------------------------------------------- | ----------------------------------------------: |
| Policy, tenant guards, approval, usage ledger, retention planners |  95% branch coverage plus every named invariant |
| State machines                                                    | 100% declared transitions and terminal outcomes |
| Changed executable lines                                          |                90% line and 85% branch coverage |
| Repository application code                                       |                80% line and 75% branch coverage |

Generated code, type-only declarations, and trivial configuration may be excluded with documented patterns. Raising coverage by testing unreachable or meaningless statements is prohibited.

## 8. Contract, integration, database, and migration testing

Contract tests validate both producer and consumer for:

- REST request, response, pagination, error, and idempotency shapes;
- SSE event type, sequence, cursor, snapshot, and terminal semantics;
- WebSocket authentication, close reason, update, and awareness frames;
- queue payload version, lease, attempt, deduplication, and result;
- model-provider request, stream, usage, cancellation, and error normalization;
- tool and connector argument/result schemas;
- notification templates and delivery callbacks; and
- export manifests and signed-download metadata.

Unknown additive fields are handled according to versioning policy; missing required fields, incompatible versions, and unknown privileged actions fail closed.

Integration tests use real transaction behavior. They cover unique constraints, composite tenant ownership, row-level security, foreign keys, outbox atomicity, concurrent updates, deadlocks, retry classification, cursor pagination, object ownership, and audit append-only permissions.

Every migration suite proves:

1. clean install succeeds;
2. upgrade from the previous supported release succeeds;
3. existing tenant rows retain ownership and meaning;
4. backfill is restartable and observable;
5. mixed application versions fail safely or remain compatible during rollout;
6. rollback or forward-fix procedure is documented and exercised where feasible; and
7. no protected column becomes temporarily nullable or unscoped without a compensating guard.

## 9. Authorization, permission, and tenant-isolation testing

The authorization test matrix is generated from Subject × role × resource × action × condition. It must include explicit allows, explicit denies, default denies, revoked grants, expired grants, classification constraints, approval requirements, and project restrictions.

| Boundary                            | Mandatory attacks                                                                                    | Pass condition                                           |
| ----------------------------------- | ---------------------------------------------------------------------------------------------------- | -------------------------------------------------------- |
| REST and server actions             | Replace workspace, project, Actor, owner, role, and resource IDs with foreign known values           | Denied without revealing foreign-resource detail         |
| Database                            | Omit tenant context, forge session context, join across tenants, call under worker/application roles | Query fails closed; no row or aggregate leaks            |
| Cache, search, and vector retrieval | Reuse keys, query foreign UUIDs, poison cache, omit policy filter                                    | No foreign candidate, count, snippet, or timing oracle   |
| Object and export                   | Guess key, replay URL, change content disposition, use expired membership                            | Download and export fail before content exposure         |
| Notification and unread state       | Switch membership, subscribe to old channels, mark foreign notification                              | List, count, stream, and mutation remain isolated        |
| SSE and WebSocket                   | Reuse cursor/ticket, revoke membership midstream, switch tenant in message                           | Stream stops or reauthenticates; no foreign event        |
| Queue and worker                    | Alter payload tenant, replay stale job, resume after grant removal                                   | Worker reauthorizes and denies stale authority           |
| AI and tools                        | Ask model to impersonate, expand scope, retrieve foreign context, self-approve                       | Effective authority remains the server-side intersection |

At least one suite uses two resources with identical local names and intentionally similar IDs in different workspaces. Aggregate endpoints, error wording, pagination totals, autocomplete, presence, and timing-sensitive lookups are included.

Policy is not mocked in boundary tests. A UI-hidden control is never accepted as authorization evidence.

## 10. State machines, idempotency, queues, and accounting

Each durable state machine has a machine-readable transition table. Tests enumerate every legal transition, every illegal transition from each state, terminal-state immutability, actor requirements, side effects, audit output, and concurrency behavior.

Required race tests include:

- cancel versus complete, fail, timeout, approval, and provider callback;
- approval versus expiry, revocation, parameter change, and duplicate decision;
- membership or role revocation during retrieval, tool preparation, effect commit, and publication;
- job lease expiry versus heartbeat and completion;
- notification send versus unsubscribe and retry;
- document proposal accept versus concurrent edit and duplicate command; and
- retention purge versus legal hold.

Idempotency tests inject the same command before, during, and after commit. They inject ambiguous timeouts at transaction begin, outbox write, provider response, effect preparation, effect confirmation, result persistence, and acknowledgement.

Pass conditions:

- one canonical command result;
- at most one external effect;
- exactly one accounting settlement per reservation;
- no double audit meaning;
- deterministic replay response;
- no terminal-state resurrection; and
- retries safe across process restart.

Queue tests kill workers at every persisted boundary, expire leases, duplicate delivery, reorder related jobs, exhaust retries, move jobs to a dead-letter state, replay after repair, and verify cancellation. Recovery never relies only on process memory.

## 11. Realtime, offline, and CRDT testing

### 11.1 Messages and SSE

Tests cover duplicate, delayed, dropped, malformed, and out-of-order events; gaps; replay-window expiry; snapshot replacement; refresh during streaming; backpressure; slow consumers; multi-tab reduction; token rotation; authorization revocation; and server restart.

The client must converge to the same canonical room order and terminal run state after every tested schedule. One mutation ID creates one message and one Agent invocation. A reconnect never leaks an event from another workspace.

### 11.2 WebSocket and presence

Tests verify short-lived connection tickets, origin validation, current membership, channel authorization, expiry, reconnect, revocation, size and rate limits, malformed frames, and per-tenant connection bounds.

Presence is ephemeral, minimal, and non-authoritative. Forged presence cannot change document content, role, approval, unread count, or audit state.

### 11.3 CRDT documents

Yjs collaboration tests use two or more independently authenticated clients. Generated edit schedules are applied in different orders with disconnects, reconnects, duplicate updates, compaction, and process restart.

Required assertions:

- all authorized replicas converge byte-equivalently or semantically according to the document schema;
- no last-write-wins loss of independent edits;
- stored binary state reloads without depending on a projection;
- projection failure leaves canonical state intact;
- read-only and revoked clients cannot submit accepted updates;
- schema-incompatible, malformed, oversized, and flooded updates fail safely;
- state-vector recovery transmits only needed state within configured bounds;
- comments, approvals, versions, and audit attribution remain consistent with document state; and
- an accepted AI proposal applies once through a named, authorized transaction.

Offline tests verify that private data clears on logout or account switch, drafts do not invoke AI automatically, cached authorization responses are never reused, and local bytes do not prove current edit permission.

## 12. Agent, model, tool, and knowledge testing

The default CI path uses a deterministic model simulator that can emit text deltas, tool calls, malformed calls, usage, refusals, slow streams, disconnects, and provider errors. Tests assert orchestration and policy, not exact creative prose.

Golden behavioral scenarios cover:

- explicit mention, automatic routing, no eligible Agent, and routing tie;
- context selection with authorization before retrieval;
- bounded prompt size and deterministic truncation;
- tool schema validation and destination policy;
- low-, medium-, and high-risk approval behavior;
- stop, timeout, budget exhaustion, retry, and provider failover;
- prompt injection in messages, files, web content, retrieved memory, and connector output;
- citation or provenance attachment without exposing hidden content;
- response-language choice without changing authority; and
- final message, usage, trace, and audit consistency.

The simulator never bypasses the production policy engine. A small provider-contract suite may call an approved non-production account on a controlled schedule; it uses synthetic non-sensitive data, hard budgets, and no release dependency on model wording.

Knowledge and memory tests prove tenant scope, resource scope, classification, deletion propagation, stale-source behavior, chunk lineage, and authorization before ranking. Poisoned or adversarial documents cannot alter system policy.

## 13. Playwright multi-user end-to-end testing

Multi-user tests use separate Playwright BrowserContext instances, each with independent cookies, storage, connection tickets, and identity. Multiple pages in one context do not count as independent users.

The baseline actors are:

- Workspace Owner;
- authorized human Member;
- read-only human Viewer;
- human in a second workspace;
- deterministic AI Actor invoked through the real runtime boundary; and
- Worker or integration identity only where a user-visible effect must be verified.

Required journeys:

| Journey            | Concurrent actors                  | Required proof                                                         |
| ------------------ | ---------------------------------- | ---------------------------------------------------------------------- |
| Room collaboration | Owner, Member, AI                  | Canonical ordering, streaming recovery, attribution, unread isolation  |
| Approval           | Requester, Approver, AI            | AI cannot self-approve; exact parameters bind; expiry/revocation works |
| Shared document    | Two editors, Viewer, AI            | CRDT convergence, read-only denial, proposal review, version and audit |
| Permission change  | Admin, active Member, AI run       | Active stream/editor/run loses authority at next protected step        |
| Tenant attack      | Member and foreign workspace       | Known IDs, deep links, search, downloads, notifications all deny       |
| Offline recovery   | Editor and another online editor   | Draft recovery, reauthorization, deterministic merge                   |
| Usage limit        | Concurrent initiators              | Atomic reservation prevents overspend and UI shows canonical result    |
| Account switch     | Same browser, different identities | Private cache, drafts, connections, and notifications do not cross     |

Tests assert visible behavior and durable server state. They do not reach into React internals or use privileged database writes to skip the workflow being tested.

## 14. Viewports, visual regression, accessibility, and locale quality

### 14.1 Browser and viewport matrix

The minimum deterministic screenshot matrix is:

| Profile          | Viewport             | Locale               | Theme               |
| ---------------- | -------------------- | -------------------- | ------------------- |
| Desktop Chromium | 1440×900             | zh-CN                | Light               |
| Desktop WebKit   | 1440×900             | en-US                | Dark                |
| Desktop Firefox  | 1440×900             | en-US                | Light               |
| Tablet           | 768×1024             | zh-CN                | Both where affected |
| Mobile           | 390×844              | zh-CN and en-US      | Light               |
| Small mobile     | 320×568              | en-XA text expansion | Light               |
| RTL readiness    | 390×844 and 1440×900 | ar-XB                | Light               |

Critical behavior also runs under Chromium mobile emulation with touch input and reduced motion. Real-device smoke tests cover at least one current iOS Safari and one current Android Chromium class before a major release.

### 14.2 Visual regression

Core pages have deterministic screenshots for populated, empty, loading, error, offline, permission-denied, AI-streaming, approval, long-content, and destructive-confirmation states.

Tests fix data, time, time zone, fonts, animation, caret, model output, and network completion. They wait for a stable ready marker. Only genuinely nondeterministic cursors or timestamps may be masked.

The default maximum diff pixel ratio is 0.002. Any structural difference, hidden action, clipped warning, unexpected horizontal scroll, focus loss, or reflow over the composer requires human inspection even below the numeric threshold. Baselines are reviewed and updated in a dedicated change; CI never updates them automatically.

### 14.3 Accessibility

HaloAI targets WCAG 2.2 AA. Automated axe-core scans permit no serious or critical violations. Critical flows additionally verify:

- keyboard-only completion and visible focus;
- skip link, landmark, heading, list, table, dialog, and live-region semantics;
- focus trapping and restoration;
- accessible names and state for icon controls;
- human versus AI identity announcements;
- streaming, approval, error, connection, and unread announcements without token-by-token noise;
- 44×44 CSS pixel touch targets;
- 200-percent zoom without loss of content or action;
- contrast in light, dark, forced-color, and disabled states;
- reduced motion;
- IME composition; and
- screen-reader smoke checks on the primary room and document flows.

Automated scans do not replace manual keyboard, touch, zoom, and screen-reader review for Q0–Q2 user flows.

### 14.4 Locale quality

Both launch locales, en-XA, and ar-XB run through core visual and accessibility states. Tests assert typed key parity, ICU branches, API error mapping, date/time-zone behavior, mixed-script isolation, no raw fallback keys, and no untranslated production placeholders.

## 15. Security attack testing

Security suites operate against production-equivalent boundaries with synthetic secrets and canary data.

| Threat                      | Attack cases                                                                             | Required control evidence                                                   |
| --------------------------- | ---------------------------------------------------------------------------------------- | --------------------------------------------------------------------------- |
| Cross-tenant access         | Foreign IDs, mixed joins, cache/search/vector/object/realtime/queue reuse                | Default-deny at every layer and no existence oracle                         |
| Session theft               | XSS probes, cookie read, refresh replay, CSRF, revoked session, stolen connection ticket | Credential unreadability, rotation, revocation, origin and CSRF enforcement |
| Privilege escalation        | Client-forged role/Actor/approval, self-approval, stale delegated run                    | Server-derived identity, non-escalating grants, fresh authorization         |
| Prompt injection            | Messages, files, web pages, memory, tool output request secrets or policy bypass         | Content remains data; authority and tool policy unchanged                   |
| Credential leakage          | Seed secrets in broker and scan browser, prompt, queue, logs, notifications, audit       | No plaintext occurrence; opaque bindings only                               |
| SSRF and unsafe egress      | Loopback, private, metadata, redirect, DNS rebind, slow and oversized response           | Destination resolution, allowlist, network boundary, size/time limits       |
| Content attacks             | XSS, Markdown/HTML/SVG, MIME confusion, path traversal, decompression bomb               | Sanitization, isolation, type and size validation                           |
| Replay and duplicate effect | Repeat command, callback, job, approval, provider result                                 | Idempotent canonical result and one effect                                  |
| Resource exhaustion         | Prompt, upload, update, stream, fan-out, connection and run floods                       | Quotas, rate limits, backpressure, cancellation, bounded memory             |
| Audit and deletion failure  | Attempt mutation, omit event, purge under hold, retain derived copy                      | Append-only trail, reconciliation, hold enforcement, deletion fan-out       |

Mandatory attack tests from the permissions and security specification remain release gates and are invoked by stable IDs. Each fixed vulnerability adds a regression and, where suitable, a property or fuzz corpus entry.

Dependency and build checks detect known critical risk, malicious install behavior, lockfile drift, accidental secret publication, unsafe licenses according to policy, and unexpected client-bundle modules. Exceptions are time-bounded, owned, documented, and never silently accepted.

## 16. Performance and capacity budgets

### 16.1 User experience budgets

Production 75th-percentile objectives:

| Metric |             Budget |
| ------ | -----------------: |
| LCP    |      ≤ 2.5 seconds |
| INP    | ≤ 200 milliseconds |
| CLS    |             ≤ 0.05 |
| TTFB   | ≤ 800 milliseconds |

Interaction and collaboration objectives:

| Operation                                |                      Budget |
| ---------------------------------------- | --------------------------: |
| Navigation acknowledgement               |                    ≤ 100 ms |
| Optimistic message visible               |                    ≤ 100 ms |
| Received SSE chunk committed to UI       |                    ≤ 100 ms |
| Local editor input feedback              |                     ≤ 50 ms |
| Same-region collaboration update         |           normally ≤ 250 ms |
| Main-thread long task                    |                     < 50 ms |
| Canonical message acknowledgement        | normally ≤ 500 ms in-region |
| Normal SSE or CRDT reconnect convergence |                 ≤ 5 seconds |

Suggested compressed transfer budgets:

| Surface                   |              Budget |
| ------------------------- | ------------------: |
| Authentication and entry  | ≤ 170 KB JavaScript |
| Workspace and room shell  | ≤ 220 KB JavaScript |
| Conversation route        | ≤ 250 KB JavaScript |
| Editor incremental chunk  | ≤ 280 KB JavaScript |
| Initial fonts             |            ≤ 120 KB |
| Ordinary above-fold image |            ≤ 200 KB |

### 16.2 Measurement

Pull requests run repeatable lab checks for affected routes. Nightly tests measure cold and warm navigation on defined CPU and network profiles. Production telemetry evaluates p75 by route class, locale, viewport class, and release without high-cardinality user labels.

Performance tests use realistic room history, long documents, concurrent streams, and virtualized lists. Approximately 100–150 message nodes remain active in long rooms. Streaming rendering is batched and cannot create unbounded React commits or server buffers.

A regression beyond a hard budget blocks release unless an approved, expiring exception includes measured user impact and a recovery date. Improving one metric cannot justify violating accessibility, correctness, or tenant safety.

### 16.3 Capacity and soak profiles

Load suites cover:

- burst message creation and Agent routing;
- concurrent SSE connections with slow consumers;
- WebSocket presence and Yjs updates at configured rates;
- queue backlog, provider slowdown, retry storms, and cancellation;
- search and retrieval under tenant filters;
- notification fan-out;
- large-room pagination and reconnect; and
- usage reservation at workspace budget boundaries.

Soak tests watch memory, connection count, event-loop delay, database pool saturation, queue lag, duplicate effect rate, usage reconciliation, and stale non-terminal runs. Limits are increased only with measured evidence.

## 17. Reliability, recovery, and operational tests

Fault injection terminates processes or interrupts dependencies after each durable boundary: transaction start, outbox append, enqueue, lease, provider response, effect preparation, effect confirmation, result persist, acknowledgement, and audit append.

Recovery suites prove:

- stateless web restart without lost canonical work;
- queue lease recovery and bounded retries;
- dead-letter diagnosis and safe replay;
- SSE snapshot/range recovery and CRDT state-vector recovery;
- database failover behavior and connection recovery;
- object or search temporary outage without authorization bypass;
- backup restore into an isolated environment;
- retention and legal-hold behavior after restore;
- deletion propagation to database, objects, search, vectors, cache, jobs, and derived memory;
- notification retry without duplicate delivery where provider semantics allow; and
- usage ledger reconciliation after partial failure.

Disaster-recovery exercises record recovery-point and recovery-time results against declared operational objectives. A backup is not considered valid until restore and authorization checks pass.

## 18. Continuous integration and release gates

### 18.1 Pipeline stages

The current GitHub workflow is two independent commit checks, both required to merge. Local `pnpm check` covers only the static half of the first job and does not start a browser.

| GitHub check                                              | Local equivalent                                                                                          | What it proves                                                                                                                      |
| --------------------------------------------------------- | --------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| Documentation, formatting, types, tests, and build        | `pnpm infra:up`, `pnpm db:migrate`, `pnpm db:test:integration`, `pnpm check`                              | Doc pairs, Prettier, types, Vitest unit tests, and package builds. No browser.                                                      |
| Desktop, tablet, and mobile end-to-end acceptance         | `DEMO_MODE=true pnpm test:e2e` (CI also installs Playwright browsers and seeds demo data)                 | Real Chromium journeys for sign-in, the three-pane shell, administration, and system admin. Headless Linux and the Next.js overlay affect clicks. |

A green `pnpm check` is not a green GitHub run. End-to-end starts `next dev`; when the Next.js indicator sits at the top right, `nextjs-portal` intercepts the drawer close control. The Playwright process must disable that indicator. `pnpm check:all` is the full local equivalent. `apps/web/next-env.d.ts` is generated by `next typegen` / `next dev` / `next build` and is not tracked.

| Stage             | Required checks                                                                                                                            |
| ----------------- | ------------------------------------------------------------------------------------------------------------------------------------------ |
| Change validation | Formatting, lint, types, generated clean tree, unit/invariant/property, catalog/schema parity, changed-code coverage                       |
| Pull request      | Build, contracts, selected integration, migration dry run, affected Playwright journeys, axe, visual diffs, secret/dependency scan         |
| Main branch       | Full integration, all critical E2E in Chromium, tenant and attack suite, complete locale and visual matrix                                 |
| Nightly           | WebKit/Firefox breadth, fuzz corpus, load, soak, queue fault injection, provider contracts, flaky-test detection                           |
| Release candidate | Production-like migrations, full Q0/Q1 matrix, backup restore, deletion/hold, cross-browser/mobile, manual accessibility and visual review |
| Canary            | Health, error, latency, saturation, tenant-denial, usage reconciliation, queue lag, client errors, rollback signal                         |

CI jobs use least-privilege identities and isolated tenants. Secrets are short-lived. Artifacts containing screenshots, traces, videos, payloads, or database diagnostics follow access and retention policy.

### 18.2 Merge and release policy

A pull request cannot merge when any required check fails, is missing, is skipped without an approved reason, or produces an unreviewed baseline change.

A release is blocked by:

- any open critical or high-severity tenant, authentication, authorization, credential, approval, accounting, or data-loss defect;
- a failing named invariant or illegal state transition;
- duplicate external effect or unreconciled usage in fault tests;
- CRDT non-convergence or unrecoverable realtime gap;
- serious or critical accessibility violation on a core flow;
- performance above a hard budget;
- missing zh-CN or en-US semantics for a reachable flow;
- unreviewed migration, retention, or rollback behavior; or
- required evidence produced in a non-equivalent environment.

Emergency exceptions require named owners, written risk, compensating controls, expiry, rollback criteria, and audit. Tenant isolation, credential exposure, unauthorized external effects, and irrecoverable data corruption have no routine exception path.

## 19. Flakes, defects, evidence, and maintenance

A failed test remains failed in the reported run even if an automatic retry passes. The retry classifies possible flakiness and captures trace, video, screenshot, logs, seed, event schedule, environment versions, and correlation IDs.

Flaky tests receive an owner, defect record, observed rate, risk tier, and expiry. Quarantine is isolated from the normal green signal and is visible in release reporting. Q0 release gates cannot be quarantined without the same explicit risk process as a production exception.

Tests MUST NOT:

- use arbitrary sleeps when an observable readiness condition exists;
- depend on suite order or shared mutable identities;
- update snapshots or visual baselines automatically in CI;
- swallow rejected promises, browser console errors, or server errors;
- retry assertions until an incorrect state happens to disappear;
- mock authorization in a test claiming tenant or permission coverage; or
- assert private implementation details instead of user or domain behavior.

Owners review slow, duplicate, orphaned, and low-value tests regularly. Test deletion requires showing that equivalent evidence exists or that the protected requirement no longer applies.

## 20. Definition of done

A feature is quality-complete only when:

- its risk tier and invariants are documented;
- unit, property, contract, integration, and E2E evidence is proportional to risk;
- allow, deny, revocation, cross-tenant, retry, cancellation, and recovery paths pass;
- state, usage, audit, and external effects remain consistent under duplicate and partial failure;
- relevant multi-user and CRDT schedules converge;
- both launch locales, target viewports, visual states, keyboard, touch, zoom, and accessibility checks pass;
- security attacks and secret scans pass;
- performance and capacity remain inside budget;
- migrations, rollback or forward-fix, retention, deletion, and observability are verified; and
- CI and release gates produce durable, attributable evidence with no unexplained flakes.
