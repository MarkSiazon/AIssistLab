# UI/UX Plan

## Goal

Settings should evolve from a Claude-specific configuration page into an `AI Providers` workbench. The user should be able to see what is installed, what is signed in, what has been smoke tested, and what is active without reading raw env files.

The UI should remain dense and operational. This is a local developer tool, not a marketing surface.

## Information Architecture

### Main Settings Content

Rename the current Claude-oriented section to `AI Providers`.

Recommended layout:

1. Active provider summary.
2. Provider cards.
3. Active provider details.
4. Advanced env values.

### Right Sidebar

Keep the Setup Doctor sidebar dense:

1. Overall health.
2. Top actions.
3. Active provider readiness.
4. RAG index readiness.
5. Workspace readiness.
6. Provider smoke-test state.

## Provider Cards

Each provider card should show:

- Provider label.
- Runtime kind: CLI, local server, API gateway, or direct API.
- Install state: `Installed` or `Not found`.
- Auth state: `Signed in`, `Not signed in`, `Needs key`, `Not checked`, or `Unknown`.
- Smoke state: `Passed`, `Failed`, `Not run`, or `Stale`.
- Active state: `Active` or `Inactive`.
- Last checked time in relative text.

Card actions:

- `Detect`
- `Open Login`
- `Test`
- `Set Active`

Do not show account names, raw profile names, full paths, raw token file names, or provider config contents.

## Provider Details

When a card is selected, show:

- Sanitized command source.
- Runtime kind.
- Supported capabilities.
- Suggested next action.
- Advanced selection controls.

Examples:

- `Installed from PATH`
- `Default profile`
- `Profile 1`
- `Local server reachable`
- `Endpoint configured`
- `API key present`

## Active Provider Flow

Recommended happy path:

1. User opens Settings.
2. Provider cards load with passive discovery only.
3. User clicks `Test` on a provider.
4. Provider returns `Passed` or an actionable failure.
5. User clicks `Set Active`.
6. Settings save writes `.env.local` and runtime-applies active provider keys when supported.
7. Chat status updates without restart for provider settings.

## Setup States

Use text labels, not color alone:

- `Ready`
- `Needs setup`
- `Needs login`
- `Needs API key`
- `Smoke test failed`
- `Not installed`
- `Local-only`
- `Blocked by provider policy`

## Accessibility

Controls must have:

- Visible labels.
- Disabled and loading states.
- At least 44px button height.
- Keyboard focus states.
- Status text in addition to color.
- Tooltips or title text for truncated sanitized paths.

Long text must wrap or truncate safely. Cards should not resize because of dynamic provider output.

## Error UX

Error messages should be actionable:

- Missing command: `Install the CLI or set the provider command path.`
- Missing auth: `Open Login, then run Test again.`
- API key missing: `Add the provider API key in Settings.`
- Policy blocked: `This provider account or organization disabled the required CLI/API access.`
- Timeout: `The provider did not finish within the configured timeout. Try again or increase the timeout.`
- Unsafe mode rejected: `This provider cannot be used until a no-tools or read-only mode is available.`

Avoid raw provider output in UI. Show a sanitized preview only when it helps the user fix the issue.

## Doctor Integration

Setup Doctor should show provider checks in this order:

1. Active provider is valid.
2. Active provider is enabled in this environment.
3. Active provider executable or endpoint exists.
4. Active provider auth is ready.
5. Active provider smoke test is current.
6. Non-active installed providers are optional.

If multiple providers are installed but none is selected, show a warning:

`Multiple providers are installed. Set one active provider before using chat.`

## First-Run Checklist

V2 can extend the v1 checklist:

1. Choose workspace.
2. Rebuild RAG index.
3. Detect AI providers.
4. Pick a provider.
5. Open login or add API key.
6. Run smoke test.
7. Send first chat.

No checklist step should automatically run login or generation.
