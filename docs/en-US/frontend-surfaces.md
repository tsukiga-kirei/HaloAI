# Collaboration, Workspace Administration, and System Administration

## 1. Purpose

HaloAI separates team collaboration, workspace governance, and platform operations into three product surfaces. The split exists to preserve clear mental models and least privilege, not to create more pages.

| Surface                  | Stable route | Audience                                                      | Primary responsibility                                                                                                                         |
| ------------------------ | ------------ | ------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------- |
| Collaboration            | `/app`       | Team members and invited guests                               | Rooms, messages, documents, AI collaboration, approvals, and deliverables                                                                      |
| Workspace administration | `/admin/*`   | Workspace Owners, Workspace Admins, and scoped administrators | Members, roles, AI (using allocated models only), integrations, security, usage, and audit                                                     |
| System administration    | `/system`    | Platform operations and security staff                        | Tenant lifecycle, the platform model catalog and per-tenant allocation, system health, and platform defaults; no default tenant-content access |

The root route `/` only enters the collaboration surface and does not host a second home page.

## 2. Navigation and visual boundaries

- Collaboration is a left-navigation / right-workspace shell: white left menus and personal settings, gray right canvas. The main workspace must not repeat the left primary destinations.
- Workspace administration and system administration reuse the collaboration sidebar: white, collapsible, with the account control pinned to the bottom, and the same expanded width. Do not introduce a second glowing navigation skin or a wider administration sidebar. Collaboration primary items stay about 34px tall; workspace and system administration rows are about 44px with looser gaps. The selected row uses a light purple wash, not a purple canvas or sidebar. Do not stretch those rows to fill the sidebar. Each portal mounts its own shell, so switching must restore the saved collapsed width immediately and must not play a collapse animation while doing so. All three portals use the same account dropdown, with sign out only at the bottom of that menu. The full style-invariant table is in `ux-and-visual.md`.
- The three surfaces share brand tokens, the product mark, theme, and locale preferences, but not their page hierarchy or primary navigation.
- Desktop administration uses side navigation and a content canvas. Narrow screens convert navigation into a horizontally browsable section bar instead of shrinking a desktop page. Do not hang a native select or a second menu under that bar to switch sections; in-page choices use segmented pills, and dropdowns belong inside drawers.
- Workspace-admin and system-admin shells live in the layout. Switching sections replaces only the canvas. A collapsed sidebar must not remount and play an expand or collapse animation. The collapsed width is also stored in a cookie so server paint and client restore match.
- Transitions between collaboration and administration use the account menu’s role switch. Do not add a second language, theme, or role control in the top bar.
- Sidebar labels use a clear medium weight in both default and selected states. When collapsed to an icon rail, every navigation item, room, and account entry shows its name on hover or keyboard focus.

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

System administration’s page design includes a Models section: catalog, tenant allocation, and availability. The catalog explicitly supports OpenAI Chat Completions, OpenAI Responses, Anthropic Messages, and Google Generate Content protocol formats instead of hiding different request contracts behind one generic compatibility field. Workspace “Available models” may only show this tenant’s allocated options; it must not read as tenant-owned provider onboarding.

A system administrator submits a model API key only when creating or rotating a model connection. PostgreSQL stores AES-256-GCM ciphertext, a random IV, an authentication tag, and a key version. Pages and list responses return only configured/not-configured state and never echo or log plaintext. Production injects a dedicated model-secret encryption master key; the authentication secret must not double as that key.

## 4. Current Alpha boundary

The current implementation provides complete navigable collaboration, workspace-administration, and system-administration surfaces. Collaboration requires email/password sign-in and an HttpOnly session. `DEMO_MODE=true` only loads local PostgreSQL seed data; it never skips authentication and does not enable collaboration demo tickets. System administration is protected by a separate `system_administrators` platform grant. Workspace Owners are never promoted implicitly, and cross-tenant directory reads use narrow `SECURITY DEFINER` database functions that verify the platform identity.

Workspace administration loads members, departments, and AI collaborators from the server snapshot. Member administration uses a department tree beside a member directory. Departments belong to the current workspace, may form a bounded hierarchy, and can carry a manager, description, and ordering. Human members may have a primary department and job title, while access remains controlled by a separate Workspace Role; department membership never expands permissions implicitly. Member search, department filters, and pagination operate only after authorization has restricted the data to the active workspace. Sections without a ledger, audit log, or model catalog stay empty. Action buttons only provide local interface feedback and do not claim to have mutated durable data. Every action without an API must disclose that state in a centered toast, never as a persistent banner, and never fill the page with sample numbers or sample events.

Creating a tenant requires a default-administrator email. An existing account becomes the new workspace Owner in the same transaction. An unregistered email creates only a single-use activation invitation: HaloAI never generates a default password and does not create an ownerless workspace in advance. The invitee registers or signs in through the email-bound link, then one transaction creates the workspace, default department, Owner Membership, and built-in roles. The tenant directory exposes administrator name and email, member count, and department count. A system administrator may also read member governance metadata—name, email, status, access role, department, job title, and join time—but never tenant rooms, documents, conversations, or model context.

System administration has five stable sections: overview, tenants, models, health, and settings. Policy and audit remain workspace-governance responsibilities and are not duplicated in platform navigation. Overview and tenants read real platform APIs, so a seeded workspace immediately appears in counts and the directory instead of being hidden by a hardcoded empty state. Tenant and model directories use a card grid rather than a wide desktop table. Server pagination stays one-based with 10/20/50 page-size pills, keeps inset padding from the container edge, and resets to page one when filters or page size change. The model catalog supports registration, updates, enable/disable, and tenant allocation. Settings use the same horizontal tabs as section navigation and currently expose only General and Authentication. Platform default locale, sign-in lifetime, renewal interval, and sliding renewal are saved by a system administrator into `system_settings` and applied when new sessions are issued. Environment variables supply bootstrap defaults only when the database has no matching key; they are not a read-only source of truth on the page, and there is no unimplemented AI Conversation tab. Health probes only the API readiness endpoint and must not mark unconnected dependencies as available. No section shows tenant rooms, documents, or conversation content. The login page keeps a two-column layout: brand story on the left, a three-portal identity form on the right. Collaborator and workspace-admin portals show a workspace dropdown below email and password. System admin does not; after sign-in, it performs an additional platform-identity check. The dropdown stays empty until email/password sign-in succeeds on this page, then lists workspaces from `GET /v1/session` and selects the first item. Unauthenticated clients must not enumerate workspaces. The account menu offers “Switch workspace” only when the same account belongs to more than one workspace.

### 4.1 Non-AI collaboration shell

Before chat orchestration, model providers, and Agent Runs are connected, collaboration first completes independently testable team workflows:

- Workspace overview collects recent rooms and shared document metadata. Action items stay empty until an inbox API exists.
- Inbox switches between mentions, approvals, and invitations. Without an API it shows an empty state and does not write fake read receipts.
- The document directory supports search, status filters, and a path back to the document panel in its room. The toolbar search field fills remaining width; filters and create sit together on the right. Directory rows come from the server snapshot, not frontend fixtures.
- Activity shows attributable people, timestamps, and objects. It stays empty until an activity API exists.
- These surfaces must not trigger model calls, tool calls, or external writes. Phase boundaries appear only in empty states or toasts after a user action, never as a persistent banner.

The visual hierarchy continues to use HaloAI semantic tokens. Reference products inform information architecture, spacing, and interaction density only; their branding, color systems, and AI permission models are not copied.

## 5. Completion criteria

- `/app`, `/admin/overview`, `/system`, and `/system/tenants`, `/system/models`, `/system/health`, `/system/settings` navigate through real links. Section-route validation must not be imported from a Client Component module.
- Administration has no unexpected horizontal overflow on desktop or a 390px mobile viewport, and interaction targets are at least 44×44 CSS pixels.
- Chinese, English, light theme, and dark theme cover collaboration, administration, and denial states.
- Unauthorized principals cannot bypass the server guard by entering a route directly.
- Every administration page displays its scope and distinguishes active, pending approval, disconnected, and read-only states.
- System administration denies workspace roles by default and exposes no tenant-content summary.
- Seeded tenants appear in platform counts and the paginated directory. Model-secret responses never contain plaintext, including after a rotation.
- Tenant and model directories use a card grid on desktop and mobile. Pagination, filtering, loading, error, and empty states keep a stable layout and do not require horizontal scrolling for primary actions.
- Workspace members can be filtered and paginated by department, with primary department, job title, and access role shown separately. The department tree supports create, edit, manager, and bounded nesting; department membership never changes authorization.
- A system administrator can create a tenant with a default-administrator email. Existing accounts atomically become Owner; an unregistered email receives a single-use activation link and the person sets their own password. The platform tenant directory can paginate member governance metadata and the default administrator without exposing tenant content.
- Overview, inbox, document directory, and activity are reachable through real collaboration navigation without triggering AI or external writes.
- 1440×900 preserves the rooms, conversation, and document columns. Tablet and mobile use a single-view path instead of a compressed desktop layout.
- The login page shows a workspace dropdown only for collaborator and workspace-admin portals; it stays empty before sign-in and fills from the session afterwards. System admin does not show it. The account menu offers workspace switching only when there is more than one workspace.
