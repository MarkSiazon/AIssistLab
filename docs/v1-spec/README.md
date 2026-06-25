# V1 Spec Index

These specs turn the V1 roadmap into implementation-ready slices. Each iteration should be independently shippable and can be assigned to a separate sub-agent after the previous dependencies are merged or checkpointed.

## Execution Order

1. [Iteration 01: Release Polish](./iteration-01-release-polish.md)
2. [Iteration 02: Skill Lifecycle](./iteration-02-skill-lifecycle.md)
3. [Iteration 03: Claude Code Cockpit](./iteration-03-claude-code-cockpit.md)
4. [Iteration 04: Guided Learning](./iteration-04-guided-learning.md)
5. [Iteration 05: Release Readiness Polish](./iteration-05-release-readiness-polish.md)
6. [Subagent Execution Checklist](./subagent-execution-checklist.md)

## Coordination Rules

- Keep V1 Claude-first.
- Do not implement the V2 provider registry in these iterations.
- Keep all device-local APIs localhost-only.
- Never expose account identifiers, full home paths, raw provider output, API keys, token paths, or hidden profile state.
- Add tests with each implementation slice.
- Run browser smoke checks for UI changes.
- Do not commit unless the user explicitly asks for a checkpoint commit.

## Suggested Sub-Agent Ownership

- Agent A: current feature inventory and source mapping.
- Agent B: official Claude docs research and citation validation.
- Agent C: similar-project inspiration scan and "copy/avoid" synthesis.
- Agent D: roadmap, backlog, and release sequencing.
- Agent E: implementation checklist authoring.
- Agent F: privacy, source, and scope review.

## Shared Acceptance Gates

Use the [V1 release-candidate runbook](../v1-release/release-candidate-runbook.md#command-gates) as the maintained source of truth for command gates, cleanup, privacy scans, and manual QA. Do not duplicate the command list in individual specs unless an iteration needs an extra focused check.

Every iteration should still document:

- Targeted unit/API tests for changed behavior.
- Browser smoke or UI evidence for touched pages.
- Privacy evidence for touched public APIs.
- Final diff review showing no unrelated changes.
