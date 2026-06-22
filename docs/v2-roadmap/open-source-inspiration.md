# Open Source Inspiration

This file captures patterns to copy and patterns to avoid from adjacent provider registries, gateways, routers, and CLI-agent catalogs.

## LiteLLM

Source: [BerriAI/litellm](https://github.com/BerriAI/litellm)

Useful patterns:

- One gateway can normalize many provider APIs.
- OpenAI-compatible request shapes lower integration cost.
- Centralized routing, spend tracking, and fallback can live outside the app.
- A proxy layer is useful for team-wide policy and observability.

Avoid:

- Making the local app depend on a gateway just to support a basic direct provider.
- Returning proxy config or virtual key details through Settings APIs.
- Treating gateway support as the same thing as local subscription CLI support.

## Vercel AI SDK Provider Registry Example

Source: [ai-sdk-preview-provider-registry](https://github.com/vercel-labs/ai-sdk-preview-provider-registry)

Useful patterns:

- Provider registry is a clean mental model for switching between model providers.
- Provider ids should be stable and explicit.
- Model selection should be separate from provider selection.

Avoid:

- Copying a purely API-key based registry without adapting it for local CLIs.
- Exposing raw env values in UI.
- Treating every provider as a compatible chat-completion API.

## OpenRouter

Source: [OpenRouter quickstart](https://openrouter.ai/docs/quickstart)

Useful patterns:

- A single API endpoint can expose many models.
- Model fallbacks and provider selection are product-level concepts users understand.
- OpenAI-compatible SDK usage can reduce implementation work.

Avoid:

- Running smoke tests that spend hosted credits on page load.
- Hiding hosted routing behind a label that sounds local-only.
- Logging request prompts or headers in local diagnostics.

## Claude Code Router

Source: [musistudio/claude-code-router](https://github.com/musistudio/claude-code-router)

Useful patterns:

- Routing rules can choose default, background, reasoning, long-context, and specialized models.
- Config supports provider blocks and routing rules separately.
- Non-interactive mode deserves its own config because automated runs can hang.

Avoid:

- Writing router config into user home directories from this app.
- Activating shell-wide env variables automatically.
- Copying raw router logs or paths into Setup Doctor output.

## CLIProxyAPI

Source: [router-for-me/CLIProxyAPI](https://github.com/router-for-me/CLIProxyAPI)

Useful patterns:

- Wrapping local CLIs behind a compatible API is a known ecosystem direction.
- Multi-account and fallback concerns show up quickly once many CLIs are supported.
- Dashboard-style readiness is useful for local users.

Avoid:

- Building an unrestricted CLI-to-API bridge.
- Treating subscription CLIs as generic API replacements without respecting provider terms and user intent.
- Surfacing local account identifiers for convenience.

## Plano CLI-Agent Issue

Source: [Plano issue 775](https://github.com/katanemo/plano/issues/775)

Useful patterns:

- Other projects have also identified the need for reusable CLI launcher architecture.
- Clean env and argument mapping should be adapter-owned.
- Consistent error handling and demo validation are part of adapter readiness.

Avoid:

- Adding one-off branches in core chat flow for every provider.
- Skipping docs and demo smoke tests per adapter.

## OpenCode

Source: [OpenCode CLI docs](https://open-code.ai/en/docs/cli)

Useful patterns:

- `run` command provides a clear non-interactive entrypoint.
- `serve` plus attach mode suggests a performance pattern for avoiding repeated cold starts.
- JSON raw event output can support richer streaming in the app.

Avoid:

- Depending on long-lived attach mode before basic one-shot generation is stable.
- Assuming formatted terminal output is easy to parse.

## Aider

Source: [Aider scripting docs](https://aider.chat/docs/scripting.html)

Useful patterns:

- `--message` and `--message-file` are straightforward scripting surfaces.
- Dry-run and auto-commit controls matter for safe automation.
- Python API exists but is documented as unstable, so CLI should be preferred first.

Avoid:

- Running Aider smoke tests in a way that edits files or commits changes.
- Treating Aider as a plain chat model instead of a file-editing agent.

## Awesome CLI Coding Agents

Source: [Awesome CLI Coding Agents](https://github.com/bradAGI/awesome-cli-coding-agents)

Useful patterns:

- The CLI-agent ecosystem is broad enough that a registry is more sustainable than hard-coded providers.
- Catalogs can help prioritize future adapters.
- Agent infrastructure and orchestration tools should be tracked separately from individual CLIs.

Avoid:

- Copying catalog claims as implementation truth.
- Prioritizing popularity over adapter safety and stable headless behavior.
- Trying to support every listed tool before the registry contract is proven.
