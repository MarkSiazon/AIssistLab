# Research CLI Support Matrix

This matrix records verified public source claims and current local probe results. It is a planning input, not a promise that every adapter is ready.

Local probe on this development machine found these commands on PATH: `claude`, `gemini`, `kiro`, `codex`, `copilot`, `qwen`, and `cursor-agent`.

Local probe did not find these commands on PATH: `kiro-cli`, `opencode`, `aider`, `ollama`, `lms`, and `cn`.

No raw executable paths, account names, profile names, or local config paths should be stored in roadmap docs.

## Support Matrix

| Runtime | Adapter kind | Primary command candidates | Detection method | Headless or automation mode | Auth model | Output format | Risk level | Source |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Claude Code | `agent_cli` | `claude` | Explicit path, native install path, PATH | `claude -p` / `claude --print` | Subscription auth or API key; API-key env takes precedence | `text`, `json`, `stream-json` | Medium | [Programmatic usage](https://code.claude.com/docs/en/headless), [API key precedence](https://support.claude.com/en/articles/12304248-manage-api-key-environment-variables-in-claude-code) |
| Gemini CLI | `agent_cli` | `gemini` | Explicit path, package-manager install, PATH | `gemini --prompt` or `gemini -p` | Google account or API configuration, validate per install | `text`, `json` | Medium | [Headless mode](https://google-gemini.github.io/gemini-cli/docs/cli/headless.html), [install/run](https://geminicli.com/docs/get-started/installation/) |
| Codex CLI | `agent_cli` | `codex` | Explicit path, PATH | `codex exec` | OpenAI account/API configuration, validate current CLI behavior | CLI reference required before implementation | Medium | [Codex exec reference](https://developers.openai.com/codex/cli/reference#codex-exec) |
| Kiro CLI | `agent_cli` | `kiro-cli`, `kiro` | Explicit path, PATH, command-name alias validation | Docs show `kiro-cli chat --no-interactive`; local probe found `kiro` | `KIRO_API_KEY` for headless mode | Text/stdout, validate for structured output | High | [Headless mode](https://kiro.dev/docs/cli/headless/), [CLI commands](https://kiro.dev/docs/cli/reference/cli-commands/) |
| GitHub Copilot CLI | `agent_cli` | `copilot`, possible `gh copilot` integration | Explicit path, PATH, GitHub CLI fallback check | Programmatic/agent usage exists, exact invocation needs adapter validation | `COPILOT_GITHUB_TOKEN`, `GH_TOKEN`, `GITHUB_TOKEN`, keychain, then `gh auth token` fallback | Validate current programmatic output | High | [Command reference](https://docs.github.com/en/copilot/reference/copilot-cli-reference/cli-command-reference), [auth docs](https://docs.github.com/en/copilot/how-tos/copilot-cli/set-up-copilot-cli/authenticate-copilot-cli) |
| Qwen Code | `agent_cli` | `qwen` | Explicit path, npm/global install, PATH | `qwen -p` / `qwen --prompt` | Qwen/provider-specific CLI auth, validate locally | `text`, `json`, `stream-json` | Medium | [Headless mode](https://qwenlm.github.io/qwen-code-docs/en/users/features/headless/), [GitHub repo](https://github.com/QwenLM/qwen-code) |
| OpenCode | `agent_cli` | `opencode` | Explicit path, PATH | `opencode run [message..]` | Provider configured in OpenCode | Default formatted output or `json` raw events | Medium | [CLI docs](https://open-code.ai/en/docs/cli) |
| Aider | `agent_cli` | `aider` | Explicit path, Python entrypoint, PATH | `aider --message` / `--message-file` | API keys or provider config in Aider | Streaming stdout; no single universal JSON claim here | High | [Scripting docs](https://aider.chat/docs/scripting.html) |
| Ollama | `local_model_server` | `ollama` and local HTTP API | Explicit path, PATH, local server health | `ollama run`, or HTTP API at localhost when server runs | Local models; optional cloud sign-in for some flows | CLI text, HTTP JSON and streaming | Low for local API, Medium for CLI | [CLI docs](https://docs.ollama.com/cli), [API docs](https://docs.ollama.com/api/introduction), [Windows docs](https://docs.ollama.com/windows) |
| LM Studio | `local_model_server` | `lms` and local HTTP API | Explicit path, bundled CLI, PATH, local server health | `lms server start`, SDK or local API | Local models; optional LM Studio login for hub/publish flows | HTTP/SDK responses, OpenAI-compatible and Anthropic-compatible endpoints | Low for local API, Medium for CLI | [CLI docs](https://lmstudio.ai/docs/cli), [developer docs](https://lmstudio.ai/docs/developer) |
| Continue CLI | `agent_cli` | `cn` | Explicit path, npm/global install, PATH | `cn -p` | Continue account/API key or local provider config | Final response to stdout in headless mode | Medium | [CLI guide](https://docs.continue.dev/guides/cli), [quickstart](https://docs.continue.dev/cli/quickstart) |
| Cursor Agent | `agent_cli` | `cursor-agent` | Explicit path, official install path validation, PATH | Needs runtime/help validation before implementation | Cursor account/subscription | Needs runtime/help validation | High | [Cursor CLI overview](https://cursor.com/docs/cli/overview), [Cursor CLI product page](https://cursor.com/cli) |
| OpenRouter | `api_gateway` | HTTP API / SDK | Env presence and HTTP health | OpenAI-compatible HTTP call | API key | JSON/streaming via HTTP | Medium | [Quickstart](https://openrouter.ai/docs/quickstart) |
| LiteLLM | `api_gateway` | `litellm` proxy or SDK | Explicit proxy URL, health check, PATH optional | OpenAI-compatible proxy | Provider keys or virtual keys | JSON/streaming via HTTP | Medium | [GitHub repo](https://github.com/BerriAI/litellm) |

## Implementation Notes

- Prefer HTTP adapters for Ollama, LM Studio, LiteLLM, and OpenRouter where stable local or gateway APIs exist.
- Prefer CLI adapters for Claude, Gemini, Codex, Kiro, Copilot, Qwen, OpenCode, Aider, Continue, and Cursor Agent.
- Validate each CLI with `--help` or an official status command before using a hard-coded invocation.
- Never treat PATH presence as auth readiness.
- Never run agentic CLIs with broad write/tool permissions during smoke tests.
- For Kiro, support both documented `kiro-cli` and observed `kiro` command names, but require a runtime command-shape check.
- For Cursor Agent, official docs exist but the exact machine-readable headless behavior still needs local validation before adapter work.
