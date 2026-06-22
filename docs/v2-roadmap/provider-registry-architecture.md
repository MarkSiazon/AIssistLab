# Provider Registry Architecture

## Goal

V2 should replace provider-specific branching with a registry of allowlisted adapters. Each adapter owns discovery, status, auth launch, smoke testing, generation, and sanitization for one provider family.

The registry is not a generic shell runner. It is a typed table of supported runtimes with narrow commands and strict output boundaries.

## Provider Kinds

```ts
type AiProviderKind =
  | "agent_cli"
  | "local_model_server"
  | "api_gateway"
  | "api_direct";
```

- `agent_cli`: terminal-native AI coding agent, such as Claude Code, Gemini CLI, Codex CLI, Kiro CLI, Copilot CLI, Qwen Code, OpenCode, Aider, Continue, or Cursor Agent.
- `local_model_server`: local runtime with an HTTP API or SDK, such as Ollama or LM Studio.
- `api_gateway`: one API facade that routes to many models, such as LiteLLM or OpenRouter.
- `api_direct`: direct provider API integration, such as the existing Anthropic API-key provider.

## Provider Contract

```ts
interface AiRuntimeProvider {
  id: string;
  label: string;
  kind: AiProviderKind;
  discover(): Promise<ProviderDiscovery>;
  getStatus(): Promise<ProviderStatus>;
  openLogin?(selection?: ProviderSelection): Promise<LoginLaunchResult>;
  test(selection?: ProviderSelection): Promise<SmokeTestResult>;
  generate(input: GenerateInput): AsyncIterable<GenerateEvent>;
  sanitize(value: unknown): PublicProviderOutput;
}
```

## Supporting Shapes

```ts
type ProviderStatusValue =
  | "installed"
  | "missing"
  | "needs_auth"
  | "ready"
  | "blocked"
  | "failed"
  | "unknown";

interface ProviderDiscovery {
  providerId: string;
  installed: boolean;
  commandSource: "explicit" | "known_path" | "path" | "server" | "missing";
  commandDisplay?: string;
  versionDisplay?: string;
  warnings: string[];
}

interface ProviderStatus {
  providerId: string;
  status: ProviderStatusValue;
  message: string;
  suggestedFix?: string;
  capabilities: ProviderCapability[];
  sanitizedDetails?: Record<string, string | number | boolean | null>;
}

type ProviderCapability =
  | "headless_text"
  | "streaming"
  | "json_output"
  | "local_only"
  | "subscription_auth"
  | "api_key_auth"
  | "model_server"
  | "file_tools"
  | "shell_tools";

interface ProviderSelection {
  profileId?: string;
  manualConfigDir?: string;
  model?: string;
  endpoint?: string;
}

interface SmokeTestResult {
  providerId: string;
  ok: boolean;
  status: "passed" | "failed" | "blocked" | "timeout" | "unknown";
  message: string;
  outputPreview?: string;
  testedAt: string;
  configFingerprint: string;
}

interface GenerateInput {
  prompt: string;
  context: string;
  citations: Array<{ source: string; section?: string; score?: number }>;
  timeoutMs: number;
  abortSignal?: AbortSignal;
}

type GenerateEvent =
  | { type: "text"; text: string }
  | { type: "citation"; source: string; section?: string; score?: number }
  | { type: "status"; message: string }
  | { type: "error"; code: string; message: string; suggestedFix?: string };

interface PublicProviderOutput {
  safe: true;
  value: unknown;
}
```

## Registry Responsibilities

The registry should:

- Register provider adapters in a single server-only module.
- Resolve the active provider by id.
- Return public provider cards for Settings.
- Run discovery and status methods behind localhost-only API guards.
- Persist active provider settings through `.env.local`.
- Apply provider runtime settings to the current server session where supported.
- Cache smoke-test results by provider id and config fingerprint.
- Route generation through the active provider.

## Adapter Responsibilities

Each adapter should:

- Resolve executable or server endpoint using provider-specific rules.
- Know exactly which commands are safe for status and smoke tests.
- Build child-process envs from a narrow allowlist.
- Remove conflicting credentials where the provider's auth model requires it.
- Enforce timeouts and process cleanup.
- Normalize provider errors into stable app error codes.
- Sanitize every status, stderr, stdout, and exception string before returning it.

## API Shape

Planned V2 endpoints:

- `GET /api/settings/providers`
- `GET /api/settings/providers/:providerId/status`
- `POST /api/settings/providers/:providerId/test`
- `POST /api/settings/providers/:providerId/login`
- `POST /api/settings/providers/active`

Compatibility rule:

- Keep existing v1 Claude endpoints as wrappers until the Settings UI and `/api/chat` fully use the registry.

## Active Provider Model

V2 should support both old and new config:

```env
LLM_PROVIDER=anthropic_api
AI_PROVIDER=claude_code_cli
AI_PROVIDER_MODEL=
AI_PROVIDER_ENDPOINT=
```

Migration behavior:

- If `AI_PROVIDER` is missing, map `LLM_PROVIDER=anthropic_api` to `anthropic_api`.
- If `AI_PROVIDER` is missing, map `LLM_PROVIDER=claude_code_cli` to `claude_code_cli`.
- Do not remove `LLM_PROVIDER` until a later migration.
- Runtime-applied settings should include both compatibility and registry keys.

## Generation Strategy

Provider generation should produce a common event stream:

1. Build a bounded RAG prompt.
2. Call the active adapter's `generate`.
3. Parse text or provider events into `GenerateEvent`.
4. Convert errors into clean UI states.
5. Keep citation handling app-owned, not provider-owned.

For local model servers and gateways, prefer HTTP streaming if stable. For CLIs, prefer structured stream output only when official docs verify it.

## Error Codes

Start with these normalized codes:

- `provider_missing`
- `provider_not_enabled`
- `auth_missing`
- `auth_blocked_by_policy`
- `permission_required`
- `timeout`
- `invalid_output`
- `execution_failed`
- `local_only_required`
- `production_rejected`

Adapters can keep raw provider details server-side for debugging only when logs are local and sanitized before display.
