# V1 Release Candidate Runbook

This runbook verifies Skill Workshop RAG V1 as a Claude-first local release candidate. It is designed for a fresh local user and avoids private machine paths, account names, API keys, OAuth paths, and Claude profile details.

## Scope

V1 is ready when a local user can:

1. Configure a workspace and skills directory.
2. Rebuild the RAG index.
3. Select either Anthropic API mode or local Claude CLI mode.
4. Test the selected provider auth path explicitly.
5. Ask a first RAG-backed chat question.
6. Review Setup Doctor and V1 Release Readiness.
7. Export a sanitized diagnostics bundle.

V1 does not require hosted Claude CLI auth, automatic login, automatic generation tests on page load, broad device scans, V2 provider adapters, or private account discovery.

## Demo Workspace

The repo includes a tracked demo workspace at:

```text
examples/demo-workspace
```

Use it for clean local smoke tests by setting:

```env
WORKSPACE_ROOT=examples/demo-workspace
SKILLS_DIR=.claude/skills
NEXT_PUBLIC_APP_TITLE=Skill Workshop RAG
```

Then configure one provider path:

```env
# Option A: API mode
LLM_PROVIDER=anthropic_api
ANTHROPIC_API_KEY=<set locally>
ENABLE_LOCAL_CLAUDE_CLI=false
```

```env
# Option B: local Claude CLI mode
LLM_PROVIDER=claude_code_cli
ENABLE_LOCAL_CLAUDE_CLI=true
CLAUDE_CLI_PATH=auto
CLAUDE_LOGIN_COMMAND=auto
CLAUDE_CONFIG_DIR=
```

Keep `.env.local` local-only. Do not commit real provider keys or private profile paths.

## Fresh Local Verification

From the repo root:

```bash
npm install
npm run dev
```

Open `http://localhost:3000/settings`.

In Settings:

1. Confirm workspace and skills path rows are valid.
2. Click `Rebuild Index`.
3. In API mode, confirm the API key readiness row is clear.
4. In Claude CLI mode, select a profile and click `Test CLI`.
5. Confirm Setup Doctor has no blocking errors.
6. Confirm V1 Release Readiness is ready or shows only intentional provider-auth blockers.

Open `http://localhost:3000/chat` and ask:

```text
Use the release readiness smoke skill. What exact phrase proves this workspace is indexed?
```

Expected phrase:

```text
Skill Workshop V1 release candidate is ready.
```

Open `http://localhost:3000/export`, enable diagnostics, generate a zip, and inspect that diagnostics include only sanitized readiness, index, skill quality, Claude project, and settings summaries.

## Command Gates

Run the repo-native automated release gate:

```bash
npm run verify:release
```

It runs the full test sweep, lint, production build, production server smoke with desktop/mobile visual route checks, dependency audit, local browser/API smoke with keyboard action coverage, diff whitespace check, untracked text hygiene scan, and privacy scan.

If you need to debug an individual gate, run the underlying commands:

```bash
npm test
npm run lint
cmd.exe /c npm run build
npm audit
npm run smoke:local
npm run smoke:production
git diff --check
```

`npm run smoke:local` drives local interactive Settings, Skills, Chat, Export, Editor, and Guided Builder flows in Chromium and verifies keyboard paths, semantic route structure, ARIA references, accessible control names, and 44px action targets across those states.

`npm run smoke:production` starts the built app with `next start` against the demo workspace and verifies production API guards, chat missing-key streaming, desktop/mobile visual rendering, landmarks, heading order, ARIA references, accessible control names, 44px action targets, local hash links, built-client Settings/editor/guided/chat/export interaction states, and browser console/page errors.

When the local app is already running, use the manual external QA helper to print the current sanitized readiness summary and remaining device/account checks:

```bash
npm run qa:manual
```

Set `MANUAL_QA_BASE_URL=http://localhost:3000` when the app is running on a different local port. The helper does not click native OS dialogs, launch login, send chat, or write evidence files.

After running those checks, open Settings and mark the results in `Manual QA Evidence`. The panel stores only status and timestamp in browser storage when available, or in memory for the current page if storage is restricted.

`npm test` executes every `src/**/*.test.ts` file and release script helper tests under `scripts/**/*.test.mjs`. If you need to run the same sweep manually:

```powershell
$failed = @()
Get-ChildItem -Recurse src -Filter *.test.ts | Sort-Object FullName | ForEach-Object {
  npx --yes tsx $_.FullName
  if ($LASTEXITCODE -ne 0) { $failed += $_.FullName }
}
if ($failed.Count -gt 0) {
  $failed | ForEach-Object { Write-Error $_ }
  exit 1
}
```

## Privacy Gate

Before a checkpoint commit or release tag, run a static scan over tracked docs and source for:

- private local home paths
- account identifiers
- real API keys or bearer tokens
- provider auth file paths
- raw Claude profile paths

Expected result: no private local paths, account identifiers, real API keys, provider auth paths, or bearer tokens. The authoritative privacy pattern lives in `scripts/smoke/privacy-assertions.mjs` and is run by the full release verifier.

```powershell
npm run verify:release
```

## Release Evidence

Capture this evidence for a V1 release-candidate checkpoint:

1. Git branch and status.
2. Full test sweep result.
3. Lint result.
4. Build result.
5. Dependency audit result.
6. Browser smoke for `/settings`, `/skills`, `/chat`, `/export`, and `/editor/guided`.
7. API smoke for `/api/index`, `/api/chat/status`, `/api/release/readiness`, and diagnostics zip generation.
8. Untracked text hygiene scan result.
9. Privacy scan result.
10. Manual external QA result for native folder picker, Open Login, and account-backed chat.
11. Final diff review.

Commit and push only after explicit approval.
