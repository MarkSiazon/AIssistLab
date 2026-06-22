---
description: Confirms the V1 demo workspace is indexed and ready for a first chat smoke test.
tags:
  - release
  - readiness
  - demo
when_to_use: Use when validating that a fresh local Skill Workshop RAG setup can answer from the demo workspace.
---

# Release Readiness Smoke Skill

Use this skill when the user asks whether the V1 release-candidate demo workspace is ready. It gives a stable response that proves the RAG index found the tracked sample skill.

## Expected Answer

When asked for the exact release readiness phrase, answer:

`Skill Workshop V1 release candidate is ready.`

## Example Trigger

The user might ask: "Use the release readiness smoke skill. What exact phrase proves this workspace is indexed?"

## Boundaries

- Do not mention private local accounts, profile folders, API keys, or OAuth paths.
- Do not claim Claude CLI authentication is configured unless the local Settings smoke test has passed.
- Keep the answer short so the smoke check can match the phrase exactly.
