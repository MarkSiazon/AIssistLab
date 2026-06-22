# Privacy Security Release Checklist

Use this checklist before any V1 checkpoint commit or release.

## Local Access

- All endpoints that expose local filesystem, provider, env, profile, or index state are localhost-only.
- Non-local `Host` headers return `403`.
- No endpoint performs broad filesystem scans.
- Folder browsing is constrained to explicit user-selected roots.
- Import flows preview before writing.

## Secret Safety

- API keys are never serialized in API responses.
- API key fields are masked in UI.
- Child-process env values are never returned to the browser.
- Provider status output is sanitized before display.
- Diagnostics exports report present/missing/malformed only.

## Claude Profile Privacy

- Public APIs do not include raw Claude profile paths.
- Public APIs do not include profile folder basenames when those basenames may identify an account or organization.
- Public APIs use generic profile labels.
- Manual paths are sanitized before display.
- Smoke-test state is keyed by provider/profile/config fingerprint and does not expose raw config paths.

## Filesystem Safety

- Skill names reject path traversal.
- Skill writes stay inside the configured skills directory.
- Delete requires exact name confirmation.
- Future import flows write only after user confirmation.
- Future restore/trash flows keep backups inside an app-controlled local directory.

## Claude Ecosystem Safety

- Claude ecosystem inventory is read-only in V1.
- The app does not auto-install skills, hooks, agents, MCP servers, or plugins.
- The app does not auto-run Claude Code slash commands.
- Hook/event observability is not enabled by default.
- Suggested fixes are text only unless a future spec explicitly adds a safe apply action.

## Docs Hygiene

- Docs do not include personal account names.
- Docs do not include raw local home paths.
- Docs do not include sample secret prefixes.
- Docs do not include raw auth callback paths or token file paths.
- Third-party source text is paraphrased and cited.
- Leaked/internal Claude material is not used.

## Verification Commands

Run after docs-only changes:

```powershell
git diff --check
git status --short --branch
```

Run after code changes:

```powershell
npm run verify:release
```

The release verifier includes full tests, lint, build, audit, browser/API smoke, tracked diff whitespace checks, untracked release-text hygiene checks, and the privacy scan.

For focused debugging, run individual checks:

```powershell
npx --yes tsx src/lib/claude/discovery.test.ts
npx --yes tsx src/lib/rag/index-state.test.ts
npx --yes tsx src/lib/skills/guided-builder.test.ts
npx --yes tsx src/lib/skills/validation.test.ts
npx --yes tsx src/lib/skills/quality.test.ts
npx --yes tsx src/lib/settings/runtime-config.test.ts
npx --yes tsx src/lib/settings/doctor.test.ts
npx --yes tsx src/app/api/index/route.test.ts
npx --yes tsx src/app/api/skills/guided/routes.test.ts
npx --yes tsx src/app/api/skills/validation-route.test.ts
npx --yes tsx src/app/api/chat/status/route.test.ts
npx --yes tsx src/app/api/export/zip/route.test.ts
npm run lint
cmd.exe /c npm run build
npm audit
```
