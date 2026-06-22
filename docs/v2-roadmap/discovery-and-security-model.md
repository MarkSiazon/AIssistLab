# Discovery And Security Model

## Security Goal

V2 should detect provider readiness without turning the app into a device crawler or account inspector. The user should understand what is installed and usable, but the app must not expose account identifiers, full home paths, auth token paths, provider config contents, API keys, or raw provider status output.

## Discovery Scope

Discovery should be shallow by default:

1. Explicit path configured by the user.
2. Known official install paths for that provider.
3. PATH lookup for known executable names.
4. Local HTTP health checks for known model-server ports only when the adapter owns that endpoint.
5. Optional deeper detection only after the user clicks a `Detect more` action.

Do not run broad filesystem scans. Do not enumerate arbitrary profile folders outside known provider roots. Do not inspect provider config files unless an adapter has a narrow, documented reason and sanitizes the result.

## Detection Rules

### CLI Providers

For each CLI adapter:

- Resolve command from explicit path first.
- Try known official install locations next.
- Fall back to PATH lookup for known command names.
- Run `--version` or `--help` only when the command is found and the adapter knows the command should not mutate state.
- Use strict timeouts.
- Capture only bounded output.
- Sanitize before returning any output to UI/API.

### Local Model Servers

For server adapters:

- Check known local endpoints only, such as Ollama's default local API or LM Studio's configured local server endpoint.
- Do not probe arbitrary ports.
- Do not start servers automatically during page load.
- Allow a user-clicked `Start server` only if the provider has a safe official command and the UI makes it clear a local process will be launched.

### API Gateways

For gateway adapters:

- Detect by configured endpoint and key presence only.
- Do not print keys.
- Do not call paid model generation for passive status.
- Use explicit smoke tests for live calls.

## Privacy Rules

Public API and UI output must never include:

- Full home paths.
- Full executable paths when they reveal usernames or machine layout.
- Account emails, organization names, usernames, or tenant names.
- API keys, refresh tokens, session tokens, or authorization headers.
- Provider auth/config file contents.
- Token cache paths.
- Raw stderr/stdout from provider status commands.
- Hidden provider profile folder names.

Use generic labels:

- `Installed from PATH`
- `Installed from native location`
- `Default profile`
- `Profile 1`
- `Profile 2`
- `Manual profile`
- `Local server reachable`
- `Signed in`
- `Not signed in`
- `Needs test`

Use sanitized path displays:

- `~/.provider/<hidden>`
- `%USERPROFILE%\\.provider\\<hidden>`
- `<configured endpoint>`
- `<redacted>`

## Execution Rules

No automatic login or generation on page load.

Allowed passive checks:

- PATH existence.
- Known executable version/help checks.
- Local model-server health checks on allowlisted endpoints.
- Provider-specific status commands that are documented, non-mutating, bounded, and sanitized.

User-clicked actions:

- `Detect`: run discovery now.
- `Open Login`: launch provider login visibly.
- `Test`: run a minimal smoke prompt.
- `Set Active`: persist and runtime-apply selected provider where supported.

## Smoke Test Rules

Smoke tests should:

- Run only after user clicks `Test`.
- Use prompt: `Reply exactly: OK`.
- Disable or avoid file tools and shell tools when the provider supports that.
- Use a short timeout.
- Store only sanitized result, provider id, config fingerprint, and pass/fail status.
- Treat output that includes extra text as a failed or partial result, depending on provider capabilities.

## Child Process Environment Rules

Each adapter should build an env object from:

- The current process env minus known conflicting secrets.
- Provider-specific env values selected through app settings.
- Provider-specific config directory or endpoint when needed.

Never serialize the child env through public APIs. Never show whether a specific secret value matched a provider account. Only show present/missing/malformed.

## Localhost Guards

All endpoints that expose device-local state must be localhost-only:

- Provider discovery.
- Provider status.
- Provider smoke tests.
- Provider login launch.
- Settings save.
- Runtime provider state.
- Path existence checks.
- RAG index status.
- Skill filesystem APIs.

Reject non-local `Host` headers with `403`.

## Production Guards

Hosted deployments should reject local CLI providers:

- `agent_cli` providers require local development.
- `local_model_server` providers require local development unless explicitly configured for a private network deployment.
- `api_gateway` and `api_direct` providers can be deployable if they use server-side keys and normal production auth.

## Audit And Logging

Logs should record:

- Provider id.
- Operation type.
- Status code.
- Error category.
- Duration bucket.

Logs should not record:

- Prompts with local file contents unless explicitly debug-enabled and local-only.
- Full command line with sensitive args.
- Raw provider status output.
- Full paths.
- Token or config paths.
