# Collaboration, Workspace Administration, and System Administration

## 1. Purpose

HaloAI separates team collaboration, workspace governance, and platform operations into three product surfaces. The split exists to preserve clear mental models and least privilege, not to create more pages.

| Surface                  | Stable route | Audience                                                      | Primary responsibility                                                                                                                     |
| ------------------------ | ------------ | ------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------ |
| Collaboration            | `/app`       | Team members and invited guests                               | Rooms, messages, documents, AI collaboration, approvals, and deliverables                                                                  |
| Workspace administration | `/admin/*`   | Workspace Owners, Workspace Admins, and scoped administrators | Members, roles, AI (using allocated models only), integrations, security, usage, and audit                                                 |
| System administration    | `/system`    | Platform operations and security staff                        | Tenant lifecycle, the platform model catalog and per-tenant allocation, system health, and global policy; no default tenant-content access |

The root route `/` only enters the collaboration surface and does not host a second home page.

## 2. Navigation and visual boundaries

- Collaboration is a left-navigation / right-workspace shell: white left menus and personal settings, gray right canvas. The main workspace must not repeat the left primary destinations.
- Workspace administration and system administration reuse the collaboration sidebar: white, collapsible, with the account control pinned to the bottom, and the same expanded width. Do not introduce a second glowing navigation skin or a wider administration sidebar. Collaboration primary items stay about 34px tall; workspace and system administration rows are about 44px with looser gaps. The selected row uses a light purple wash, not a purple canvas or sidebar. Do not stretch those rows to fill the sidebar. Each portal mounts its own shell, so switching must restore the saved collapsed width immediately and must not play a collapse animation while doing so. All three portals use the same account dropdown, with sign out only at the bottom of that menu. The full style-invariant table is in `ux-and-visual.md`.
- The three surfaces share brand tokens, the product mark, theme, and locale preferences, but not their page hierarchy or primary navigation.
- Desktop administration uses side navigation and a content canvas. Narrow screens convert navigation into a horizontally browsable section bar instead of shrinking a desktop page.
- Transitions between collaboration and administration use the account menu’s role switch. Do not add a second language, theme, or role control in the top bar.

## 3. Authorization boundary

1. Every `/admin/*` request must be authorized on the server using the current session, active workspace membership, and required Capability.
2. Hidden client navigation, saved theme or locale, URL parameters, and local storage are never authorization evidence.
3. The workspace administration overview requires `workspace.manage`; security policy requires `workspace.security.manage`; audit requires `audit.read`.
4. Direct navigation without permission renders a non-enumerating denial state with a safe route back to collaboration.
5. `/system` uses a separate platform identity and authorization domain. Workspace Owners are never promoted to system administrators implicitly.
6. Platform access to tenant content requires a time-limited, justified, and audited break-glass flow.
7. The platform model catalog, provider connections, and secrets belong only to system administrators. Workspace administrators must not add providers or enter secrets; they may only assign models already allocated to their tenant to that workspace’s AI members. The server must reject selection or invocation of a model that was not allocated to the tenant.

## 3.1 Models are owned by the platform and allocated to tenants

This is the product boundary for the current page-design stage. Later implementation must follow it; workspace administration must not grow its own “connect a provider” flow first.

| Who                     | Does                                                                                                                                                                   | Does not                                                              |
| ----------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------- |
| System administrator    | Maintain the full catalog (which providers and model names exist; secrets stay on the server); allocate models to named tenants; watch platform availability and quota | Open a tenant’s rooms, documents, or conversations by default         |
| Workspace administrator | See models allocated to this tenant; pick one for each workspace AI member; view this workspace’s usage within that allocation                                         | Add a provider, paste a secret, or use a model that was not allocated |
| Collaborating member    | Work with AI members that are already configured                                                                                                                       | Configure providers or the model catalog                              |

System administration’s page design includes a Models section: catalog, tenant allocation, and availability. The current preview shell provides `/system/models`. Workspace “Available models” may only show this tenant’s allocated options; it must not read as tenant-owned provider onboarding.

## 4. Current Alpha boundary

The current implementation provides complete navigable shells for collaboration, workspace administration, and system-administration preview. Local development receives a controlled server-side Owner preview identity for design and browser acceptance. Production builds deny administration by default until real authentication is connected.

Administration currently renders verifiable sample state. Action buttons only provide local interface feedback and do not claim to have mutated durable data. Every action without an API must disclose that state in a centered toast, never as a persistent banner.

System administration provides a navigable platform preview (tenants, models, health, policy, audit). It shows platform-level names and status only, never tenant rooms, documents, or conversation content. The login page keeps a two-column layout: brand story on the left, a three-portal identity form on the right.

### 4.1 Non-AI collaboration shell

Before chat orchestration, model providers, and Agent Runs are connected, collaboration first completes independently testable team workflows:

- Workspace overview collects recent rooms, action items, and shared documents with explicit owners and states.
- Inbox switches between mentions, approvals, and invitations. Without an API, it may only mark items read locally and must not claim durable success.
- The document directory supports search, status filters, and a path back to the document panel in its room. The toolbar search field fills remaining width; filters and create sit together on the right.
- Activity shows attributable people, timestamps, and objects without exposing or implying hidden AI reasoning.
- These surfaces must not trigger model calls, tool calls, or external writes. Phase boundaries appear only in empty states or toasts after a user action, never as a persistent banner.

The visual hierarchy continues to use HaloAI semantic tokens. Reference products inform information architecture, spacing, and interaction density only; their branding, color systems, and AI permission models are not copied.

## 5. Completion criteria

- `/app`, `/admin/overview`, `/system`, and `/system/tenants`, `/system/models`, `/system/health`, `/system/policy`, `/system/audit` navigate through real links. Section-route validation must not be imported from a Client Component module.
- Administration has no unexpected horizontal overflow on desktop or a 390px mobile viewport, and interaction targets are at least 44×44 CSS pixels.
- Chinese, English, light theme, and dark theme cover collaboration, administration, and denial states.
- Unauthorized principals cannot bypass the server guard by entering a route directly.
- Every administration page displays its scope and distinguishes active, pending approval, disconnected, and read-only states.
- System administration denies workspace roles by default and exposes no tenant-content summary.
- Overview, inbox, document directory, and activity are reachable through real collaboration navigation without triggering AI or external writes.
- 1440×900 preserves the rooms, conversation, and document columns. Tablet and mobile use a single-view path instead of a compressed desktop layout.
