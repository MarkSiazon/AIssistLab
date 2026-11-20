# AGENTS for rag-interface

## Scope
- `rag-interface` (AIssistLab) — Next.js `16.4.6` (`--webpack`), React 18, TypeScript 5, Tailwind CSS 3, npm (`package-lock.json`).
- Active integration branch is `dev` (synced with `main`).
- Follow root `C:\Codes Local\AGENTS.md` first, then this file (defer to any closer `AGENTS.md` if added inside subfolders).

## Key Commands
- Dev / Build / Lint / Test: `npm run dev`, `npm run build`, `npm run lint`, `npm test`
- Audits & Release Verification: `npm run audit:dependencies`, `npm run audit:docs`, `npm run verify:release`

## Change Control & Verification
- Keep changes scoped to the task; prefer existing local docs (`README.md`, `docs/`, `specs/`, `package.json`).
- Do not assume generated artifacts (`.tmp`, `.codex`, `node_modules`, `build`, `.worktrees`) are required repository inputs.
- Avoid committing credentials or secrets; scrub temporary artifacts before sharing snapshots.
- Run repository-native verification (`npm run lint`, `npm test`, `npm run audit:docs`, `npm run build`, or `git status`) after meaningful changes.

## Current Status
- Last verified: 2026-11-20 — `npm audit` clean (`0` vulnerabilities; `"mongoose": "^9.12.1"` and transitive security overrides landed on `dev`).

<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
