# Manual External QA

These checks cover device UI and auth launchers that the automated smoke runner intentionally does not click. Run them locally only.

## Preconditions

- Start the app with `npm run dev`.
- Open `http://localhost:3000/settings`.
- Do not paste API keys, account emails, organization names, OAuth paths, or full home paths into screenshots or issue notes.

Optional helper:

```bash
npm run qa:manual
```

Set `MANUAL_QA_BASE_URL=http://localhost:3000` if the app is running on a different local port. The helper reads sanitized readiness endpoints and prints this checklist. It does not open native dialogs, launch login, send chat messages, or write evidence files.

Settings also includes a `Manual QA Evidence` panel. Use it to mark each check as `Passed`, `Needs fix`, or `Pending` after you run the manual steps. The panel stores only status and timestamp in this browser's local storage; it does not store prompts, screenshots, account names, profile paths, or auth output.

## Native Folder Picker

1. In Settings, find `WORKSPACE_ROOT` or `SKILLS_DIR`.
2. Click `Choose folder`.
3. Confirm a native Windows folder picker opens visibly.
4. Click `Cancel` and confirm the Settings page stays usable.
5. Repeat and choose a harmless local test folder.
6. Confirm the field updates and shows `Unsaved changes`.
7. Save only if you intend to change `.env.local`; otherwise reload the page.

Pass criteria:

- The browser does not freeze.
- Cancel does not change the field.
- A selected folder updates the field.
- No raw account/auth paths are shown outside the selected folder path.

## Claude Open Login

1. In Settings, select the intended Claude profile.
2. Click `Open Login`.
3. Confirm a visible terminal or Claude auth window opens.
4. Close or cancel the login flow unless you intentionally want to authenticate.
5. Return to Settings and confirm the page remains responsive.
6. If you intentionally authenticated, click `Test CLI` and confirm the result is sanitized.

Pass criteria:

- Login never runs silently on page load.
- The launched terminal/window is visible to the user.
- Settings does not display account emails, organization names, raw OAuth paths, tokens, or full profile folder names.
- If auth is blocked by account policy, the UI shows a clean actionable failure.

## Account-Backed Chat

Run this only with an account or API key you are allowed to use. The automated smoke test verifies chat UI, streaming errors, retry, citations, and readiness states with mocked/local-safe inputs; this manual check proves the real selected provider can answer.

1. In Settings, choose the intended provider mode.
2. For API mode, confirm `ANTHROPIC_API_KEY` is present locally without copying its value into notes.
3. For Claude CLI mode, select the intended profile and click `Test CLI`.
4. Confirm the provider/auth row is ready or shows only an intentional account-policy failure.
5. Open Chat.
6. Ask the demo prompt from the release runbook.
7. Confirm the answer cites the indexed skill and includes the expected readiness phrase.
8. Switch back to Settings and confirm diagnostics/readiness output stays sanitized.

Pass criteria:

- The app sends only after an explicit user action.
- Provider errors render as actionable UI text rather than crashing the page.
- No account email, organization name, API key, OAuth path, raw profile path, or token appears in Chat, Settings, Doctor, runtime status, or diagnostics.
- Switching provider settings follows the documented runtime behavior for provider keys.

## Evidence To Record

- Use the Settings `Manual QA Evidence` panel for session-local pass/fail state.
- Keep any external notes sanitized; do not include screenshots containing account identifiers or local secrets.
- Record only the local browser, date, checked buttons, and generic failure category when separate issue notes are needed.
