# HaloAI persistence and tenant transaction specification

## Purpose

PostgreSQL is the source of truth for workspaces, memberships, rooms, messages, documents, agent runs, approvals, audit facts, and the outbox. This specification defines connection roles, migrations, tenant context, and the first repositories for the internal alpha.

## Connection roles

| Role                      | Purpose                                | Allowed                                         | Forbidden                                                      |
| ------------------------- | -------------------------------------- | ----------------------------------------------- | -------------------------------------------------------------- |
| Migration connection      | Controlled schema migration at release | DDL, migration records, application role grants | Request, worker, or model execution paths                      |
| Application connection    | API, worker, and collaboration storage | Business reads and writes constrained by RLS    | Table ownership, `BYPASSRLS`, role creation, databases, or DDL |
| Authentication connection | Future authentication component        | Users, sessions, and account linking            | Business content or human sessions for AI actors               |

Fixed development passwords may exist only in the local container bootstrap. Production uses independent secrets, least-privilege roles, and rotation.

## Tenant transactions

1. The API resolves `workspaceId` and `actorId` from a trusted session. It never trusts a tenant identifier from a request body or URL by itself.
2. Every business operation enters a database transaction.
3. The transaction uses `SET LOCAL` for `haloai.workspace_id`, `haloai.actor_id`, and `haloai.request_id`.
4. RLS returns no rows or rejects writes when workspace context is absent or mismatched. Code never falls back to an unscoped query.
5. Repositories accept only context-initialized transactions and never hold a global pool.
6. `SET LOCAL` is cleared at transaction end so pooled connections cannot leak prior request context.

RLS is defense in depth. Project membership, room membership, resource actions, and AI capability permissions are still rechecked by server-side application policy.

## Migration rules

- `packages/db/src/schema` is the typed schema source; reviewable SQL lives in `packages/db/drizzle`.
- Migrations are append-only. A migration used by a shared environment is never rewritten.
- Breaking changes follow expand, backfill, verify, and contract phases.
- Applications never migrate on startup. Deployment and migration use separate connections and lifecycles.
- Each migration restores required table grants without making the application role a table owner.
- Migrations are tested against an empty database and a representative existing-data copy, with documented failure recovery.

## Initial repository contracts

### Projects and rooms

- A creator is an active workspace member.
- A room creator is an active project member.
- Project or room creation and creator membership are committed in one transaction.
- `workspaceId` and creator Actor come only from server transaction context.

### Messages

- An author is an active room member.
- Messages are append-only facts. Editing and deletion never overwrite the original row.
- A room row lock serializes allocation of increasing message `sequence` values.
- `clientMutationId` is idempotent within workspace, room, and author scope.
- The idempotency check and sequence allocation occur under the same room lock.
- The server computes a digest over canonical JSON and ignores client-provided digests.
- One message contains at most 50 structured parts and 64 KiB of canonical JSON.
- History uses sequence cursor pagination with at most 100 records per page.

## Acceptance criteria

1. A clean database migrates through an explicit controlled command.
2. The application connection lacks `BYPASSRLS` and cannot read tenant tables without workspace context.
3. A workspace A transaction cannot read or write workspace B rooms or messages.
4. Concurrent requests with one `clientMutationId` produce exactly one message.
5. A pooled connection does not retain the previous transaction workspace setting.
6. Committed messages remain recoverable after an API restart.
7. Logs and API errors contain no database URL, password, raw SQL, or cross-tenant resource title.

## Current boundary

This stage delivers the database client, migration path, tenant transaction wrapper, project/room/message repositories, and HTTP APIs for the collaboration snapshot and appending messages. Schema SQL stays in `packages/db/drizzle`. Local virtual data lives in `packages/db/devdata` and is applied only when `DEMO_MODE=true` via `pnpm db:seed`. The web app no longer ships fake rooms, fake messages, or sample administration numbers; sign-in must verify hashed passwords through the authentication component.
