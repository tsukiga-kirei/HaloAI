# HaloAI architecture

## Why TypeScript end to end

The product is dominated by real-time interaction, typed events, model streaming, permission checks, and document state. TypeScript can implement each of these layers without introducing a second application language. Provider-specific compute or document conversion can still be isolated behind HTTP or MCP later without changing the collaboration core.

## System shape

```text
Web / PWA
  -> application routes and streamed responses
  -> collaboration service
       -> authorization policy
       -> room and message service
       -> document and version service
       -> approval and audit service
       -> agent coordinator
            -> model provider adapters (configured by system admins; callable only after allocation to the tenant)
            -> tool policy gateway
            -> sandbox / MCP adapters
  -> PostgreSQL / object storage / event stream
```

## Domain rules

### Actor, role, and membership

- An `Actor` is a human, AI, or internal system identity.
- A `Role` is a reusable permission set.
- A `Membership` assigns an actor to a role in a workspace or project.
- An `AgentProfile` controls model, instructions, tools, memory, and budget; it never grants authorization by itself.

This separation lets one person or AI have different responsibilities in different projects without cloning identities or embedding permissions into prompts.

### Collaboration modes

- `mention`: only explicitly mentioned AI teammates participate.
- `facilitated`: a coordinator selects the smallest relevant participant set.
- `workflow`: a durable graph controls ordered work and approval gates.
- `roundtable`: a bounded discussion with a fixed budget and synthesizer.

Mention mode is the MVP default because it is predictable, inexpensive, and easy to audit.

### Memory scopes

- Turn context: temporary context for a single run.
- Actor memory: private preferences visible only where policy allows.
- Project memory: approved facts, decisions, and artifacts for one project.
- Workspace knowledge: governed sources shared across authorized projects.

Raw chat history is not automatically promoted to durable memory.

## Runtime evolution

### Foundation

Next.js hosts the interface and the current BFF routes. Browser authentication and session requests stay on the web origin and are rewritten to the API, so session cookies are not rejected as third-party across ports. The client does not need a public API URL. PostgreSQL is the source of truth for login sessions, rooms, and messages. Local setup requires the database. `DEMO_MODE` controls seed data, not authentication bypass. The collaboration path persists human messages only; Agent streaming is not connected yet.

Models are connected at the platform: system administrators maintain the catalog and allocate models to tenants. A workspace cannot connect a provider itself.

### Team beta

Add a dedicated TypeScript realtime service for WebSocket presence, typing, message fan-out, and Yjs updates. Move agent jobs to a durable queue. Keep the web application stateless.

### Enterprise

Add isolated workers, outbound network policy, secrets brokerage, SSO/SCIM, immutable audit export, data retention controls, and regional model/provider routing.
