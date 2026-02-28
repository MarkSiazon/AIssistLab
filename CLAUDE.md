# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What This Workspace Is

This is a Claude Code **CLI workspace**. Skills are markdown prompt files stored in `.claude/skills/` that are invoked via `/skill-name` slash commands inside Claude Code sessions.

## Skill Development

### File Location

Skills live in `.claude/skills/<skill-name>/SKILL.md` (directory form) or `.claude/skills/<skill-name>.md` (single-file form).

### How Skills Work

- Invoked as `/skill-name [optional args]` inside Claude Code
- The `$ARGUMENTS` variable holds any text the user passes after the skill name
- Skills are prompt files — Claude reads them as instructions and executes the steps using its tools

## `auto-branch-analyzer-to-pr` Skill

**File:** `.claude/skills/auto-branch-analyzer-to-pr/SKILL.md`

**Purpose:** Generate a standardized PR title and description by analyzing commits and diffs between the current branch and a base branch.

**Usage:**

- `/auto-branch-analyzer-to-pr` → compares against `dev` (default)
- `/auto-branch-analyzer-to-pr main` → compares against `main`

**What it does (6 steps):**

1. Detects current branch; handles detached HEAD and missing base branch
2. Runs `git log`, `git diff --stat`, and `git diff` to gather context
3. **Commit hygiene check** — audits commit messages against Conventional Commits format; outputs a `## ⚠ Commit Hygiene Issues` report if any are non-compliant
4. Generates PR description (Title, Summary, Changes, Files Affected, Testing Notes) derived from the actual diff, not just commit messages
5. **Changelog entry** — generates a [Keep a Changelog](https://keepachangelog.com/) `[Unreleased]` block from the same diff
6. **Saves** the PR description to `pr-description.md` in the repo root and prints `gh pr create` commands for the user
