# Deployment and diagnostic logging

[简体中文](../zh-CN/deployment-and-logging.md) · English

## 1. Goal and boundary

HaloAI currently uses two explicit Compose files: development containerizes only PostgreSQL while application processes run on the host; production builds deployable application services into immutable images and orchestrates them with Compose. Deployment configuration must not carry development demo switches, migration authority, or plaintext secrets into application request paths.

Diagnostic logs support troubleshooting and runtime observation; they are not security audit facts. `audit_events`, Agent run events, and usage ledgers remain separate append-only domain data. Ordinary logs cannot replace them, and an unavailable log sink must never silently bypass an audit transaction.

## 2. Environment shapes

| Environment       | Compose file        | Containers                                            | Application runtime                                              | Log destination                       |
| ----------------- | ------------------- | ----------------------------------------------------- | ---------------------------------------------------------------- | ------------------------------------- |
| Local development | `compose.dev.yaml`  | PostgreSQL                                            | pnpm runs Web, API, Collab, and Worker on the host               | Terminal and repository `logs/`       |
| Production        | `compose.prod.yaml` | Gateway, Web, API, Worker, migration jobs, PostgreSQL | Images are prebuilt; Compose owns health and dependency ordering | Container stdout with Docker rotation |

Local development must not require image builds to run Web or API. Production must not mount source, use watch mode, seed demo data automatically, or give API/Worker access to `DATABASE_ADMIN_URL`.

The collaboration service image must be buildable with the production images, but it is excluded from the default production startup set until real short-lived ticket authorization and persistent storage adapters are connected. Enabling its profile must still preserve the process fail-closed guard and must never fall back to the demo in-memory adapter.

## 3. Diagnostic logging contract

API, Collab, and Worker share one structured logger. Every JSON record contains at least:

```text
time, level, service, environment, msg
```

When request or job context exists, logs should add correlation fields such as `requestId`, `runId`, `workspaceId`, `jobId`, and `traceId`. They must not record full request bodies, cookies, authorization headers, session tokens, database URLs, passwords, model keys, tool credentials, complete prompts, or document content.

The shared logger must redact common secret field names in both camelCase and snake_case. Exception objects serialize only a stable error type and code, never `message` or `stack`. User responses continue to expose only stable error codes and request IDs.

Request logs record `requestId`, method, path (query string stripped), status, and duration. A path `workspaceId` may be added as a correlation field. They must not record request bodies, cookies, Authorization headers, or full URL queries. Levels: health checks and high-frequency disconnects are `debug`; successful requests and lifecycle events are `info`; 4xx is `warn`; unhandled failures and persistence errors are `error`; process-ending failures are `fatal`.

## 4. Storage and rotation

### Local

- With `LOG_DIR=./logs`, API, Collab, and Worker write `logs/api.log`, `logs/collab.log`, and `logs/worker.log` while retaining terminal output.
- Root development commands append combined Web and Turborepo output to `logs/dev.log`.
- `logs/` is excluded from Git and Docker build context. It is local troubleshooting data, not durable product state.
- Local files do not enforce the formal retention policy. Developers may remove them, and application recovery must never depend on them.

### Production

- Applications write only to stdout/stderr and create no log files in the container writable layer.
- Every long-running service uses Docker's `local` log driver with `max-size` and `max-file` limits so one container cannot grow without bound on the host.
- Operators use `docker compose ... logs`; ordinary diagnostic logs are not guaranteed to survive container recreation.
- When cross-host search, alerts, or enforced 30-day retention are required, stdout can be connected to a centralized collector. OpenTelemetry and a centralized log backend remain a later observability stage; current rotated files are not a complete logging platform.

## 5. Production startup order and security

Production Compose converges in this order:

1. PostgreSQL becomes healthy.
2. One-shot database-schema and Graphile Worker queue migrations exit successfully using the separate administrator connection and grant the Worker runtime role only queue-object usage.
3. API and Worker start with least-privilege application/authentication connections.
4. Web reaches API through its internal service name.
5. A TLS gateway exposes Web through host ports configured by `GATEWAY_HTTP_PORT` and `GATEWAY_HTTPS_PORT`; container listeners remain fixed at 80/443, while database, API, and Worker do not publish host ports.

`.env.production` exists only on the deployment host or in the secret injection environment and is excluded from Git and image build contexts. Production requires independent strong passwords, an authentication secret of at least 32 characters, a public HTTPS domain, and an ACME contact email, and it keeps `DEMO_MODE=false`.

## 6. Operator entry points

```bash
pnpm infra:up       # Start local PostgreSQL with compose.dev.yaml
pnpm dev:local      # Migrate/seed, then run Web and API on the host
pnpm prod:config    # Validate production variables and rendered Compose
pnpm prod:build     # Build every production image, including dormant Collab
pnpm prod:up        # Start default production services after migration succeeds
pnpm prod:logs      # Follow production container logs
pnpm prod:down      # Stop production while preserving the database volume
```

## 7. Acceptance

1. `docker compose -f compose.dev.yaml config` contains only PostgreSQL and stores database data in a named volume.
2. With `LOG_DIR` set, API, Collab, and Worker logs appear in both the terminal and their JSONL files, and known secret fields render as `[REDACTED]`.
3. `compose.prod.yaml` mounts no source, publishes no database/API/Worker port, and configures bounded Docker log rotation for long-running services.
4. `migrate` and `worker-migrate` receive `DATABASE_ADMIN_URL`; API and the long-running Worker do not.
5. Web, API, Worker, Collab, and migration targets all build from one locked dependency graph; default production startup never launches Collab in demo mode.
6. Missing production domain, database URLs, passwords, or authentication secret causes Compose rendering or process startup to fail instead of selecting development defaults.
7. Chinese and English documentation, environment templates, scripts, and Compose files stay aligned and pass `pnpm check`.
