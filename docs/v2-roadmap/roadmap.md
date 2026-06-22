# V2 Roadmap: Provider-Agnostic Local AI Runtime Workbench

## Purpose

V1 should ship as a Claude-first local RAG and skill workflow. V2 should keep that foundation and generalize it into a provider-agnostic local AI runtime workbench that can discover, test, select, and run multiple local AI CLIs or local model servers without exposing device-local identity or secret state.

This roadmap is documentation-only. It does not change the current v1 API surface or the Claude-focused runtime.

## Navigation

- [Research CLI Support Matrix](./research-cli-support-matrix.md)
- [Provider Registry Architecture](./provider-registry-architecture.md)
- [Discovery And Security Model](./discovery-and-security-model.md)
- [UI/UX Plan](./ui-ux-plan.md)
- [Adapter Backlog](./adapter-backlog.md)
- [Open Source Inspiration](./open-source-inspiration.md)
- [Test Plan](./test-plan.md)

## Current V1 Baseline

The current implementation is intentionally narrow:

- LLM provider selection is hard-coded around `anthropic_api` and `claude_code_cli`.
- Claude CLI is the only local subscription-backed CLI provider.
- Claude profile discovery, status, login, smoke testing, and runtime-applied provider settings already establish the privacy and local-only patterns V2 should reuse.
- Setup Doctor already explains local readiness deterministically.
- Chat, skill editing, RAG index state, and export diagnostics are local-first and privacy-preserving.

That is a good V1 shipping shape. V2 should not expand provider support until the Claude path is stable in production-like local usage.

## Product Direction

V2 should become a local AI runtime workbench:

- Detect installed AI runtimes shallowly and safely.
- Show readiness for each runtime without leaking account or device-specific state.
- Let a user test a provider explicitly before making it active.
- Route chat generation through a common provider contract.
- Keep provider-specific auth and execution isolated inside adapters.
- Preserve a deployable API-key provider path for hosted environments.

The app should not become an arbitrary command runner. Providers must be allowlisted adapters with known commands, known auth models, deterministic smoke tests, and sanitizer coverage.

## Phase Order

### V1: Claude-First Release

Ship the current Claude-focused app.

Acceptance criteria:

- API-key provider remains default and deployable.
- Local Claude CLI mode is localhost-only and explicitly enabled.
- Claude profile selection is private and generic in UI/API output.
- Runtime-applied provider settings work without dev-server restart.
- Setup Doctor gives deterministic readiness checks.
- RAG index and skill QA workflows are stable enough for local users.

### V2.1: Provider Registry Foundation

Introduce provider registry types and read-only discovery without switching chat generation yet.

Acceptance criteria:

- New provider registry module contains typed adapters and discovery results.
- Claude adapter is ported into the registry as the reference adapter.
- Settings can show provider cards for installed and missing providers.
- Existing Claude endpoints keep working during migration.
- All provider status output passes sanitization tests.

### V2.2: Multi-CLI Smoke Tests

Add explicit smoke-test actions for Tier 1 providers.

Acceptance criteria:

- Gemini, Codex, Kiro, Copilot, Qwen, and Claude expose `Test` actions through one endpoint shape.
- Smoke tests run only after user action.
- Child-process envs are provider-specific and remove conflicting secrets where needed.
- Failures are cleanly categorized as missing executable, not signed in, permission required, provider policy blocked, timeout, or unknown.

### V2.3: Active Provider Switching

Move chat generation onto the registry.

Acceptance criteria:

- `/api/chat` calls the active provider via the registry contract.
- Runtime-applied settings support all active provider keys, not only Claude.
- Existing `anthropic_api` and `claude_code_cli` settings migrate without breaking old `.env.local` files.
- Setup Doctor explains provider mismatch and smoke-test state for any active provider.

### V2.4: Local Model Servers And Gateways

Add adapters for Ollama, LM Studio, LiteLLM, and OpenRouter-style gateways.

Acceptance criteria:

- Local model servers use HTTP adapters instead of shelling out when stable APIs exist.
- API gateway adapters support model catalogs, health checks, and auth presence checks without serializing keys.
- Hosted gateway support is clearly separated from local subscription CLI support.

### V3: Routing And Orchestration

Add higher-impact routing after the provider abstraction is proven.

Acceptance criteria:

- Users can set fallback provider order.
- Setup Doctor can recommend a fallback without switching automatically.
- Future routing can choose providers by capability: fast answer, code edit, local-only, long-context, or cheapest API gateway.
- Observability is sanitized and bounded: provider id, status, latency bucket, error category, and smoke-test state only.

## Public Interfaces To Plan

V2 should introduce these endpoints while keeping existing Claude endpoints until migration is complete:

- `GET /api/settings/providers`
- `GET /api/settings/providers/:providerId/status`
- `POST /api/settings/providers/:providerId/test`
- `POST /api/settings/providers/:providerId/login`
- `POST /api/settings/providers/active`

All endpoints that report device-local provider state must remain localhost-only.

## Migration Rules

- Keep `anthropic_api` and `claude_code_cli` accepted in v2 for backward compatibility.
- Add a registry-backed active provider id, but map existing env keys into that model.
- Keep v1 Claude endpoints as compatibility wrappers until the Settings UI fully moves to `AI Providers`.
- Do not auto-enable a provider because it was detected.
- Do not auto-run login or generation on page load.
- Do not store raw generated status output in persistent cache.

## Main Risks

- CLI vendors use different names for headless mode, output format, login, and tool permission flags.
- Subscription-backed CLIs may behave differently from API-key-backed modes.
- Some CLIs are agentic and can edit files or run commands if invoked with broad permissions.
- Local status commands can print account, org, token, or path details.
- Several ecosystem projects are moving quickly, so adapter implementation needs source-specific validation before coding.

## Recommended Next Implementation Slice

Build V2.1 first:

1. Add provider registry types and adapter interfaces.
2. Wrap the existing Claude CLI provider in that contract.
3. Add read-only provider discovery for Tier 1 commands.
4. Show provider cards in Settings without changing chat routing.
5. Extend Setup Doctor to report provider registry readiness.

That slice creates the abstraction without increasing generation risk.
