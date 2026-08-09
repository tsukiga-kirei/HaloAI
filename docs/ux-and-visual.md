# HaloAI UX and visual specification

## Purpose

This document defines the user experience, responsive information architecture, interaction rules, visual language, accessibility baseline, performance budget, and visual acceptance gates for HaloAI.

HaloAI is a human-led workroom. Conversation helps people coordinate, while documents, decisions, tasks, approvals, and audit records preserve the durable outcome. The interface must make human responsibility, AI participation, current work state, and the next useful action obvious without turning the product into a monitoring dashboard.

## Experience principles

1. **Outcome before conversation.** Chat is an entry point; durable work is promoted into documents, decisions, tasks, and approvals.
2. **Humans remain visibly responsible.** AI can propose and execute within a delegated scope, but ownership, approval, and final publication remain attributable to people.
3. **Identity is never ambiguous.** Human, AI, and system actors use a common message structure but are distinguishable by text labels, avatar treatment, and accessible names.
4. **Silence is a feature.** Only explicitly mentioned AI teammates, or the smallest participant set selected by an enabled facilitator, should respond.
5. **Progress is observable.** The product explains whether an AI run is queued, reading authorized material, generating, waiting for approval, complete, stopped, or failed. It never exposes hidden reasoning traces.
6. **Safety is understandable.** Read-only work stays lightweight. Changes, external effects, and sensitive actions show scope, diff, responsible actor, and approval requirements.
7. **Mobile is a focused workflow.** It is not a compressed desktop dashboard.
8. **Calm is part of quality.** Content, hierarchy, and whitespace carry the interface. Brand effects are restrained.

## Information architecture

### Global level

- Authentication and account recovery
- Workspace switcher
- Global search
- Inbox for mentions, invitations, approvals, and completed work
- User settings for locale, theme, notification preferences, devices, and security

### Workspace level

- Overview
- Rooms
- Documents
- People and AI teammates
- Activity
- Workspace settings
- Members, access roles, and invitations
- Audit access for authorized members

### Room level

Every workroom contains:

- A goal and status
- Human and AI participants
- Conversation and threads
- Linked documents and other durable artifacts
- Agent run status
- Approval requests
- Decisions and tasks as the product expands

Recommended route model:

```text
/{locale}
/{locale}/inbox
/{locale}/w/{workspaceSlug}
/{locale}/w/{workspaceSlug}/rooms/{roomId}
/{locale}/w/{workspaceSlug}/docs/{documentId}
/{locale}/w/{workspaceSlug}/actors
/{locale}/w/{workspaceSlug}/settings/members
/{locale}/w/{workspaceSlug}/settings/roles
/{locale}/w/{workspaceSlug}/settings/audit
```

Route identifiers and slugs are stable and are not translated.

## Responsive application shell

Breakpoints describe layout behavior rather than device identity. The interface must remain usable between the named checkpoints, not only at the exact test widths.

| Viewport | Required layout |
| --- | --- |
| `>= 1440px` | 64px workspace rail, 256–288px room navigation, conversation pane, document pane, and an optional 320–380px contextual drawer |
| `1200–1439px` | Workspace rail, 240–256px room navigation, one primary work surface, optional conversation/document split, contextual content in a drawer |
| `768–1199px` | One primary surface, room navigation in a drawer, conversation/document segmented switch, contextual details in a side or bottom sheet |
| `< 768px` | Single-view navigation stack, compact top bar, one conversation or document surface, bottom navigation, safe-area-aware composer or editor toolbar |

### Wide desktop

At 1440px and above, the primary room experience follows a room / conversation / document structure. A narrow workspace rail may sit to the far left, but it must not compete with those three working regions.

Users can choose:

- **Conversation focus:** conversation is primary; the document remains visible as a secondary pane.
- **Document focus:** document is primary; relevant discussion remains visible beside it.
- **Split work:** conversation occupies about 40 percent and the document about 60 percent. The divider is adjustable and the preference is remembered.

No working pane may shrink below 480px. If the available width is insufficient, the product collapses contextual content before compressing the reading surfaces.

### Tablet

- Show one primary view at a time.
- Put room navigation in a drawer.
- Switch conversation and document with a segmented control.
- Allow temporary split mode only in sufficiently wide landscape layouts.
- Present participants, sources, approvals, and run details in a side drawer or bottom sheet.
- Preserve large touch targets and readable text rather than shrinking the desktop shell.

### Mobile

The room is a single navigation stack:

```text
Top bar: back, room title, connection state, overflow actions
Body: current conversation or document
Bottom: message composer or mobile editor toolbar
```

Workspace bottom navigation contains four stable destinations:

- Conversations
- Documents
- Inbox
- Me

Mobile requirements:

- Support a minimum width of 320px.
- Use `100dvh` and safe-area insets.
- Keep the composer visible when the software keyboard opens.
- Open document editing in a full-screen focus view.
- Show comments, sources, and AI proposals in bottom sheets.
- Provide a tap alternative for every hover, right-click, or drag action.
- Never introduce unintended horizontal scrolling.

## Core pages

### Workspace overview

The first screen answers four questions:

- What is this workspace trying to complete?
- Which rooms changed recently?
- Which documents need review?
- What needs my response or approval?

The initial modules are workspace goal, recent rooms, pending approvals, recent documents, and mentions. The strongest action is **Create room**. Empty states include one concrete next action and must not rely on illustration alone.

### Room

The room header contains:

- Room name and short goal
- Status: active, waiting for approval, complete, or archived
- Human and AI participant group
- Linked document entry point
- Conversation/document/detail switch
- Search and overflow actions

Conversation rules:

- Keep the readable message column between 760px and 880px when space permits.
- Human and AI messages share the same reading rhythm; AI content must not become a visually oversized card by default.
- AI avatars use a thin Halo ring and a visible `AI` label.
- System events use a compact timeline treatment.
- Tool activity is summarized in plain language and collapsed by default.
- Sources, model usage, tool details, and run history are progressive disclosure.
- Hidden model reasoning is never rendered.

### Document

The editor content width is 720–820px for comfortable reading. The header contains the title, sync state, current collaborators, version history, sharing and permission controls, and an AI collaboration entry point.

Editing rules:

- Save automatically and show a low-noise sync indicator.
- Render remote cursors and selections without obscuring text.
- Keep comments separate from the canonical body.
- Treat AI edits as reviewable proposals by default.
- Let users accept one change, accept all, reject, or request a revision.
- Create a durable checkpoint after accepted AI changes.
- On mobile, keep only the most important formatting actions above the keyboard.

### People and AI

The directory uses a shared Actor presentation while clearly labeling humans, AI teammates, guests, and disabled AI profiles.

An AI profile card shows:

- Name, avatar, and AI identity label
- Collaboration role and one-sentence responsibility
- Authorized knowledge scope
- Allowed capabilities and tools
- Approval requirements
- Run budget and maximum steps
- Current availability

The creation flow has five steps:

1. Identity: name, avatar, and introduction.
2. Responsibility: goals, strengths, and explicit non-responsibilities.
3. Knowledge: rooms and documents the AI may read.
4. Capabilities: tools, write scope, and approval gates.
5. Behavior: response language, initiative level, budget, and run limits.

Provider, model, and sampling parameters belong in advanced settings. They are not the primary mental model for ordinary members.

### Inbox

The inbox combines mentions, approval requests, invitations, and completed background work. Each item exposes its workspace and room, actor identity, age, and required action. Users can filter by category and mark items read without leaving the current context.

### Permission and error states

- Disabled actions explain the missing capability when revealing that information is safe.
- Direct navigation to an inaccessible resource returns a non-disclosing not-found or forbidden state according to policy.
- Errors preserve user input and offer retry, copy, or recovery actions.
- Empty, loading, offline, reconnecting, read-only, and failed states are designed as first-class screens, not appended text.

## Core user journeys

### Create a workroom

1. Choose a name and concise outcome.
2. Invite human participants.
3. Add the smallest useful AI participant set.
4. Review each AI teammate's readable scope and capabilities.
5. Create the room and land in an empty conversation with a suggested first action.

Advanced modes are not required during room creation. Explicit mention mode is the default.

### Send a message and invoke AI

1. Compose a message with optional human, AI, document, and attachment references.
2. Show which AI teammates will run before sending.
3. Insert an optimistic human message immediately.
4. Reconcile it with the server using a client mutation identifier.
5. Render each AI run with clear state and a stop action.
6. Preserve the message and expose retry/copy if sending fails.

Composer behavior:

- Enter sends; Shift+Enter inserts a newline.
- Enter never sends while an input method editor is composing text.
- `@` opens an accessible participant picker.
- Slash actions remain a small, curated set.
- The composer keeps drafts across navigation and transient disconnection.

### Promote conversation into a document

1. Select a message or thread.
2. Choose **Add to document**.
3. Select an existing section or create a new one.
4. Review the proposed content and source attribution.
5. Apply it as a human edit or submit it as an AI-assisted proposal.
6. Record the producing Actor and source references.

### Review an AI proposal

1. Open the inline proposal card or inbox item.
2. Compare before/after content and inspect sources.
3. Accept individual operations, accept all, reject, or request revision.
4. Detect stale base versions before applying.
5. Apply accepted operations as one attributable document transaction.
6. Create a version checkpoint and audit event.

### Approve a sensitive action

The approval surface shows the initiating human, acting AI, exact target, parameter summary, expected effect, diff where relevant, external impact, and expiry. Actions are **Approve once**, **Reject**, and **Request revision**. The UI must not offer a vague “always allow” shortcut.

## Interaction conventions

- One screen has one visually dominant primary action.
- Optimistic UI is allowed only when failure can be safely reconciled.
- Destructive actions require explicit language and do not rely on color alone.
- Toasts report brief completion; errors requiring decisions remain inline.
- Drawers preserve the current room context; full pages are reserved for durable destinations.
- Streaming content does not force-scroll users who are reading history.
- A **New messages** control returns the user to the latest content.
- Retrying an AI answer creates a new version instead of silently replacing the original.
- AI status text describes observable activity without presenting hidden reasoning.

## Internationalization and content

The launch locales are `zh-CN` and `en-US`. Locale selection follows:

```text
Saved user preference
> locale cookie
> Accept-Language
> zh-CN default
```

Implementation requirements:

- Use a locale route segment and typed `next-intl` message catalogs.
- Split messages into stable namespaces such as `common`, `navigation`, `workspace`, `room`, `chat`, `document`, `agent`, `permission`, `approval`, `settings`, and `errors`.
- Fail continuous integration when locale keys or value domains diverge.
- Never concatenate translated fragments to create sentences.
- Use ICU plural and select syntax for variable grammar.
- Format dates, numbers, currency, and relative time through locale-aware formatters.
- Return stable error codes and structured parameters from APIs, then localize at the interface boundary.
- Preserve user-authored content in its source language and mark generated translations.
- Separate stable Agent identifiers from translated display names.
- Set the document `lang` and `dir` attributes correctly.
- Use logical CSS properties so future right-to-left layouts do not require structural rewrites.
- Test a text-expansion pseudo-locale and a right-to-left pseudo-locale in continuous integration.

## Quiet Halo visual system

### Brand expression

Quiet Halo means professional, calm, trustworthy, and slightly future-facing. The halo appears as:

- A 1–2px ring around AI avatars
- A low-intensity working pulse while an AI run is active
- A subtle radial highlight for completed AI work or a selected AI proposal
- A stronger gradient only in the product mark and limited brand moments

It does not appear behind long-form text, around every card, on human messages, or as a permanent glow across the application.

### Semantic color foundation

Initial light theme values:

```text
canvas          #F7F8FA
surface         #FFFFFF
surface-muted   #F1F3F7
text            #171A21
text-muted      #5E6573
border          #E2E6ED
accent          #6D5CE7
accent-hover    #5B4AD1
halo-start      #7C6CF2
halo-end        #38BDF8
success         #16805A
warning         #A35C00
danger          #C23B3B
```

Initial dark theme values:

```text
canvas          #0F1117
surface         #171A22
surface-muted   #20242F
text            #F4F6FA
text-muted      #A9B0BE
border          #2C3240
accent          #9A8CFF
```

These are starting tokens, not proof of compliance. Every text, icon, border, focus, and state combination must pass the required contrast checks.

### Typography

Use a modern Latin sans-serif with system Chinese fallbacks:

```text
Geist Sans, Inter, ui-sans-serif, system-ui,
PingFang SC, Microsoft YaHei, sans-serif
```

Type scale:

| Role | Size / line height | Weight |
| --- | --- | --- |
| Page title | `28 / 36` | 600 |
| Secondary title | `22 / 30` | 600 |
| Section title | `16 / 24` | 600 |
| Body | `15 / 24` | 400 |
| Supporting text | `13 / 18` | 400–500 |
| Code and technical values | `13 / 20` | monospace |

Normal interface text does not go below 12px. A page uses no more than four font weights. Critical information may wrap and must not become understandable only after opening a tooltip.

### Spacing, radius, elevation, and icons

Spacing scale:

```text
4, 8, 12, 16, 24, 32, 48, 64
```

Radius scale:

```text
controls       8px
cards         12px
large panels  16px
pills         status and short filter labels only
```

Use only two elevation levels: menus/popovers and modal/drawer surfaces. Content cards normally use background and border rather than heavy shadow.

Use one icon family with 16px, 20px, and 24px sizes. Emoji do not substitute for product icons. Every icon-only control has a tooltip and accessible name.

### Motion

```text
immediate feedback  120ms
standard transition 180ms
drawer or dialog    240ms
```

Normal UI motion stays below 300ms. Streaming text does not bounce or animate word by word. Reduced-motion mode removes displacement and pulsing while preserving state meaning.

## Quantified visual acceptance

“Beautiful” does not mean “uses gradients, rounded cards, and shadows.” A HaloAI page passes visual acceptance only when it clears both the objective gate and the human review score.

### Objective gate

All conditions are mandatory:

- Feature styles use semantic tokens; arbitrary colors, spacing, type sizes, and radii do not spread through page code.
- Elements sharing a visual column align without visible 1–2px drift in reference screenshots.
- Each view has exactly one strongest primary action.
- There is no unintended horizontal scroll, overlap, clipping, broken border, or obscured control.
- Layouts are intentionally composed at 320, 390, 768, 1024, 1440, and 1920px widths.
- Chinese, English, pseudo-localized text, long emails, and long AI names do not break the shell.
- Loading, empty, error, offline, reconnecting, read-only, and permission-denied states are complete.
- Skeleton geometry resembles final content and does not create obvious layout shift.
- Text line length, content width, and line height meet the reading rules in this document.
- Icons are consistent and AI/human identity is communicated by at least two cues.
- Halo decoration never outranks primary content or action states.
- Light, dark, reduced-motion, and 200-percent zoom modes remain usable.
- Automated accessibility scans contain no serious or critical violations.

### Human visual review score

Score each dimension from 0 to 2:

| Dimension | 0 | 1 | 2 |
| --- | --- | --- | --- |
| Hierarchy | No clear starting point | Mostly understandable | Page, state, and primary action are clear within three seconds |
| Alignment | Visibly inconsistent | Minor inconsistencies | Grid, edges, and baselines feel deliberate |
| Spacing | Crowded or loose | Generally workable | Grouping and rhythm are consistently clear |
| Typography | Mixed and difficult | Readable | Titles, body, and supporting text form a natural hierarchy |
| Color | Competing accents | Mostly coherent | Neutral surfaces dominate and accent has explicit meaning |
| Brand | Generic template feel | Some identity | Halo signature is distinct but restrained |
| State polish | Only the happy path | Some alternate states | Loading, failure, offline, streaming, and approval are equally considered |
| Responsiveness | Desktop squeezed smaller | Functional | Information is reorganized for each form factor |

Core pages require at least 14 of 16 points, with no zero in any dimension. A visual regression baseline may be created only after this first human review passes. Screenshot equality prevents regressions; it does not prove that the initial design is good.

## Accessibility baseline

HaloAI targets WCAG 2.2 AA.

### Keyboard and focus

- Provide a skip link to the main work surface.
- Make menus, drawers, mention pickers, approval actions, and editor controls operable by keyboard.
- Trap focus inside dialogs and restore it to the trigger on close.
- Move focus to the main heading or work surface after meaningful route changes.
- Keep focus rings visible in both themes.
- Do not require drag as the only way to complete an action.
- Respect input method composition in the message composer.

### Screen readers

- Use semantic header, navigation, main, aside, list, and article regions.
- Give icon controls explicit names.
- Announce Actor name and human/AI identity for avatars and messages.
- Announce AI start, completion, failure, and approval states without reading every streamed token.
- When users read history, announce the count of new messages without stealing focus.
- Expose connection and sync states with text, not color alone.

### Visual and touch access

- Normal text reaches a 4.5:1 contrast ratio.
- Controls, boundaries, focus indicators, and large text meet their applicable contrast requirements.
- Interactive targets are at least 44×44 CSS pixels.
- All main flows work at 200-percent zoom.
- Honor `prefers-reduced-motion`.
- Avoid flashing and endless decorative animation.

## Performance budget

Production 75th-percentile goals:

```text
LCP   <= 2.5s
INP   <= 200ms
CLS   <= 0.05
TTFB  <= 800ms
```

Interaction goals:

- Navigation acknowledges input within 100ms.
- An optimistic message appears within 100ms.
- An received stream chunk renders within 100ms.
- Local editor input responds within 50ms.
- Same-region collaboration updates normally appear within 250ms.
- Main-thread long tasks remain below 50ms.
- A normal reconnect converges within five seconds.

Suggested compressed JavaScript budgets:

```text
authentication and entry       <= 170KB
workspace and room shell       <= 220KB
conversation route             <= 250KB
editor incremental chunk       <= 280KB
initial font payload           <= 120KB
ordinary above-fold image      <= 200KB
```

The editor and collaboration runtime load on demand. Initial room history contains 30–50 messages. Long rooms use windowing so approximately 100–150 message nodes remain active even when the history contains thousands of messages. Streaming updates are batched, avatars and previews are lazy-loaded, and document projections run outside the interactive render path.

## Visual and interaction verification

Required viewport matrix:

```text
Desktop Chromium   1440x900   zh-CN   light
Desktop WebKit     1440x900   en-US   dark
Tablet             768x1024   zh-CN
Mobile             390x844    zh-CN and en-US
Small mobile       320x568    text expansion
```

Every core page has deterministic screenshots for populated, empty, loading, error, offline, permission-denied, AI-streaming, and approval states. Tests fix time, data, and model output; wait for fonts and a stable ready marker; disable animation and caret; and mask only genuinely nondeterministic cursors or timestamps.

Use a consistent continuous-integration browser image and a default maximum diff pixel ratio of `0.002`. Any visible structural difference still requires human inspection. Automated checks also assert no unexpected horizontal overflow, visible focus, unobscured composer and primary controls, accessible names, 44px touch targets, and no serious or critical accessibility findings.

## Definition of done

A user-facing feature is complete only when:

- Desktop, tablet, and mobile have intentional layouts.
- `zh-CN` and `en-US` are semantically complete.
- Loading, empty, error, offline, and forbidden states exist.
- Keyboard, touch, and screen-reader users can finish the primary flow.
- Optimistic changes safely reconcile or roll back.
- AI identity, run state, stop, retry, and attribution are visible.
- Document changes remain reviewable and attributable.
- Performance budgets and accessibility gates pass.
- The visual review score reaches at least 14 of 16 with no zero dimension.

