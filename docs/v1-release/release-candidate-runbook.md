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

It runs project cleanup dry-run preflight, the full test sweep, lint, production build, production server smoke with desktop/mobile visual route checks, dependency audit, local browser/API smoke with keyboard action coverage, safe button smoke, manual QA helper auto smoke, project cleanup dry-run postflight, asset usage audit, documentation link audit, dead-code audit, diff whitespace check, untracked text hygiene scan, and privacy scan.

If you need to debug an individual gate, run the underlying commands:

```bash
npm test
npm run lint
cmd.exe /c npm run build
npm audit
npm run smoke:local
npm run smoke:buttons
npm run smoke:production
npm run audit:assets
npm run audit:docs
npm run audit:dead-code
git diff --check
```

`npm run smoke:local` drives local interactive Settings, Skills, Chat, Export, Editor, and Guided Builder flows in Chromium and verifies keyboard paths, semantic route structure, ARIA references, accessible control names, and 44px action targets across those states.

`npm run smoke:buttons` clicks low-risk visible buttons across the main local routes and fails on console errors or real failed requests. It intentionally skips auth launchers, native folder pickers, save/delete/export/send actions, secret reveal buttons, and provider calls.

`npm run smoke:production` starts the built app with `next start` against the demo workspace and verifies production API guards, chat missing-key streaming, desktop/mobile visual rendering, landmarks, heading order, ARIA references, accessible control names, 44px action targets, local hash links, built-client Settings/editor/guided/chat/export interaction states, and browser console/page errors.

`npm run audit:assets` fails when tracked or visible untracked image/font/icon assets are not referenced by source or docs. Next's conventional `src/app/favicon.ico` is allowed without an explicit import.

`npm run audit:docs` fails when README or docs markdown files link to missing repo-local files or missing markdown headings. It ignores external source/research links.

`npm run audit:dead-code` uses Knip with repo-specific Next route, script, and test entry points. It fails on unused files, unused dependencies, unlisted dependencies/binaries, or unresolved imports while allowing the expected Windows system helpers used by local smoke and cleanup scripts.

If a local smoke/dev run is interrupted and memory or ports look stale, inspect project-owned process trees first:

```bash
npm run cleanup:project:dry-run
```

Then stop only this repo's detected Next, smoke, test, release, and manual QA helper process trees:

```bash
npm run cleanup:project
```

The cleanup command requires this repo path plus a known Next or release-script command signature and excludes Codex/MCP infrastructure so other Codex conversations are not targeted.

To remove ignored local build and smoke artifacts after a verification run, inspect first:

```bash
npm run cleanup:artifacts:dry-run
```

Then remove only the generated `.next`, `.local-workspace`, and `tsconfig.tsbuildinfo` artifacts:

```bash
npm run cleanup:artifacts
```

The artifact cleanup does not delete `.env.local`, `node_modules`, tracked docs, screenshots, or source files.

## Manual External QA

These checks cover device UI and auth launchers that the automated smoke runner intentionally does not click. Run them locally only, and do not paste API keys, account emails, organization names, OAuth paths, raw Claude profile folder names, or full home paths into screenshots or notes.

When the local app is already running, use the manual external QA helper to print the current sanitized readiness summary and remaining device/account checks:

```bash
npm run qa:manual
```

Set `MANUAL_QA_BASE_URL=http://localhost:3000` when the app is running on a different local port. If no dev server is running, use the temporary-server helper instead:

```bash
npm run qa:manual:auto
```

Both helpers print only sanitized status plus the manual checklist, including why each gated check remains manual. They do not click native OS dialogs, launch login, send chat, or write evidence files.

The helper may print `blocked` readiness when the local provider is intentionally incomplete, such as API mode without an API key or Claude CLI mode without a usable account. Treat that as a sanitized setup snapshot, not as a failed automated smoke run. Finish the account-backed chat check only after you intentionally configure a provider you are allowed to use.

After running the manual checks, open Settings and mark the results in `Manual QA Evidence`. The panel stores only status and timestamp in browser storage when available, or in memory for the current page if storage is restricted. It does not store prompts, screenshots, account names, profile paths, or auth output.

### Native Folder Picker

1. In Settings, find `WORKSPACE_ROOT` or `SKILLS_DIR`.
2. Click `Choose folder`.
3. Confirm a native folder picker opens visibly.
4. Click `Cancel` and confirm Settings stays usable and the field is unchanged.
5. Repeat and choose a harmless local test folder.
6. Confirm only the intended field updates and shows `Unsaved changes`.
7. Save only if you intend to change `.env.local`; otherwise reload the page.

Pass criteria:

- The browser does not freeze.
- Cancel does not change the field.
- A selected folder updates the intended field.
- No raw account or auth paths are shown outside the selected folder path.

### Claude Open Login

1. In Settings, select the intended Claude profile.
2. Click `Open Login`.
3. Confirm a visible terminal or Claude auth window opens.
4. Close or cancel the login flow unless you intentionally want to authenticate.
5. Return to Settings and confirm the page remains responsive.
6. If you intentionally authenticated, click `Test CLI` and confirm the result is sanitized.

Pass criteria:

- Login never runs silently on page load.
- The launched terminal or auth window is visible to the user.
- Settings does not display account emails, organization names, raw OAuth paths, tokens, or full profile folder names.
- If auth is blocked by account policy, the UI shows a clean actionable failure.

### Account-Backed Chat

Run this only with an account or API key you are allowed to use. The automated smoke test verifies chat UI, streaming errors, retry, citations, and readiness states with mocked/local-safe inputs; this manual check proves the real selected provider can answer.

1. In Settings, choose the intended provider mode.
2. For API mode, confirm `ANTHROPIC_API_KEY` is present locally without copying its value into notes.
3. For Claude CLI mode, select the intended profile and click `Test CLI`.
4. Confirm the provider/auth row is ready or shows only an intentional account-policy failure.
5. Open Chat.
6. Ask the demo prompt from this runbook.
7. Confirm the answer cites the indexed skill and includes the expected readiness phrase.
8. Switch back to Settings and confirm diagnostics/readiness output stays sanitized.

Pass criteria:

- The app sends only after explicit user action.
- Provider errors render as actionable UI text rather than crashing the page.
- No account email, organization name, API key, OAuth path, raw profile path, or token appears in Chat, Settings, Doctor, runtime status, or diagnostics.
- Switching provider settings follows the documented runtime behavior for provider keys.

Evidence to record:

- Use the Settings `Manual QA Evidence` panel for session-local pass/fail state.
- Keep external notes sanitized.
- Record only the local browser, date, checked buttons, and generic failure category when separate issue notes are needed.

`npm test` executes every `src/**/*.test.ts` file and release script helper test under `scripts/**/*.test.mjs`. Prefer the npm script for the full sweep so source and release-helper coverage stay in sync.

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
8. Asset usage audit result.
9. Documentation link audit result.
10. Dead-code audit result.
11. Untracked text hygiene scan result.
12. Privacy scan result.
13. Local artifact cleanup dry-run result.
14. Manual external QA result for native folder picker, Open Login, and account-backed chat.
15. Final diff review.

Commit and push only after explicit approval.

The latest privacy-safe local evidence snapshot is tracked in [latest-local-qa-evidence.md](latest-local-qa-evidence.md).
