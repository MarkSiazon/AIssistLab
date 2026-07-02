# Architecture Map

This project is a local-first Next.js workbench for managing Claude Code skills, checking readiness, building a local RAG index, chatting against that index, and exporting sanitized diagnostics.

## Source Layout

- `src/app/`: Next.js app routes, pages, and API route handlers. Route files stay thin and call domain helpers from `src/lib`.
- `src/components/`: React components that render application screens and shared UI pieces.
- `src/hooks/`: React hooks for browser/runtime interaction that are shared across components.
- `src/lib/`: domain logic, request helpers, route constants, release checks, UI presentation models, and test utilities.
- `src/types/`: shared TypeScript types that are broader than one domain module.
- `scripts/`: repository automation split by domain for audit, cleanup, QA, release, smoke, and test entrypoints.
- `examples/demo-workspace/`: tracked privacy-safe Claude workspace used by setup docs, smoke tests, and release verification.
- `docs/`: source of truth for architecture, release notes, runbooks, roadmap, and specs.

## Domain Boundaries

- `src/lib/chat/`: chat API client behavior and readiness/status helpers.
- `src/lib/claude/`: Claude CLI discovery, profile, project inventory, and action helpers.
- `src/lib/rag/`: local index state, chunking, and Claude/runtime integration.
- `src/lib/release/`: release readiness, demo workspace checks, and release evidence models.
- `src/lib/routes/`: first-party app and API route constants plus manifest ownership tests.
- `src/lib/settings/`: Settings page data, environment parsing, Setup Doctor, path checks, and runtime config.
- `src/lib/skills/`: skill file lifecycle, validation, import, templates, quality checks, trash, and guided builder data.
- `src/lib/ui/`: presentation-model helpers for UI copy, labels, actions, and display-only state.

`src/lib/ui/` is intentionally flat for V1 because most files are small and already domain-prefixed, such as `settings-*`, `skills-*`, `chat-*`, `guided-*`, and `export-*`. Add new UI model helpers with a domain prefix or a clearly shared name. Split a domain into a subfolder only when the flat naming stops being easy to scan.

## Documentation Ownership

- `README.md`: overview, quick start, and pointers only.
- `docs/architecture.md`: codebase structure and module ownership.
- `docs/v1-release/release-candidate-runbook.md`: source of truth for command gates, cleanup, privacy scans, and manual external QA.
- `docs/v1-release/latest-local-qa-evidence.md`: short current local verification status only.
- `docs/v1-release/qa-history.md`: detailed historical QA notes and older local evidence.
- `docs/v1-release/release-notes.md`: public-facing V1 release changes.
- `docs/v1-spec/`: iteration specs and acceptance notes.
- `docs/v1-roadmap/` and `docs/v2-roadmap/`: product direction and deferred work.

## Automation Ownership

- `package.json` owns public npm command names.
- `scripts/audit/` owns docs, asset, dead-code, and export audits.
- `scripts/cleanup/` owns local artifact and repo-owned process cleanup.
- `scripts/qa/` owns manual external QA helpers.
- `scripts/release/` owns release verification, preparation, and evidence output.
- `scripts/smoke/runners/` owns runnable smoke scenarios.
- `scripts/smoke/assertions/`, `scripts/smoke/helpers/`, and `scripts/smoke/mocks/` own reusable smoke support code.
- `scripts/smoke/static/` owns static smoke-runner regression checks.
- `scripts/test/` owns the repository test runner.

Npm command names are the stable public interface. Direct script file paths are internal and can move when `package.json`, docs, and static tests are updated together.
