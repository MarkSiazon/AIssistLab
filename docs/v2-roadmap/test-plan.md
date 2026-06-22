# V2 Test Plan

## Docs-Only Verification

For this roadmap package:

```powershell
Test-Path docs/v2-roadmap/roadmap.md
Test-Path docs/v2-roadmap/research-cli-support-matrix.md
Test-Path docs/v2-roadmap/provider-registry-architecture.md
Test-Path docs/v2-roadmap/discovery-and-security-model.md
Test-Path docs/v2-roadmap/ui-ux-plan.md
Test-Path docs/v2-roadmap/adapter-backlog.md
Test-Path docs/v2-roadmap/open-source-inspiration.md
Test-Path docs/v2-roadmap/test-plan.md
git diff --check
```

Expected result:

- Every file exists.
- `roadmap.md` links to every subfile.
- Unsafe placeholder scan returns no matches. The scan should cover unfinished markers, sample secret prefixes, raw Windows home paths, placeholder emails, and raw auth path terms without embedding those strings in the docs themselves.
- `git diff --check` returns no whitespace errors.

## Future Provider Registry Tests

Unit tests:

- Registers known adapters.
- Rejects duplicate provider ids.
- Resolves active provider by id.
- Falls back from legacy `LLM_PROVIDER` to registry provider id.
- Keeps model selection separate from provider selection.
- Refuses unknown provider ids.

Runtime-config tests:

- Applies active provider keys without serializing secrets.
- Falls back to process env when no runtime override exists.
- Keeps workspace and index path behavior separate from provider switching.
- Preserves v1 Claude env compatibility.

## Future Discovery Tests

Discovery resolver tests:

- Explicit path wins over known install path.
- Known install path wins over PATH.
- PATH fallback detects allowlisted command names.
- Missing command returns `missing`, not an exception.
- Kiro adapter checks both `kiro-cli` and `kiro`.
- Cursor Agent remains `needs validation` until command shape is verified.
- Local model server discovery checks only allowlisted endpoints.

No broad filesystem scan tests:

- Provider discovery does not recurse through home folders.
- Provider discovery does not enumerate unrelated directories.
- Optional deeper detection requires explicit user action.

## Future Sanitization Tests

Sanitizer tests should cover:

- Emails.
- Usernames inside home paths.
- Organization or tenant names.
- Full Windows, macOS, and Linux home paths.
- API keys.
- Bearer tokens.
- Provider token/config paths.
- Raw stdout/stderr with embedded paths.
- Profile folder basenames.
- JSON status payloads with nested sensitive fields.

Expected result:

- Public provider responses contain only generic labels and sanitized displays.
- Internal adapter results can keep real paths server-side only.

## Future Smoke-Test Tests

Use mocked process runners and HTTP clients.

Common tests:

- Smoke prompt is exactly bounded.
- Smoke tests are not run on page load.
- Timeout kills or cancels the provider call.
- Failed provider output becomes stable error codes.
- Passing smoke test stores provider id and config fingerprint.
- Stale smoke test is ignored after provider/config changes.

CLI adapter tests:

- Child process receives only approved env values.
- Conflicting credentials are removed where required.
- Tool/write permission flags are disabled unless a provider has a verified read-only mechanism.
- Output parser handles text, JSON, and stream events.

Server adapter tests:

- Local health checks do not start servers automatically.
- HTTP errors are normalized.
- Model missing errors produce suggested fixes.

## Future API Guard Tests

Every provider endpoint must reject non-local host headers:

- `GET /api/settings/providers`
- `GET /api/settings/providers/:providerId/status`
- `POST /api/settings/providers/:providerId/test`
- `POST /api/settings/providers/:providerId/login`
- `POST /api/settings/providers/active`

Expected result:

- Non-local `Host` returns `403`.
- Localhost and loopback hosts are allowed.

## Future UI Browser Smokes

Settings:

- `AI Providers` section renders.
- Provider cards show installed and missing states.
- `Detect`, `Open Login`, `Test`, and `Set Active` buttons have loading and disabled states.
- Setup Doctor sidebar summarizes active provider readiness.
- Long sanitized paths do not overflow.

Chat:

- Chat status shows active provider and runtime source.
- Missing/stale RAG index warning still works.
- Provider auth errors render as actionable UI states.
- Retry does not duplicate the user message.

Responsive checks:

- Desktop Settings layout.
- Narrow viewport Settings layout.
- Chat with provider warning.
- High-contrast status labels are readable without relying on color alone.

## Future Runtime Switch Tests

Acceptance tests:

- Save active Claude provider and chat uses Claude without restart.
- Save active API provider and chat uses API mode without restart.
- Save active Gemini provider and chat uses Gemini without restart after adapter support lands.
- Switching provider invalidates stale smoke-test state.
- Setup Doctor uses runtime-applied provider state for provider keys.
- Workspace and RAG index path changes still require explicit rebuild or restart guidance where applicable.
