# HaloAI internationalization specification

## 1. Purpose and normative language

This specification defines how HaloAI selects a user-interface locale, composes messages, represents content language, formats time and data, prepares for right-to-left layouts, and proves translation quality in continuous integration.

The words MUST, MUST NOT, SHOULD, SHOULD NOT, and MAY are normative. Internationalization is an application boundary, not a final copy-editing pass. A feature is incomplete when its visible text, errors, notifications, dates, or generated content bypass this boundary.

The launch UI locales are zh-CN and en-US. The architecture MUST allow another locale to be added without changing domain schemas, authorization rules, API error contracts, or page structure.

## 2. Locale and language model

HaloAI distinguishes four values that MUST NOT be collapsed into one:

| Value             | Meaning                                                | Scope                       | Example       |
| ----------------- | ------------------------------------------------------ | --------------------------- | ------------- |
| UI locale         | Language and formatting conventions for product chrome | Request and user preference | zh-CN         |
| Content language  | Language of a message, document, comment, or source    | Individual content record   | fr            |
| Response language | Language requested for an AI result                    | Run or task                 | en-US         |
| Time zone         | Civil-time rules used to display or schedule instants  | User or workspace           | Asia/Shanghai |

UI locales use canonical BCP 47 tags from a closed, typed allowlist. Content-language tags MAY represent languages that are not supported as UI locales. Unknown content language is stored as und rather than guessed with false confidence.

Locale never grants access, changes an Actor identity, selects a tenant, or changes policy. Localized routes and message arguments are untrusted input until validated.

## 3. Locale negotiation, routing, and persistence

### 3.1 Resolution order

The server owns locale negotiation. For an authenticated request, the effective UI locale is resolved in this order:

1. valid saved user preference;
2. valid locale cookie;
3. best supported match from Accept-Language;
4. zh-CN.

For an unauthenticated request, the saved-user step is omitted. Unsupported, malformed, wildcard-only, or excessively long language headers are ignored safely. Matching is case-insensitive, normalizes canonical casing, honors quality weights, and may reduce a specific tag to a supported parent only through an explicit map. It MUST NOT use substring matching.

The locale route segment is the canonical representation of the resolved locale, not a second hidden preference. If the segment is missing, unsupported, or conflicts with a stronger saved preference, the server redirects once to the equivalent canonical localized route. API, asset, callback, health, and realtime endpoints are not placed beneath locale routes.

### 3.2 Selection and switching

An explicit language-switch action MUST:

1. validate the requested locale against the supported tuple;
2. save the account preference when authenticated;
3. update the signed or integrity-protected locale cookie;
4. preserve the current workspace and resource route;
5. replace only the locale segment;
6. refresh server-rendered content without losing unsaved editor state; and
7. announce the language change accessibly.

Changing language MUST NOT repeat a mutation, restart an AI run, resubmit a form, or clear a draft. A failed preference write MAY keep the local selection for the current session, but the interface must disclose that it was not saved.

### 3.3 Cookie and cache rules

The locale cookie contains only a supported locale identifier. It carries no authorization data and is never trusted as identity. Its SameSite, Secure, path, and lifetime settings follow the session threat model.

Localized HTML responses include the locale in the cache key and set an appropriate Vary policy when negotiation depends on request headers. Private workspace pages are not shared through a public cache. Redirects preserve only allowlisted internal paths to avoid open redirects.

## 4. TypeScript locale contract

The supported locale set and default are defined once in the internationalization package and imported by the web application, API presentation layer, worker, notification renderer, and tests.

```ts
export const supportedLocales = ["zh-CN", "en-US"] as const;
export type Locale = (typeof supportedLocales)[number];
export const defaultLocale: Locale = "zh-CN";

export interface LocaleContext {
  locale: Locale;
  timeZone: string;
  source: "account" | "cookie" | "header" | "default";
}
```

Code MUST use the Locale type after validation. Unvalidated strings remain strings. Casting request data to Locale is prohibited.

Locale resolution is a pure function with table-driven tests. Framework adapters may read cookies and headers, but the resolver receives normalized inputs and returns the locale plus its source. This keeps browser, server, worker, and test behavior aligned.

## 5. Message catalog architecture

### 5.1 Namespaces and ownership

Catalogs are split by stable product domains:

- common;
- navigation;
- account;
- workspace;
- room;
- chat;
- document;
- agent;
- tool;
- permission;
- approval;
- notification;
- settings;
- validation; and
- errors.

Each key has one owning domain and one concise usage description. Shared wording moves to common only when its meaning, capitalization, parameters, and accessibility context are genuinely identical.

### 5.2 Typed keys and arguments

Message keys are stable identifiers such as approval.request.expires and error.permission.denied. English prose, route paths, database IDs, and concatenated strings are not keys.

The canonical catalog schema generates or infers:

- MessageKey, the union of all valid keys;
- MessageArgs<K>, the required and optional ICU values for key K;
- RichMessageKey, the subset that permits approved rich-text tags; and
- Namespace, the valid lazy-loading boundaries.

The translation interface has this semantic contract:

```ts
function translate<K extends MessageKey>(
  key: K,
  values: MessageArgs<K>,
  context: LocaleContext,
): string;
```

Dynamic key construction, arbitrary string indexing, and fallbacks such as translate(valueFromApi) are prohibited. When a finite state maps to copy, code uses an exhaustive typed record from state to MessageKey.

Every locale MUST contain exactly the canonical key set and compatible argument domains. Missing keys, orphaned keys, changed placeholder types, or a plural branch missing other are build failures.

### 5.3 Key lifecycle

Keys describe meaning, not current wording. Copy-only changes retain the key. A semantic change receives a new key when old and new meanings must coexist or cached jobs need deterministic rendering.

Removing a key requires proving that application usage, queued notifications, persisted templates, tests, and migration paths no longer reference it. Deprecated keys have an owner and removal release; permanent aliases are not allowed.

## 6. ICU message composition

Messages use ICU Message syntax for plural, select, selectordinal, number, date, and time behavior. Complete sentences live in the catalog.

Required rules:

- Never concatenate translated fragments into a sentence.
- Never assume English word order or singular/plural grammar.
- Use select for human, AI, service, unknown, and other identity wording when grammar differs.
- Use plural with an other branch; zero, one, two, few, or many appear only when the locale needs them.
- Keep punctuation inside the translated message.
- Use named semantic arguments such as actorName and itemCount, not positional values.
- Do not embed preformatted dates, numbers, or currency when the message formatter should own them.
- Translator descriptions explain ambiguous nouns, action direction, UI length constraints, and whether a value is human-authored.

Catalogs are parsed and compiled during build. ICU syntax supplied by users, models, connectors, or APIs is always data, never executable message syntax.

## 7. Values, rich text, and escaping

All variable values are untrusted by default. Plain messages escape markup for their output context. Rich messages use a closed tag allowlist whose renderers are application-owned components; catalogs cannot provide arbitrary HTML, event handlers, styles, URLs, or component names.

Links in localized messages use typed internal destinations or application-owned external constants. A translator cannot introduce a new destination. User names, workspace names, AI display names, file names, and quoted content are isolated from surrounding bidirectional text.

Messages MUST NOT include secrets, access tokens, raw authorization details, hidden policy rules, stack traces, or tenant identifiers merely because a locale key requests them. Localization does not weaken log-redaction or privacy policy.

## 8. API errors and validation

Domain and API layers return stable machine-readable errors, not localized display prose:

```ts
interface ApiError {
  code: ErrorCode;
  params?: Record<string, string | number | boolean>;
  field?: string;
  retryAfterMs?: number;
  traceId: string;
}
```

ErrorCode is a versioned union. Each code maps exhaustively to a UI MessageKey and a safe argument adapter. The client localizes at the presentation boundary using its current locale.

Rules:

- HTTP status and error code semantics are locale-independent.
- Params contain safe structured values, never ready-made sentence fragments.
- Field validation uses stable field identifiers and reason codes.
- Unknown codes render a localized generic error and preserve traceId for support.
- Retries, telemetry, and automation branch on codes, never translated text.
- Server logs record the code and safe diagnostics, not every rendered language.
- Authentication and authorization errors reveal no extra resource existence through different wording.

Notification and worker failures use the same error-code registry. Changing display copy never changes retry or policy behavior.

## 9. Numbers, currency, units, lists, and names

All formatting uses locale-aware Intl formatters through shared typed helpers. Components do not call ad hoc string replacement or append unit labels.

- Numbers define precision, rounding mode, and notation by business meaning.
- Percentages store ratios or percentages consistently and document the choice.
- Money carries ISO currency code and minor-unit semantics; locale never guesses currency.
- Measurements carry a typed unit and explicit conversion policy.
- Lists use locale-aware conjunction or disjunction formatting.
- Human-readable display names use locale display-name formatting where supported.
- Machine identifiers, handles, URLs, code, file paths, model IDs, and audit IDs are never translated.

Formatted values for display are not reused for persistence, calculation, sorting, signatures, idempotency keys, or API payloads.

## 10. Time zones, dates, and scheduling

Persistent timestamps represent instants in UTC with sufficient precision. Locale and time zone are separate inputs.

Display time-zone precedence is:

1. valid saved user time zone;
2. valid workspace default;
3. validated browser-detected IANA zone;
4. UTC.

Only IANA time-zone identifiers from the runtime data set are accepted. Numeric offsets are not stored as durable time-zone preferences because they do not encode daylight-saving transitions.

Requirements:

- APIs transmit ISO 8601 instants with Z or an explicit offset.
- UI formatting states whether a date is absolute, relative, date-only, time-only, or date-time.
- Relative time has an accessible absolute-time equivalent.
- Ambiguous or nonexistent local times during daylight-saving transitions require explicit disambiguation.
- Scheduled work stores the intended local date/time, IANA zone, recurrence rule, and resolved next instant.
- Date-only business values are not converted through UTC midnight.
- Week start and calendar labels follow locale policy, not hand-written arrays.
- Tests freeze the instant and time zone; they do not depend on the CI machine clock.

Audit and security interfaces show an unambiguous absolute timestamp and the viewer's chosen zone. Exports declare their time-zone convention.

## 11. User content, translations, and AI language

### 11.1 Original content

User-authored messages, documents, comments, names, and uploaded text are preserved verbatim subject to security normalization. Each substantive content record stores contentLanguage as a valid language tag or und. UI locale is not used as silent proof of content language.

Language detection MAY suggest a tag with confidence metadata, but it never rewrites the original and never overrides an explicit author choice without confirmation.

### 11.2 Translation derivatives

A translation is a traceable derivative with:

- source resource ID and immutable source-version or content hash;
- source and target language;
- translation status;
- creator Actor or service;
- model or translation-engine version when applicable;
- creation time; and
- stale marker when the source changes.

Translations inherit the source resource's tenant, permissions, classification, retention, legal hold, and deletion. A translation MUST NOT broaden visibility, enter retrieval before authorization, or replace the original silently. Users can distinguish original, generated translation, human-edited translation, and stale translation.

### 11.3 AI response language

UI locale, conversation language, source language, and requested output language are separate run inputs. An Agent follows the explicit task language first, then the room or document language policy, then the initiating user's preference. The resolved response language is persisted with the run.

System and policy instructions remain semantically stable across locales. A translated prompt cannot grant tools, change approval rules, or alter authorization. Evaluations verify equivalent safety outcomes in every supported UI locale and representative content languages.

### 11.4 Search and retrieval

Search records content language and analyzer version. Query-language detection may select analyzers or multilingual retrieval, but authorization filters run before candidate content is exposed or ranked for the caller.

Search results label translated and original text. Snippets are generated from authorized content in the requested display language where available. Missing translation falls back to the original with an explicit language label, not a fabricated localized version.

## 12. Notifications, email, push, exports, and background work

Canonical notifications store a typed event code, MessageKey, typed arguments, resource target, recipient scope, and creation instant. In-product notifications render in the viewer's current locale.

External delivery jobs capture recipient locale, time zone, catalog version, and safe template arguments at enqueue time so retries are deterministic. A preference change affects new deliveries, not the meaning of an already-sent message.

Additional rules:

- Subjects, previews, plain text, and HTML derive from the same semantic template.
- Push and lock-screen text uses privacy-safe variants.
- Deep links contain canonical resource identifiers and are reauthorized on open.
- Unsubscribe, consent, security, and legal language has locale-complete variants.
- Export jobs record requested locale and time zone in their manifest.
- CSV retains machine-readable raw values where required and documents any localized display columns.
- Background jobs never fall back to the worker host locale.

## 13. RTL readiness, bidirectional safety, and input

No right-to-left locale is required at launch, but the product MUST be structurally ready.

- Set html lang and dir from validated locale metadata.
- Use CSS logical properties and logical start/end terminology.
- Mirror directional navigation icons only when their meaning is spatial.
- Do not mirror universal media controls, brand marks, checkmarks, or text-direction-neutral symbols.
- Use dir=auto for isolated user-authored blocks where appropriate.
- Wrap interpolated names, IDs, codes, and mixed-direction values in bidirectional isolation.
- Reject or visibly escape dangerous invisible controls in handles, audit identifiers, and security-sensitive comparisons.
- Preserve keyboard order, focus order, table semantics, and editor cursor behavior when direction changes.

Chinese and other input methods require composition-safe inputs. Enter MUST NOT submit while an IME composition is active. Character counts, truncation, selection, mentions, and search operate on Unicode-aware boundaries rather than UTF-16 code units.

## 14. Pseudo-localization and layout validation

Two test-only locales are generated from the canonical catalog:

| Pseudo-locale | Behavior                                                                                   | Detects                                                  |
| ------------- | ------------------------------------------------------------------------------------------ | -------------------------------------------------------- |
| en-XA         | Accents text, expands ordinary copy by approximately 35–50 percent, preserves placeholders | clipping, fixed widths, concatenation, untranslated text |
| ar-XB         | Applies right-to-left direction, mirrors representative text, isolates variables           | physical CSS, direction bugs, mixed-script failures      |

Generation preserves ICU structure, rich tags, keyboard shortcuts, product name, code tokens, and test selectors. Pseudo-locales are never accepted as persisted production preferences and never sent to real users.

Core screens test long names, long email addresses, large numbers, plural branches, empty values, CJK text, emoji, combining characters, and mixed-direction content. Truncation never hides the only action label, risk warning, permission reason, or approval scope.

## 15. Verification and continuous-integration gates

### 15.1 Static catalog gates

Every pull request runs:

1. TypeScript type checking for locale, key, and argument unions.
2. Exact key-parity checks across zh-CN and en-US.
3. ICU parse and compile checks for every branch.
4. Placeholder-name and value-domain compatibility checks.
5. Detection of orphaned keys and non-allowlisted dynamic lookup.
6. Detection of forbidden raw UI strings in scoped production components.
7. Rich-tag allowlist and unsafe-destination checks.
8. Deterministic pseudo-locale generation with a clean-tree assertion.
9. API ErrorCode-to-MessageKey exhaustiveness checks.
10. Catalog size and namespace-boundary checks.

Identical translations are warnings only for an explicit allowlist such as product names, protocol terms, codes, and universally identical symbols. Copy reviewers must resolve all other warnings.

### 15.2 Behavioral matrix

Required automated coverage includes:

- negotiation for saved preference, cookie, weighted headers, invalid tags, and default;
- canonical route redirect without redirect loops;
- language switch while a draft, stream, editor transaction, and modal are active;
- plural, select, number, currency, date, relative-time, and rich-message branches;
- daylight-saving gaps and overlaps in at least two zones;
- notification rendering and deterministic retry;
- API unknown-code fallback and field-error mapping;
- source-language preservation and stale-translation behavior;
- tenant and permission inheritance for translations;
- AI response-language precedence without authority change;
- keyboard and IME composition;
- en-XA and ar-XB screenshots at desktop and small-mobile widths; and
- no horizontal overflow, inaccessible clipping, or missing accessible names.

### 15.3 Release gates

A release is blocked when:

- either launch locale is missing a reachable key;
- catalog schemas or ICU arguments diverge;
- an API can return an unmapped error code;
- security, consent, billing, approval, deletion, or recovery copy lacks a reviewed translation;
- pseudo-localized core flows overflow or become inoperable;
- a locale changes authorization, state-machine, retry, or accounting behavior; or
- a new locale has no owner, fallback plan, date/number review, accessibility review, and production rollback plan.

## 16. Operations and definition of done

Catalog changes are versioned with application code. External delivery records retain the catalog version needed to explain what was sent. Missing-key and unknown-error metrics include locale and key/code but no user content. Alerting detects sudden fallback growth without turning translated strings into metric labels.

Adding a production locale requires:

1. registering canonical locale metadata and fallback;
2. completing every required catalog namespace;
3. reviewing ICU grammar, terminology, dates, numbers, and legal text;
4. verifying fonts, line breaking, input, search, and document export;
5. passing pseudo-localization, visual, accessibility, and performance gates;
6. validating notification and support operations; and
7. defining ownership and a rollback path.

A user-facing feature is internationalization-complete only when both launch locales are semantically complete, all visible and assistive text uses typed keys, API errors remain locale-independent, content language is preserved, date and number behavior is explicit, notifications are deterministic, RTL structure is safe, and every CI gate in this specification passes.
