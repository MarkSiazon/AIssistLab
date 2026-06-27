# Current Feature Inventory

This inventory is based on the current repo shape, not product aspiration.

## App Shell

- Next.js app under `src/app`.
- Main areas: Chat, Skills, Skill Editor, Settings, Export.
- Sidebar exposes index rebuild and navigation.
- Styling is local CSS variables and Tailwind utility classes.

## Settings

Current Settings capabilities:

- Structured editor for core env values and Claude CLI fields.
- Raw env editor for local troubleshooting.
- Runtime-applied provider settings for current server session.
- Windows-native folder picker when available, with in-app browser fallback.
- Path existence checks for workspace and skills paths.
- Workspace profile shortcuts stored in browser local storage.
- Claude profile selector with generic labels and sanitized display paths.
- Claude login action that opens visible login flow rather than running hidden auth in chat requests.
- Claude CLI smoke test action that uses the currently selected UI profile.
- V1 Release Readiness panel that summarizes workspace, provider, index, skill quality, Claude project, chat, and diagnostics state.

Current Settings APIs:

- `GET /api/settings`
- `POST /api/settings`
- `GET /api/settings/runtime`
- `GET /api/settings/path-exists`
- `GET /api/settings/native-folder`
- `GET /api/settings/browse`
- `GET /api/settings/browse/search`
- `GET /api/settings/doctor`
- `GET /api/settings/claude-cli`
- `POST /api/settings/claude-cli`
- `GET /api/settings/claude-cli/profiles`
- `POST /api/settings/claude-cli/test`
- `GET /api/settings/claude-project`
- `GET /api/release/readiness`

## Claude Provider Modes

Current provider modes:

- `anthropic_api`: default local API-key mode.
- `claude_code_cli`: local-only Claude CLI mode.

Current CLI safeguards:

- Local CLI mode requires explicit enablement.
- CLI mode is rejected for non-local usage.
- Chat generation is rejected for hosted, production, and non-local requests across provider modes.
- The child process removes the Anthropic API key when local Claude CLI mode is active.
- Claude profile discovery keeps raw paths server-side.
- Public profile output uses generic labels like `Default profile`, `Profile 1`, and `Manual profile`.
- Login helper is optional; built-in Claude auth login is the fallback.

## Setup Doctor

Current checks include:

- Workspace root presence and directory validity.
- Skills directory validity.
- RAG index state.
- Provider mode readiness.
- Anthropic API key presence for API mode.
- Claude CLI installation and auth state for CLI mode.
- Claude login helper availability.
- Runtime-applied provider env sync.
- Restart-required drift for non-provider env values.

Current output is structured as:

- Summary status.
- Error, warning, and ok counts.
- Top recommendation.
- Grouped checks with messages, suggested fixes, and related env keys.

## RAG Index

Current behavior:

- TF-IDF data stays in memory.
- Sanitized index metadata persists under `.next/cache`.
- Index status can be `ready`, `stale`, `missing`, `rebuilding`, or `failed`.
- Skill count, chunk count, build time, stale reason, workspace display, and skills directory display are exposed through `/api/index`.
- Skill writes mark the index stale.

Current APIs:

- `GET /api/index`
- `POST /api/index`

## Skill Management

Current behavior:

- Skills are read from the configured skills directory.
- Skills can be created, edited, deleted, and exported.
- Skills page shows a Library Readiness panel that summarizes index state, skill quality issues, and next actions using existing index and validation APIs.
- Skill editor has frontmatter fields, markdown body, live preview, mobile preview tab, unsaved-change warning, and save disabling while invalid.
- Guided Skill Builder can draft learning-style skills from purpose, audience, trigger examples, required inputs, boundaries, success criteria, and a selected template.
- Guided drafts are scored by a deterministic rubric and handed to the normal editor for review and save.
- Import preview supports local folders, zip archives, and GitHub URLs; duplicate overwrites require typing `overwrite` before the UI enables Apply.
- Server-side validation checks path-safe names, missing descriptions, empty bodies, duplicate tags, and oversized files.
- Quality scanner checks existing skills for deterministic issues.

Current APIs:

- `GET /api/skills`
- `POST /api/skills`
- `GET /api/skills/:skillName`
- `PUT /api/skills/:skillName`
- `DELETE /api/skills/:skillName`
- `POST /api/skills/:skillName/restore`
- `GET /api/skills/templates`
- `GET /api/skills/validation`
- `POST /api/skills/guided/feedback`
- `POST /api/skills/guided/draft`
- `POST /api/skills/import/preview`
- `POST /api/skills/import/apply`

## Chat

Current behavior:

- Chat status shows provider mode, runtime source, index readiness, and last Claude CLI smoke test state.
- Chat warns when the index is not ready and can rebuild it.
- Chat blocked states link back to Settings and Diagnostics Export.
- Assistant responses stream as newline-delimited JSON chunks.
- Failed assistant responses can be retried without duplicating the user message.
- Citations show source skill, section, score, preview, and editor link.

Current APIs:

- `POST /api/chat`
- `GET /api/chat/status`

## Export

Current behavior:

- Single skill export.
- Zip export for selected or all skills.
- Optional diagnostics bundle with manifest, V1 readiness report, sanitized index metadata, skill quality report, Claude project inventory, and settings summary.
- Export page shows a diagnostics readiness preview before download.

Current APIs:

- `GET /api/export`
- `GET /api/export/zip`

## Existing Test Coverage

Current focused tests cover:

- Claude discovery and privacy behavior.
- Runtime config behavior.
- Setup Doctor rules.
- RAG index metadata and route behavior.
- Skill validation and quality checks.
- Local guards.
- Settings profile selection.
- Chat status.
- Export zip diagnostics.
