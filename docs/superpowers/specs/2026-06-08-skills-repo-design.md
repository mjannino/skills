# Skills Repository — Bootstrap Design

**Date:** 2026-06-08
**Scope:** Scaffold the repository structure and deployment pipeline for a personal skills library compatible with skills.sh. No skill content is created as part of this effort.

---

## Goal

Establish a publishable, well-organized skills repository (inspired by `mattpocock/skills`) that:
- Is immediately deployable to skills.sh via `npx skills add mjannino/skills`
- Enforces consistency between the skill registry, README, and filesystem via CI
- Provides a clear template and conventions for authoring skills later

---

## Directory Structure

```
skills/
  engineering/
    README.md        ← lists all engineering skills with one-line descriptions
  productivity/
    README.md
  misc/
    README.md
  in-progress/       ← drafts, excluded from promotion
  deprecated/        ← archived skills, excluded from promotion

.claude-plugin/
  plugin.json        ← registry of all public skills

.github/
  workflows/
    validate-skills.yml   ← CI enforcement

scripts/
  validate.mjs       ← validation script (pure Node.js, no deps)

SKILL-TEMPLATE.md    ← starter template for new skills
CLAUDE.md            ← organizational rules and invariants
README.md            ← root: repo description + full public skill listing
LICENSE
```

Each skill lives at `skills/<category>/<skill-name>/SKILL.md`.

---

## Skill Categories

| Bucket | Promoted | Description |
|--------|----------|-------------|
| `engineering/` | Yes | Code-focused skills: debugging, TDD, review, etc. |
| `productivity/` | Yes | Workflow skills: planning, communication, handoff, etc. |
| `misc/` | Yes | Everything else, including personal/situational skills |
| `in-progress/` | No | Drafts not ready to ship |
| `deprecated/` | No | No longer in use |

`misc/` intentionally absorbs personal and situational skills that don't fit neatly into engineering or productivity.

---

## Sync Invariants (CI-Enforced)

Three rules must hold for every skill under `engineering/`, `productivity/`, and `misc/`:

1. The skill directory must have an entry in `.claude-plugin/plugin.json`
2. The skill must be referenced in the root `README.md`
3. Skills under `in-progress/` and `deprecated/` must **not** appear in either

The `scripts/validate.mjs` script enforces all three, exiting non-zero with a descriptive error on any violation. The GitHub Actions workflow runs this script on every push and pull request.

---

## CI Workflow

`validate-skills.yml` runs on `push` and `pull_request` to all branches. Steps:

1. Checkout repo
2. Set up Node.js
3. Run `node scripts/validate.mjs`
4. Fail the build on any violation

No external dependencies — pure Node.js `fs` module only.

---

## CLAUDE.md Rules

CLAUDE.md is the single source of truth for repo conventions. It documents:

- Bucket definitions and what belongs in each
- The three sync invariants and the fact that CI enforces them
- Skill file format: `SKILL.md` with `name` + `description` frontmatter
- Instructions to start new skills from `SKILL-TEMPLATE.md`
- Explicit exclusion of `in-progress/` and `deprecated/` from promotion

---

## SKILL-TEMPLATE.md Format

```markdown
---
name: skill-name-here
description: One sentence. What the skill does and when to invoke it.
---

# Skill Title

## When to Use
<!-- What triggers this skill? What problem does it solve? -->

## Key Principles
<!-- 3-5 non-obvious rules that make this skill work well. -->

## Process
<!-- Step-by-step guidance. Be specific — this is what the agent reads. -->
```

Frontmatter fields match what the skills CLI expects. Section order is fixed: When to Use → Key Principles → Process.

---

## Out of Scope

- Authoring any actual skill content
- A setup slash command (e.g. `/setup-mjannino-skills`)
- Automated skill generation tooling
