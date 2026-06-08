# Skills Repository Bootstrap Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Scaffold a publishable skills repository with directory structure, CI validation, and authoring conventions — no skill content.

**Architecture:** All public skills live under `skills/{engineering,productivity,misc}/` and must appear in both `.claude-plugin/plugin.json` and root `README.md`. A pure Node.js validation script enforces this on every push/PR via GitHub Actions.

**Tech Stack:** Markdown, Node.js (ESM, no dependencies), GitHub Actions

---

## Pre-step: Commit the plan

- [ ] **Commit this plan document before beginning execution**

```bash
git add docs/superpowers/plans/2026-06-08-skills-repo-bootstrap.md
git commit -m "docs: add bootstrap implementation plan"
```

---

## Task 1: Directory scaffold

**Files:**
- Create: `skills/engineering/README.md`
- Create: `skills/productivity/README.md`
- Create: `skills/misc/README.md`
- Create: `skills/in-progress/.gitkeep`
- Create: `skills/deprecated/.gitkeep`

- [ ] **Step 1: Create the directory tree**

```bash
mkdir -p skills/engineering skills/productivity skills/misc skills/in-progress skills/deprecated
touch skills/in-progress/.gitkeep skills/deprecated/.gitkeep
```

- [ ] **Step 2: Write `skills/engineering/README.md`**

```markdown
# Engineering Skills

Code-focused skills for daily development work.

| Skill | Description |
|-------|-------------|
| *(none yet)* | |
```

- [ ] **Step 3: Write `skills/productivity/README.md`**

```markdown
# Productivity Skills

Workflow skills for planning, communication, and process.

| Skill | Description |
|-------|-------------|
| *(none yet)* | |
```

- [ ] **Step 4: Write `skills/misc/README.md`**

```markdown
# Misc Skills

Everything else — personal, situational, and cross-cutting skills.

| Skill | Description |
|-------|-------------|
| *(none yet)* | |
```

- [ ] **Step 5: Commit**

```bash
git add skills/
git commit -m "feat: add skill directory scaffold"
```

---

## Task 2: Plugin registry

**Files:**
- Create: `.claude-plugin/plugin.json`

- [ ] **Step 1: Create `.claude-plugin/plugin.json`**

```bash
mkdir -p .claude-plugin
```

Write `.claude-plugin/plugin.json`:

```json
{
  "name": "mjannino-skills",
  "skills": []
}
```

- [ ] **Step 2: Verify it parses correctly**

```bash
node -e "console.log(JSON.parse(require('fs').readFileSync('.claude-plugin/plugin.json','utf8')))"
```

Expected output:
```
{ name: 'mjannino-skills', skills: [] }
```

- [ ] **Step 3: Commit**

```bash
git add .claude-plugin/plugin.json
git commit -m "feat: add plugin registry"
```

---

## Task 3: Validation script

**Files:**
- Create: `scripts/validate.mjs`

- [ ] **Step 1: Create scripts directory**

```bash
mkdir -p scripts
```

- [ ] **Step 2: Write `scripts/validate.mjs`**

```javascript
#!/usr/bin/env node
import { readFileSync, readdirSync, existsSync } from 'fs';
import { join } from 'path';
import { fileURLToPath } from 'url';

const ROOT = join(fileURLToPath(import.meta.url), '..', '..');
const PUBLIC_CATEGORIES = ['engineering', 'productivity', 'misc'];
const EXCLUDED_CATEGORIES = ['in-progress', 'deprecated'];

function getSkillDirs(category) {
  const categoryPath = join(ROOT, 'skills', category);
  if (!existsSync(categoryPath)) return [];
  return readdirSync(categoryPath, { withFileTypes: true })
    .filter(d => d.isDirectory() && existsSync(join(categoryPath, d.name, 'SKILL.md')))
    .map(d => d.name);
}

const pluginJson = JSON.parse(readFileSync(join(ROOT, '.claude-plugin', 'plugin.json'), 'utf8'));
const registeredSkills = new Set(pluginJson.skills);
const rootReadme = readFileSync(join(ROOT, 'README.md'), 'utf8');

const errors = [];

for (const category of PUBLIC_CATEGORIES) {
  for (const skill of getSkillDirs(category)) {
    const pluginPath = `./skills/${category}/${skill}`;
    if (!registeredSkills.has(pluginPath)) {
      errors.push(`Missing from .claude-plugin/plugin.json: ${pluginPath}`);
    }
    if (!rootReadme.includes(`skills/${category}/${skill}`)) {
      errors.push(`Missing from README.md: skills/${category}/${skill}`);
    }
  }
}

for (const category of EXCLUDED_CATEGORIES) {
  for (const skill of getSkillDirs(category)) {
    const pluginPath = `./skills/${category}/${skill}`;
    if (registeredSkills.has(pluginPath)) {
      errors.push(`Must not appear in plugin.json: ${pluginPath}`);
    }
    if (rootReadme.includes(`skills/${category}/${skill}`)) {
      errors.push(`Must not appear in README.md: skills/${category}/${skill}`);
    }
  }
}

for (const skillPath of registeredSkills) {
  if (!existsSync(join(ROOT, skillPath, 'SKILL.md'))) {
    errors.push(`plugin.json references missing skill: ${skillPath}`);
  }
}

if (errors.length > 0) {
  console.error('Skill validation failed:\n');
  errors.forEach(e => console.error(`  ✗ ${e}`));
  process.exit(1);
} else {
  console.log('✓ All skills are valid and properly registered.');
}
```

- [ ] **Step 3: Run the validator to confirm it passes on a clean repo**

```bash
node scripts/validate.mjs
```

Expected:
```
✓ All skills are valid and properly registered.
```

- [ ] **Step 4: Commit**

```bash
git add scripts/validate.mjs
git commit -m "feat: add skill validation script"
```

---

## Task 4: CI workflow

**Files:**
- Create: `.github/workflows/validate-skills.yml`

- [ ] **Step 1: Create the workflows directory**

```bash
mkdir -p .github/workflows
```

- [ ] **Step 2: Write `.github/workflows/validate-skills.yml`**

```yaml
name: Validate Skills

on:
  push:
  pull_request:

jobs:
  validate:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
      - name: Validate skill registry
        run: node scripts/validate.mjs
```

- [ ] **Step 3: Commit**

```bash
git add .github/workflows/validate-skills.yml
git commit -m "feat: add CI workflow to validate skill registry"
```

---

## Task 5: Skill template

**Files:**
- Create: `SKILL-TEMPLATE.md`

- [ ] **Step 1: Write `SKILL-TEMPLATE.md`**

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

- [ ] **Step 2: Commit**

```bash
git add SKILL-TEMPLATE.md
git commit -m "feat: add skill authoring template"
```

---

## Task 6: CLAUDE.md

**Files:**
- Create: `CLAUDE.md`

- [ ] **Step 1: Write `CLAUDE.md`**

```markdown
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
6. Run `node scripts/validate.mjs` to confirm — it must pass before committing
```

- [ ] **Step 2: Commit**

```bash
git add CLAUDE.md
git commit -m "feat: add CLAUDE.md with repo conventions"
```

---

## Task 7: Root README

**Files:**
- Create: `README.md`

- [ ] **Step 1: Write `README.md`**

```markdown
# mjannino/skills

Personal skills library for Claude Code, structured for deployment to [skills.sh](https://skills.sh).

## Install

```bash
npx skills@latest add mjannino/skills
```

## Skills

### Engineering

| Skill | Description |
|-------|-------------|
| *(none yet)* | |

### Productivity

| Skill | Description |
|-------|-------------|
| *(none yet)* | |

### Misc

| Skill | Description |
|-------|-------------|
| *(none yet)* | |

## Adding Skills

See [CLAUDE.md](CLAUDE.md) for conventions. Use [SKILL-TEMPLATE.md](SKILL-TEMPLATE.md) as the starting point.
```

- [ ] **Step 2: Run the validator to confirm it still passes**

```bash
node scripts/validate.mjs
```

Expected:
```
✓ All skills are valid and properly registered.
```

- [ ] **Step 3: Commit**

```bash
git add README.md
git commit -m "feat: add root README"
```
