# V1 Roadmap: Claude-First Local Skill Workbench

## Purpose

V1 is the Claude-focused release of Skill Workshop RAG. It should remain a local desktop tool for managing Claude Code skills, diagnosing setup readiness, asking RAG-backed questions, and safely using either the Anthropic API provider or local Claude CLI subscription mode.

V1 should not implement the provider-agnostic V2 registry. The right V1 move is to polish the current app, deepen Claude Code ecosystem awareness, and add guided learning flows for creating better skills.

## Navigation

- [Current Feature Inventory](./current-feature-inventory.md)
- [Claude Ecosystem Research](./claude-ecosystem-research.md)
- [Similar Projects And Inspiration](./similar-projects-and-inspiration.md)
- [V1 Feature Backlog](./v1-feature-backlog.md)
- [Privacy Security Release Checklist](./privacy-security-release-checklist.md)

## Current Product Shape

The app is already more than a basic RAG chat:

- Settings can configure workspace paths, API mode, local Claude CLI mode, profile selection, and runtime-applied provider settings.
- Setup Doctor gives deterministic readiness checks for workspace, RAG index, provider mode, Claude CLI, and login helper state.
- The RAG index persists sanitized metadata in `.next/cache` and reports ready, stale, missing, rebuilding, or failed.
- Skill create/edit/delete flows validate local skill files and mark the index stale after writes.
- Chat shows provider/index readiness, streams answers, retries failed assistant responses, and links citations back to skills.
- Export can include sanitized diagnostics.

V1 roadmap work should make those capabilities easier to trust and easier to use before broadening beyond Claude.

## Phase Order

### Phase 1: Release Polish

Make the current product shippable for local users.

Acceptance criteria:

- First-run path, provider setup, and index state are easy to understand from Settings.
- Chat blocks or warns clearly when provider or index readiness is not good enough.
- Setup Doctor and diagnostics avoid secrets, full home paths, raw provider output, and account identifiers.
- Browser smoke checks cover Settings, Chat, Skills, and Export.

### Phase 2: Skill Lifecycle

Turn the app from a skill editor into a skill lifecycle manager.

Acceptance criteria:

- Users can create skills from templates.
- Users can import skills from local folder, archive, or GitHub URL only after preview and validation.
- Skill Quality Doctor checks official-style frontmatter, description usefulness, supporting-file references, token weight, dynamic command usage, and unsafe patterns.
- Skill changes produce clear index freshness state and safe rollback guidance.

### Phase 3: Claude Code Cockpit

Add read-only awareness of the wider Claude Code project surface.

Acceptance criteria:

- The app can inventory project-level `.claude/skills`, `.claude/commands`, `.claude/agents`, `.mcp.json`, settings files, hooks, and plugin-style folders.
- The UI explains what exists, what is missing, and what needs restart or reload, without writing config automatically.
- Setup Doctor can include Claude ecosystem checks without leaking local account or config details.

### Phase 4: Guided Learning

Use Claude for Education style ideas to coach users through skill creation.

Acceptance criteria:

- Guided Skill Builder asks users to reason through purpose, triggers, inputs, boundaries, examples, and success criteria.
- The builder gives rubric feedback instead of simply generating a finished skill.
- Templates and previews help users learn what good skills look like.
- Generated or assisted content remains editable and validated before writing.

## V1 Release Definition

V1 is release-ready when:

- Local setup can be diagnosed without reading raw env files.
- A new user can select a workspace, rebuild the index, test provider auth, create or import a skill, ask a cited question, and export diagnostics.
- Claude-specific integrations stay local-only where they touch the device.
- Docs clearly distinguish current features from planned enhancements.
- V2 provider-agnostic work remains documented separately under `docs/v2-roadmap/`.

## Next Implementation Target

Start with `docs/v1-spec/iteration-01-release-polish.md`. It has the highest leverage because it validates the current app before adding larger Claude ecosystem surfaces.
