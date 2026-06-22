# V1 Feature Backlog

## Release Polish

1. First-run checklist v2 - implemented
   - Show setup progress across workspace, skills path, index, provider, CLI smoke test, and first chat.
   - Keep actions explicit: choose path, rebuild index, open login, test CLI, send chat.

2. Setup Doctor v2 - implemented
   - Add a V1 readiness score derived from existing deterministic checks.
   - Separate "blocks chat" from "quality warning" from "optional improvement".
   - Keep sanitized diagnostics as an intentional export action rather than an in-page copy button.

3. Chat readiness polish - implemented
   - Disable send when provider is unavailable unless the UI can render a specific actionable error.
   - Show provider mode, runtime source, index state, and last smoke test in a compact pre-send status row.
   - Add better empty-state questions based on current indexed skills.

4. Browser smoke runbook - implemented through V1 spec evidence and release checklist
   - Document a repeatable local smoke path for Settings, Chat, Skills, Editor, and Export.
   - Add screenshots only after implementation, not in the roadmap.

## Skill Lifecycle

1. Skill Template Gallery - implemented
   - Templates: reference skill, workflow skill, command-style skill, subagent-backed skill, learning/rubric skill.
   - Each template includes purpose, fields, starter body, and validation expectations.

2. Skill import preview - implemented
   - Support local folder, archive file, and GitHub URL import candidates.
   - Preview files, detected metadata, duplicate names, supporting-file references, and validation warnings before writing.
   - No install action writes until the user confirms the destination.

3. Skill Quality Doctor v2 - implemented
   - Add checks for official-style frontmatter fields, description clarity, trigger examples, oversized context, missing supporting files, suspicious dynamic commands, and weak instructions.
   - Add quality categories: discoverability, safety, maintainability, portability, and context cost.

4. Safe delete and restore - implemented
   - Require exact skill name confirmation.
   - Move deleted skill to a local trash/backup location before permanent removal.
   - Set index state to stale and show restore guidance.

## Claude Code Cockpit

1. Ecosystem inventory - implemented
   - Read project-level `.claude/skills`, `.claude/commands`, `.claude/agents`, `.mcp.json`, `.claude/settings.json`, `.claude/settings.local.json`, and plugin-style folders.
   - Report counts, status, and generic warnings.
   - Do not read user-level credential stores or hidden profile state.

2. Config surface explanations - implemented for V1 cockpit scope
   - Show what each surface is for: skills, commands, agents, MCP, settings, hooks, plugins, memory.
   - Explain what is project-shared versus local-only.

3. Setup Doctor integration - implemented
   - Add group `Claude Project`.
   - Warn about missing `SKILL.md`, malformed YAML, duplicate names, and local-only settings that appear shareable.
   - Suggest fixes as text only.

4. Reload guidance - implemented
   - Suggest `/reload-skills`, `/reload-plugins`, or session restart based on what changed.
   - Do not run Claude Code commands automatically.

## Guided Learning

1. Guided Skill Builder - implemented
   - Ask purpose, user trigger, task type, required inputs, success criteria, and safety boundaries.
   - Generate a draft only after the user supplies enough detail.
   - Let the user edit before save.

2. Rubric feedback - implemented
   - Score drafts against discoverability, specificity, examples, safety, and maintainability.
   - Use deterministic checks first.
   - Optional LLM feedback can be added later only after privacy review.

3. Learning templates - implemented
   - Include templates that teach core skill concepts inline.
   - Use coaching language inspired by Claude Education's guiding approach.

4. Example prompts - implemented
   - Generate suggested test prompts from skill description and examples.
   - Add "try this in Claude Code" guidance without launching Claude automatically.

## Diagnostics And Export

1. V1 readiness report - implemented
   - Include workspace/index/provider/skills/ecosystem summaries.
   - Redact sensitive values and full local paths.

2. Export bundle manifest - implemented
   - Include optional skill quality report, ecosystem inventory, index metadata, and sanitized settings summary.
   - Add manifest version and generated-at timestamp.

3. Privacy audit command - implemented as documented release-gate commands
   - Use the release checklist scans to check API responses and docs for secrets, full home paths, and raw auth/config paths.
