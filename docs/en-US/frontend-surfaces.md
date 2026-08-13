# Collaboration, Workspace Administration, and System Administration

## 1. Purpose

HaloAI separates team collaboration, workspace governance, and platform operations into three product surfaces. The split exists to preserve clear mental models and least privilege, not to create more pages.

| Surface                  | Stable route | Audience                                                      | Primary responsibility                                                                   |
| ------------------------ | ------------ | ------------------------------------------------------------- | ---------------------------------------------------------------------------------------- |
| Collaboration            | `/app`       | Team members and invited guests                               | Rooms, messages, documents, AI collaboration, approvals, and deliverables                |
| Workspace administration | `/admin/*`   | Workspace Owners, Workspace Admins, and scoped administrators | Members, roles, AI, integrations, security, usage, and audit                             |
| System administration    | `/system`    | Platform operations and security staff                        | Tenant lifecycle, system health, and global policy without default tenant-content access |

The root route `/` only enters the collaboration surface and does not host a second home page.

## 2. Navigation and visual boundaries

- Collaboration is organized around rooms, conversation, and documents in an immersive workspace shell.
- Workspace administration uses a distinct management shell that always shows the current workspace, access role, and configuration scope.
- Both surfaces share brand tokens, theme, and locale preferences, but not their page hierarchy or primary navigation.
- Desktop administration uses side navigation and a content canvas. Narrow screens convert navigation into a horizontally browsable section bar instead of shrinking a desktop page.
- Transitions between collaboration and administration use explicit text links rather than ambiguous icons alone.

## 3. Authorization boundary

1. Every `/admin/*` request must be authorized on the server using the current session, active workspace membership, and required Capability.
2. Hidden client navigation, saved theme or locale, URL parameters, and local storage are never authorization evidence.
3. The workspace administration overview requires `workspace.manage`; security policy requires `workspace.security.manage`; audit requires `audit.read`.
4. Direct navigation without permission renders a non-enumerating denial state with a safe route back to collaboration.
5. `/system` uses a separate platform identity and authorization domain. Workspace Owners are never promoted to system administrators implicitly.
6. Platform access to tenant content requires a time-limited, justified, and audited break-glass flow.

## 4. Current Alpha boundary

The current implementation provides complete navigable shells for collaboration and workspace administration. Local development receives a controlled server-side Owner preview identity for design and browser acceptance. Production builds deny administration by default until real authentication is connected.

Administration currently renders verifiable sample state. Action buttons only provide local interface feedback and do not claim to have mutated durable data. Every action without an API must disclose that state clearly.

System administration currently provides only a restricted entry and security-boundary explanation. It exposes no tenant data or simulated operational controls.

### 4.1 Non-AI collaboration shell

Before chat orchestration, model providers, and Agent Runs are connected, collaboration first completes independently testable team workflows:

- Workspace overview collects recent rooms, action items, and shared documents with explicit owners and states.
- Inbox switches between mentions, approvals, and invitations. Without an API, it may only mark items read locally and must not claim durable success.
- The document directory supports search, status filters, and a path back to the document panel in its room.
- Activity shows attributable people, timestamps, and objects without exposing or implying hidden AI reasoning.
- These surfaces must not trigger model calls, tool calls, or external writes, and must keep the local-preview boundary visible.

The visual hierarchy continues to use HaloAI semantic tokens. Reference products inform information architecture, spacing, and interaction density only; their branding, color systems, and AI permission models are not copied.

## 5. Completion criteria

- `/app`, `/admin/overview`, and all administration sections navigate through real links.
- Administration has no unexpected horizontal overflow on desktop or a 390px mobile viewport, and interaction targets are at least 44×44 CSS pixels.
- Chinese, English, light theme, and dark theme cover collaboration, administration, and denial states.
- Unauthorized principals cannot bypass the server guard by entering a route directly.
- Every administration page displays its scope and distinguishes active, pending approval, disconnected, and read-only states.
- System administration denies workspace roles by default and exposes no tenant-content summary.
- Overview, inbox, document directory, and activity are reachable through real collaboration navigation without triggering AI or external writes.
- 1440×900 preserves the rooms, conversation, and document columns. Tablet and mobile use a single-view path instead of a compressed desktop layout.
