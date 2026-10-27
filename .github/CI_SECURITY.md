# CI Security Policy

## Trust boundary

- Pull-request CI runs with `contents: read` and no repository secrets.
- The trusted lifecycle controller runs after `CI` succeeds and also performs a scheduled/manual catch-up for approved attempt-2 runs; it never checks out pull-request code or downloads pull-request artifacts.
- The controller refuses a stale result unless the successful run SHA still matches the pull request head SHA.
- Catch-up processing requires successful `verify-release`, `route-policy`, and `analyze` check runs on the current head SHA, then re-reads the SHA immediately before changing PR state.
- The route-policy gate allows feature and bot work into `dev`, permits only `dev` to promote into `main`, and requires protected `main` history to synchronize through a checked `sync/main-to-dev-*` branch that already contains both protected histories.
- A scheduled controller may approve a pending public-fork run only for the same trusted actors and current head SHA; it never checks out pull-request content.
- Automatic ready/merge handling is limited to repository owners, members, collaborators, heads owned by `Iron-Mark`, `MarkSiazon`, or `MarkS-Trampettimg`, `dependabot[bot]`, and `imgbot[bot]`.
- Every other fork or bot remains manual, even when its tests pass.

## Required merge gate

Active `dev` and `main` rulesets require pull requests and resolved review threads; block force pushes and branch deletion; and have no administrator bypass. Development PRs use squash merges, while `dev` promotions and trusted `sync/main-to-dev-*` history synchronizations use merge commits so long-lived branch ancestry stays intact. Direct `main`-to-`dev` PRs are rejected because strict up-to-date rules make that route circular. The required gates are `verify-release`, `route-policy`, and CodeQL `analyze`. Auto-merge may complete only after every required check passes.

## Lifecycle recovery

The controller reacts to successful CI, CodeQL, and route-policy completions. If an event omits its PR association, it considers open PRs only against that event's head SHA. Scheduled/manual catch-up remains available. Check selection uses the newest check-run ID from the GitHub Actions app, so an older successful attempt cannot hide a newer running or failed attempt. Incomplete checks are left pending; the controller does not cancel or rerun them.

Queued auto-merge settings are preserved. Merge calls include the validated head SHA. An ancestry-sync prefix selects merge commits only for a branch in this repository; a trusted fork using that prefix receives ordinary squash handling. Lifecycle runs serialize to avoid competing state changes.

For recovery after a missed event, dispatch the existing workflow on the default branch: `gh workflow run trusted-pr-lifecycle.yml --ref main --repo MarkSiazon/AIssistLab`. This revalidates trust and checks; it does not bypass protection. Run `node scripts/ci/lifecycle-controller.test.mjs` locally to test controller behavior without network access.

## Workflow supply chain

All `uses:` references are pinned to verified full commit SHAs. Dependabot checks the `github-actions` ecosystem weekly, targets `dev`, and proposes grouped pin updates through the same required gate. CodeQL scans JavaScript and TypeScript on protected-branch pushes, pull requests, a weekly schedule, and manual dispatch.

## Repository security

- Secret scanning and push protection are enabled for the public repository.
- Dependabot security updates are enabled in addition to grouped workflow-version updates.
- CodeQL uploads use only `contents: read` and `security-events: write`; analysis does not receive repository secrets.

## Fork and deployment policy

After the scheduled controller reaches the default branch, switch public-fork workflow approval from first-time contributors to every external contributor. GitHub keeps their token read-only and withholds secrets; the controller supplies approval only for trusted actors. Vercel Git Fork Protection must remain enabled so fork previews require project-member authorization.
