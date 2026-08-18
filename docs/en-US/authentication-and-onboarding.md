# Authentication, Sessions, and Workspace Onboarding

## 1. Goal

This specification defines human login identities, revocable browser sessions, first-workspace creation, member invitations, and role changes. Authentication proves who a person is; Membership and AccessRole determine what that person can do in a particular workspace.

## 2. Authentication boundary

- A mature authentication component handles email and password. Passwords use a memory-hard hash and exist only on credential Accounts.
- Browsers receive only `HttpOnly`, `SameSite=Lax` cookies. Session tokens never enter `localStorage`, URLs, logs, or error responses. The login page sends authentication and session requests through the web origin so browsers do not reject cookies when the API uses another port, or when `localhost` and `127.0.0.1` are mixed.
- Sessions are stored in PostgreSQL, expire after seven days by default, renew daily, and can be revoked immediately on sign-out or a security event. Renewal rotates a revocable opaque session cookie; it does not expose an access token or refresh token to browser JavaScript.
- AuraOA's access/refresh JWT design fits Bearer API clients, but HaloAI does not adopt its browser-side `localStorage` token storage. Agentum keeps short-lived access tokens in memory and places a rotatable refresh token in an HttpOnly cookie scoped to `/api/auth`. HaloAI currently has only a same-origin Web/BFF client, so a database session cookie avoids two token classes, refresh races, and XSS-readable credentials. An access/refresh protocol should be introduced behind AuthGateway only when native clients, third-party APIs, or cross-origin resource servers become real requirements.
- Authentication origins and CORS use explicit allowlists. CSRF and origin checks must never be disabled.
- The authentication database role accesses only User, Account, Session, and Verification tables and cannot read workspace content.
- Sign-up, sign-in, and invitation acceptance return stable error codes without exposing whether an email exists or which workspace owns an invitation.

## 3. First-time onboarding

An authenticated user without a workspace enters the onboarding flow:

1. Enter a team name.
2. Generate a canonical slug and require an explicit adjustment on conflict.
3. Create the Workspace, Human Actor, active Owner Membership, and built-in roles in one transaction.
4. Return the workspace summary and current Actor without installing tools or creating AI automatically.

The transaction generates server-owned UUIDs before setting the PostgreSQL workspace context. Clients never choose `workspaceId`, `actorId`, or Owner status.

## 4. Invitations and acceptance

- Owners and Admins may invite without delegating above their own authority.
- Invitation tokens contain at least 32 random bytes. The database stores only a SHA-256 digest. Tokens expire after 72 hours by default and are single use.
- An invitation binds a normalized email, target workspace, and requested role. A different authenticated email is rejected.
- Acceptance creates or restores the Human Actor, Membership, and built-in role assignment in one transaction.
- Repeated acceptance returns an idempotent result. Expired, revoked, and email-mismatched tokens use one non-enumerating error.

## 5. Roles and Owner protection

- Built-in roles are `owner`, `admin`, `member`, and `guest`; protocol values are never localized.
- Server policy evaluates role changes against the current Membership. A client role value is only a requested value.
- Demoting, suspending, or removing an Owner locks both workspace and membership records first.
- A deferred database constraint ensures every workspace retains an active Owner. The application should return a stable understandable error before that constraint is reached.
- Revocation applies to new requests immediately and stops active Agent runs at the next authorization checkpoint.

## 6. Current delivery boundary

The Alpha slice delivers email/password sign-up and sign-in, session lookup and sign-out, workspace creation and listing, invitation creation and acceptance, and built-in role changes. Local `DEMO_MODE=true` writes scrypt-hashed seed accounts for frontend/backend integration; the switch never skips cookie sessions or server authorization. Until email delivery is connected, development may display a one-time invitation link. Production must never return or log the raw token.

The login page shows a workspace dropdown for collaborator and workspace-admin portals, below the email and password fields; system admin does not. Opening the login page does not reuse an existing cookie to fill workspaces, so a refresh with empty credentials cannot enter. After email/password sign-in succeeds on this page, it fills options from `GET /v1/session` and selects the first workspace, or the last remembered one if it still belongs to the account. The system-admin portal also calls the platform access check and admits only an active `system_administrators` grant. Zero workspaces keep the empty state and continue to onboarding. A client-stored `workspaceId` is only a UI preference and is never authorization evidence. The account menu shows “Switch workspace” only when the account belongs to more than one workspace.

## 7. Acceptance

- Unauthenticated requests cannot create, enumerate, or administer workspaces.
- The login page shows a workspace dropdown only for collaborator and workspace-admin portals, below email and password. Options are read from the session only after sign-in succeeds on this page, and the first workspace is selected by default. Refreshing the login page must not skip credentials by reusing a cookie. System admin does not show it.
- Empty email or password cannot enter the workspace. Local seed accounts must sign in through `/api/auth/sign-in/email` with hashed passwords stored in PostgreSQL.
- Cookies use HttpOnly, SameSite, and environment-appropriate Secure attributes.
- Cross-origin mutations are rejected.
- A user can create a first workspace and becomes its only Owner.
- An Owner can invite a member; wrong email, expired tokens, and replay fail safely.
- The final Owner cannot be demoted, suspended, or removed.
- A signed-out session becomes invalid immediately.
- Authentication settings display the server's effective expiration and renewal intervals instead of a non-functional frontend default. System-administrator authority is never derived from a Workspace role.
- Sign-in, onboarding, and member-management pages work in Chinese, English, light and dark themes, and 390/768/1440 viewports.
