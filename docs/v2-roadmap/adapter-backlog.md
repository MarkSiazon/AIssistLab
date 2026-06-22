# Adapter Backlog

Adapters should be added progressively. The first provider in each tier should prove one reusable pattern before adding more providers of that kind.

## Tier 1: First Multi-Provider CLI Adapters

### Claude Code

- Command: `claude`
- Smoke test: `claude -p "Reply exactly: OK"` with safe flags already proven in v1.
- Auth: local Claude subscription profile or API key.
- Current status: reference implementation.
- Main risk: API-key env precedence can bypass subscription auth.
- Implementation note: keep the existing Claude privacy model and profile hashing.

### Gemini CLI

- Command: `gemini`
- Smoke test candidate: `gemini -p "Reply exactly: OK" --output-format json`
- Auth: validate current Google/Gemini CLI auth mode before implementation.
- Current status: installed on this development machine.
- Main risk: tool permissions and sandbox behavior may differ by install mode.
- Source: [Gemini headless mode](https://google-gemini.github.io/gemini-cli/docs/cli/headless.html)

### Codex CLI

- Command: `codex`
- Smoke test candidate: `codex exec "Reply exactly: OK"`
- Auth: validate current Codex CLI login/API behavior before implementation.
- Current status: installed on this development machine.
- Main risk: agentic execution and sandbox behavior need strict no-write smoke settings.
- Source: [Codex exec reference](https://developers.openai.com/codex/cli/reference#codex-exec)

### Kiro CLI

- Command candidates: `kiro-cli`, `kiro`
- Smoke test candidate: `kiro-cli chat --no-interactive "Reply exactly: OK"`
- Auth: `KIRO_API_KEY` for documented headless mode.
- Current status: `kiro` found locally, `kiro-cli` not found locally.
- Main risk: documented command name differs from local PATH command; adapter must validate command shape.
- Source: [Kiro headless mode](https://kiro.dev/docs/cli/headless/)

### GitHub Copilot CLI

- Command candidates: `copilot`, `gh copilot`
- Smoke test: research current programmatic command shape before implementation.
- Auth: `COPILOT_GITHUB_TOKEN`, `GH_TOKEN`, `GITHUB_TOKEN`, keychain, or GitHub CLI token fallback.
- Current status: `copilot` and `gh` found locally.
- Main risk: Copilot CLI may be more task/agent oriented than a simple text generator.
- Source: [Copilot CLI reference](https://docs.github.com/en/copilot/reference/copilot-cli-reference/cli-command-reference), [auth docs](https://docs.github.com/en/copilot/how-tos/copilot-cli/set-up-copilot-cli/authenticate-copilot-cli)

### Qwen Code

- Command: `qwen`
- Smoke test candidate: `qwen -p "Reply exactly: OK" --output-format json`
- Auth: validate local Qwen/provider auth mode before implementation.
- Current status: installed on this development machine.
- Main risk: auto-approval flags must not be used in smoke tests.
- Source: [Qwen headless mode](https://qwenlm.github.io/qwen-code-docs/en/users/features/headless/)

## Tier 2: Optional Local And Open-Source Adapters

### OpenCode

- Command: `opencode`
- Smoke test candidate: `opencode run --format json "Reply exactly: OK"`
- Auth: provider configuration inside OpenCode.
- Current status: not found on PATH locally.
- Main risk: output is raw event JSON only with `--format json`; adapter needs parser.
- Source: [OpenCode CLI docs](https://open-code.ai/en/docs/cli)

### Aider

- Command: `aider`
- Smoke test candidate: `aider --message "Reply exactly: OK" --no-auto-commits --dry-run`
- Auth: provider keys or Aider config.
- Current status: not found on PATH locally.
- Main risk: Aider is optimized for file editing, so no-write smoke tests need careful flags.
- Source: [Aider scripting docs](https://aider.chat/docs/scripting.html)

### Ollama

- Command/API: `ollama`, local HTTP API.
- Smoke test candidate: HTTP generate call to configured local model.
- Auth: local model availability, optional sign-in for some flows.
- Current status: not found on PATH locally.
- Main risk: no model may be installed or loaded.
- Source: [Ollama CLI docs](https://docs.ollama.com/cli), [Ollama API docs](https://docs.ollama.com/api/introduction)

### LM Studio

- Command/API: `lms`, local HTTP API.
- Smoke test candidate: local API call after server status check.
- Auth: local model/server readiness; optional login for hub/publish flows.
- Current status: `lms` not found on PATH locally.
- Main risk: the GUI may need to run once before CLI works; local server may not be started.
- Source: [LM Studio CLI docs](https://lmstudio.ai/docs/cli), [developer docs](https://lmstudio.ai/docs/developer)

## Tier 3: Research And Gateway Adapters

### Cursor Agent

- Command: `cursor-agent`
- Smoke test: validate with local help/runtime before implementation.
- Auth: Cursor account/subscription.
- Current status: installed on this development machine.
- Main risk: official docs are less extractable through current tooling, and exact headless output/control behavior needs local validation.
- Source: [Cursor CLI overview](https://cursor.com/docs/cli/overview), [Cursor CLI product page](https://cursor.com/cli)

### Continue CLI

- Command: `cn`
- Smoke test candidate: `cn -p "Reply exactly: OK"`
- Auth: Continue account/API key or local provider config.
- Current status: not found on PATH locally.
- Main risk: project has changed direction over time; adapter should validate current package and docs before implementation.
- Source: [Continue CLI guide](https://docs.continue.dev/guides/cli), [Continue CLI quickstart](https://docs.continue.dev/cli/quickstart)

### Goose

- Command: research before implementation.
- Adapter kind: likely `agent_cli`.
- Status: catalog candidate, not yet validated for this roadmap.
- Main risk: command, auth, and output contracts need official source validation.

### Cline

- Command: research before implementation.
- Adapter kind: likely IDE/extension-first unless a maintained CLI is verified.
- Status: catalog candidate, not yet validated for this roadmap.
- Main risk: extension-first tools may not have stable headless CLI behavior.

### OpenRouter Gateway

- Adapter kind: `api_gateway`.
- Command/API: OpenAI-compatible HTTP endpoint.
- Auth: API key.
- Smoke test: low-cost configured model call after explicit user action.
- Main risk: hosted spend and data policy need clear UI labels.
- Source: [OpenRouter quickstart](https://openrouter.ai/docs/quickstart)

### LiteLLM Gateway

- Adapter kind: `api_gateway`.
- Command/API: self-hosted proxy or SDK.
- Auth: proxy keys and upstream provider keys.
- Smoke test: gateway health plus configured model call.
- Main risk: virtual key and upstream key presence must not be exposed.
- Source: [LiteLLM GitHub](https://github.com/BerriAI/litellm)

## Backlog Acceptance Criteria

Each adapter is ready for implementation only when:

- Official docs or current `--help` output confirm the command shape.
- A no-write or read-only smoke test is defined.
- Auth readiness can be checked without exposing identity.
- Sanitizer tests cover stdout, stderr, thrown errors, env values, and config/profile displays.
- Local-only guards exist for discovery, status, login, and test endpoints.
