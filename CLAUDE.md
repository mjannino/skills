# Repository Conventions

## Skill Organization

Skills live under `skills/` in category buckets:

| Bucket | Promoted | Purpose |
|--------|----------|---------|
| `engineering/` | Yes | Code-focused skills: debugging, review, TDD, etc. |
| `productivity/` | Yes | Workflow skills: planning, communication, handoff, etc. |
| `misc/` | Yes | Everything else — personal, situational, cross-cutting |
| `in-progress/` | No | Drafts not ready to ship |
| `deprecated/` | No | No longer in use |

## Skill Format

Each skill lives at `skills/<category>/<skill-name>/SKILL.md`.

Use `SKILL-TEMPLATE.md` as the starting point. Every `SKILL.md` must begin with:

```
---
name: skill-name
description: One sentence describing the skill and when to invoke it.
---
```

## Sync Invariants (CI-Enforced)

For every skill directory under `engineering/`, `productivity/`, and `misc/`:
1. The path `./skills/<category>/<skill-name>` must appear in `.claude-plugin/plugin.json`
2. The path `skills/<category>/<skill-name>` must appear in the root `README.md`

For every skill directory under `in-progress/` and `deprecated/`:
3. The skill must **not** appear in `.claude-plugin/plugin.json` or root `README.md`

CI runs `node scripts/validate.mjs` on every push and PR. Violations block merges.

## When Adding a Skill

1. Copy `SKILL-TEMPLATE.md` to `skills/<category>/<skill-name>/SKILL.md`
2. Fill in the frontmatter and sections
3. Add `"./skills/<category>/<skill-name>"` to `.claude-plugin/plugin.json`
4. Add a row to the root `README.md` skills table for the category
5. Add a row to `skills/<category>/README.md`
6. Run `node scripts/validate.mjs` — it must pass before committing
