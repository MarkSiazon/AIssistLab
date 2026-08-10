# AGENTS for rag-interface

## Scope
- This is the local repository instruction file for this repo.
- Defer to any closer AGENTS.md if one is added inside subfolders.
- Follow root C:\Codes Local\AGENTS.md first, then this file.

## Local Operating Notes
- Identify target paths from the repo root before running repo-wide changes.
- Prefer existing local docs (README.md, docs/, specs/, and stack manifests).
- Confirm required tooling and local environment before running heavy commands.

## Change Control
- Keep changes scoped to the task.
- Do not assume generated artifacts (`.tmp`, `.codex`, `node_modules`, `build`, `.worktrees`) are required repository inputs.
- Avoid committing credentials or secrets; scrub temporary artifacts before sharing snapshots.

## Verification
- Run at least one repository-native command after meaningful changes (git status, or the stack command in README).
- Update notes if behavior or architecture changed.

## Date
- Created: 2026-05-29

<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
