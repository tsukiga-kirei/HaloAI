# HaloAI security baseline

## Security stance

Every AI teammate is an untrusted service principal with narrowly delegated authority. A model may suggest an action; application policy decides whether the action is visible, allowed, requires approval, or is denied.

## Non-negotiable controls

1. Tenant and project scope are present in every durable record and query.
2. Authorization runs server-side before retrieval, model calls, and tool calls.
3. Provider keys and tool credentials never enter browser bundles, prompts, or ordinary logs.
4. Uploaded content, web pages, model output, and MCP results are untrusted data.
5. External, destructive, financial, publishing, and permission-changing actions require approval by default.
6. AI cannot create a role, elevate itself, approve its own action, or widen tool scope.
7. Each run has token, time, tool-call, and participant limits.
8. Audit events include actor, delegation source, inputs hash, policy decision, tool, result hash, and approval.

## Prompt-injection boundary

- Mark retrieved material as data, not instructions.
- Keep policy and tool allowlists outside the model context.
- Validate tool arguments with schemas and resource ownership checks.
- Filter retrieval by authorization before semantic ranking.
- Never pass through third-party access tokens to MCP servers.
- Disable network and filesystem access unless the task needs a scoped capability.

## Permission layers

- Platform: operator-only deployment, global security, and the full model catalog (providers, secrets, and per-tenant allocation).
- Workspace: ownership, membership, choosing a model for AI members from the allocated catalog, and retention.
- Project: rooms, documents, knowledge, and participant scope.
- Resource: read, write, publish, delete, and share actions.
- Tool: invoke scope plus risk category and approval policy.

## Launch gates

Before enabling real model or tool execution, add authenticated sessions, row-level tenant tests, encrypted secrets, rate limits, abuse controls, dependency scanning, CSP/security headers, and a tested incident-response procedure.
