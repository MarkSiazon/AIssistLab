# V1 Release Notes

Skill Workshop RAG V1 is a Claude-first local workbench for managing Claude Code skills, checking setup readiness, and asking RAG-backed questions over a configured skills workspace.

## 2026-06-28 V1 Hardening Checkpoint

- PR #5 merged the latest V1 release-hardening fixes through commit `1804c95`.
- The automated release gate passed with `npm run verify:release`, including 163 test files, lint, production build, production smoke, dependency audit, local browser/API smoke, safe button smoke, manual QA helper auto smoke, cleanup dry-runs, asset/docs/dead-code/unused-export audits, diff whitespace, untracked release-text hygiene, and privacy scan.
- `release:evidence` now prints a sanitized V1 release evidence summary, and `release:prepare` runs a finite final package pass without looping the release gate.
- V1 Release Readiness summaries now expose the top action label and href in addition to the blocker message, so Settings, Chat, and release evidence share one recovery target.
- First Run Checklist highlights the concrete next action label in the next-step strip.
- Editor preview tabs now hide inactive panels so the edit textarea is not visible while Preview is selected.
- Settings API responses now redact secret-like env values and preserve existing private values when redacted placeholders are posted back unchanged.
- Chat stream error events now pass through the shared display sanitizer before reaching the browser.
- GitHub issue #3 remains open for manual external QA: native folder picker visibility, visible Open Login, provider auth testing, first real account-backed chat, and manual sanitization review.
- The release remains V1-only. V2 provider registry and additional provider adapters are still out of scope for this ship pass.

## 2026-06-26 Historical Post-Push Checkpoint

The details in this section describe the local release snapshot from that checkpoint. Use the 2026-06-28 hardening checkpoint and the latest local QA evidence for current automated status.

- Checkpoint commit `f3c4ffb` added route-manifest guard coverage for app pages, API handlers, API route constants, and the V1 API inventory documentation.
- GitHub Pages build/deploy completed successfully for `f3c4ffb`; the live Pages URL returns HTTP 200 at `https://marksiazon.github.io/AIssistLab/`.
- GitHub Pages currently publishes the repository documentation through Jekyll, not the Next.js application runtime. A real hosted app deployment still needs a Next-compatible target for server routes.
- Local deployment readiness passed after the checkpoint: `npm run verify:release` completed successfully, including tests, lint, production build, local and production smoke checks, button smoke, audits, cleanup dry-runs, and privacy scan.
- Dependency maintenance refreshed in-range lockfile versions for `@types/node` 20.19.43, `@types/react` 18.3.31, `knip` 6.21.0, `playwright` 1.61.1, and `swr` 2.4.2.
- `npm audit --audit-level=high` reports zero vulnerabilities after the dependency refresh.
- Bundle inspection found about 1.35 MB under `.next/static` and 3.45 MB under `.next/server`; the larger `.next` files are webpack caches, not deployable app bundles.
- Major dependency lines remain intentionally deferred for a separate migration pass, including Anthropic SDK 0.106, Archiver 8, React 19, Tailwind 4, TypeScript 6, and ESLint 10.
- Manual external QA remains device/account-owned: native folder picker visibility, visible Claude Open Login, and real account-backed chat/auth can be skipped for automated-only status, but should be run before claiming a fully manually verified release.

## What V1 Supports

- Local Settings for workspace paths, skills directory paths, provider selection, Claude CLI profile selection, and runtime-applied provider changes.
- Deterministic Setup Doctor, First Run Checklist, and V1 Release Readiness panel for workspace, provider, index, skill quality, Claude project, chat, and diagnostics state.
- Settings Manual QA Evidence panel for local-only status/timestamp tracking of native folder picker, visible Claude login launch, and real account-backed chat checks.
- Settings Data Boundary panel that explains configured-workspace reads, explicit chat-send provider context, scrubbed diagnostics export, and manual account/device checks in one in-product summary.
- Chat readiness now names the send boundary before the first message: provider calls happen only after Send, with the prompt plus retrieved skill excerpts and citation metadata.
- Export diagnostics now shows both included diagnostics files and excluded data classes before download, including keys/tokens, account identifiers, OAuth/profile paths, home paths, hook commands, and raw provider output.
- A tracked demo workspace for portable first-run smoke checks without private local paths or provider credentials.
- Anthropic API mode as the default local API-key provider, plus optional localhost-only Claude Code CLI mode with profile discovery, visible login launch, explicit smoke tests, and sanitized status output.
- Persistent RAG index metadata with ready, stale, missing, rebuilding, and failed states; skill writes mark the index stale, and stale counts are labeled as the last index in Sidebar and Settings.
- Skill browsing, creation, editing with explicit save-state labels, deletion with exact-name confirmation labels, restore availability/in-progress labels, backup restore, templates, guided skill drafting with current-tab autosave and explicit Review, Build preview, Open in Editor handoff, import preview/apply with source-aware preview labels, a plain-language preview summary, row-level issue summaries, clear duplicate-action labels, no-op skip blocking, validation, Library Readiness summary that routes empty libraries to Guided Builder, and deterministic Skill Quality Doctor checks.
- Chat readiness checks, prioritized blocked-state guidance, first-use actions for empty skill workspaces, index rebuild action, composer button labels that explain blocked or warning states, IME-safe Enter-to-send handling, streamed answers, retry for failed assistant messages, and bounded citations with skill/source context.
- App-shell and editor accessibility polish, including skip-link support, route-change announcements, main-content focus after navigation, keyboardable editor tabs, and a quieter RAG index status announcement that does not read interactive controls as status text.
- Release readiness UI polish that keeps one primary top action, avoids duplicate row buttons, hides Settings self-links, labels Settings-local actions as concrete tasks such as saving paths or provider settings, and scrolls focus to the relevant Settings fields before applying local actions.
- Read-only Claude project inventory for project skills, commands, agents, MCP presence, settings files, hooks, and plugin folders.
- Skill export and zip export with optional sanitized diagnostics, including readiness, index, skill quality, Claude project, and settings summaries. The empty export state prioritizes creating or importing skills while keeping diagnostics available from the header and readiness panel, and the selection toolbar now disables inert Select all, Clear, and selected-download states instead of leaving dead actions visible.
- Local-only guards and privacy controls for device-local APIs, with public responses avoiding API keys, account identifiers, raw profile paths, OAuth paths, MCP command details, hook commands, and raw config contents.

## Intentionally Out Of Scope

- V2 provider-agnostic runtime registry and adapters for Gemini, Codex, Kiro, Copilot, Qwen, OpenCode, Aider, Ollama, LM Studio, and other providers.
- Hosted or production use of local Claude CLI subscription auth; CLI mode is intended for local development only.
- Automatic login, hidden generation tests, automatic index rebuilds, automatic diagnostics export, or automatic filesystem fixes.
- Installing or modifying Claude Code commands, hooks, agents, MCP servers, plugins, or user-level Claude configuration.
- Broad device scans, deep filesystem crawling, or account/profile discovery outside the configured workspace and known Claude profile locations.
- LLM-generated setup diagnosis; V1 readiness and quality checks are deterministic.
- Persisting diagnostics-export completion across reloads.
- Exposing raw secrets, full home paths, provider tokens, OAuth/config file contents, raw provider output, or private account state.

## Release Path

1. Open Settings and resolve workspace, skills path, and provider readiness issues.
2. Rebuild the RAG index.
3. Test Claude CLI or API auth through the existing provider readiness controls.
4. Confirm the V1 Release Readiness panel and Chat status are usable.
5. Run manual external QA where device/account interaction is required and mark the results in Settings Manual QA Evidence.
6. Export diagnostics when sharing release evidence or troubleshooting context.

For a repeatable release-candidate pass, use [release-candidate-runbook.md](release-candidate-runbook.md).
