# Claude Code CLI Workspace

Local Claude Code workspace for developing Claude skills, hooks, MCP config, and the Skill Workshop RAG V1 app.

## Layout

- `.claude/skills/auto-branch-analyzer-to-pr/SKILL.md`: slash-command skill that analyzes branch commits and diffs, then writes PR body output to `docs/pr-description.md`.
- `.claude/hooks/`: Claude Code hook scripts for safety checks, formatting, and session-start reminders.
- `.claude/settings.json`: Claude Code hook wiring and project MCP enablement.
- `.mcp.json`: project MCP server definitions.
- `docs/`: planning and generated artifacts that are not active tool instruction files.
- `rag-interface/`: separate nested Next.js app repo for Skill Workshop RAG V1.

## Active Skill

Use `/auto-branch-analyzer-to-pr [base]` inside Claude Code.

- Defaults to `dev` when no base branch is provided.
- Reads `git log`, `git diff --stat`, and `git diff` against the selected base.
- Reports commit hygiene issues when commit subjects do not follow Conventional Commits.
- Writes the PR description body to `docs/pr-description.md`.
- Prints a separate Keep a Changelog `[Unreleased]` entry.

## Hook Verification

Use the bundled PowerShell verifier from the workspace root:

```powershell
.\scripts\verify-hooks.ps1
```

It locates Git Bash, syntax-checks each hook, and runs the safety-gate allow/block matrix for destructive root deletes, protected-branch force pushes, feature-branch force pushes, and remote-script piping.

You can also run individual Git Bash syntax checks:

```powershell
& 'C:\Program Files\Git\bin\bash.exe' -n .claude/hooks/formatter.sh
& 'C:\Program Files\Git\bin\bash.exe' -n .claude/hooks/reminder.sh
& 'C:\Program Files\Git\bin\bash.exe' -n .claude/hooks/safety-gate.sh
```

The safety gate is intentionally conservative for destructive root operations and protected-branch force pushes. It should still allow scoped fixture cleanup such as `rm -rf /tmp/safe-fixture` and feature-branch force pushes.

## Workspace Verification

Use the fast workspace verifier before handoff:

```powershell
.\scripts\verify-workspace.ps1
```

It runs parent hook checks, parent whitespace checks, parent untracked-text hygiene checks, parent changed/untracked ASCII hygiene checks, nested app whitespace checks, and the nested app static smoke guard.

Use the full release mode when the nested V1 app needs end-to-end release evidence from the parent workspace:

```powershell
.\scripts\verify-workspace.ps1 -FullRelease
```

That keeps the parent hook and hygiene checks, then runs `npm run verify:release` from `rag-interface/`.

## V1 App Verification

The V1 app is verified from the nested app root:

```powershell
cd rag-interface
npm run verify:release
```

That command runs tests, lint, build, production smoke, local browser/API smoke, safe button smoke, manual QA helper auto smoke, cleanup dry-runs, whitespace checks, untracked text hygiene, and a privacy scan.

Manual checks remain outside automation by design:

- Native OS folder picker visibility.
- Visible Claude login launch.
- Real account-backed chat/auth.

## Git Notes

- The parent workspace and `rag-interface/` are separate Git repositories in this checkout.
- The parent `.gitignore` ignores `rag-interface/` so parent status only reports parent-owned workspace files.
- The parent remote has `origin/dev` for this wrapper workspace and `origin/main` for the app-root history mirrored locally by `rag-interface/`; do not blindly merge those layouts.
- Do not commit or push unless explicitly approved.
- Keep `.env.local`, provider keys, account identifiers, OAuth paths, and raw profile paths out of tracked docs and diagnostics.
