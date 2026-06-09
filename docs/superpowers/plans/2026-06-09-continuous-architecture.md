# Continuous Architecture (CA) Skill Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Author the `continuous-architecture` skill — a single `/ca` skill with three modes (bootstrap, check, promote/deprecate) that prevents architectural drift via colocated `CARCH.md` references — and register it in the repo so CI passes.

**Architecture:** A `SKILL.md` entry point holds the shared, always-relevant material (When to Use, Key Principles, CARCH.md format, the deterministic discovery algorithm, mode routing). Three reference files under `references/` hold the mode-specific detail, loaded on demand — mirroring CA's own context-frugal philosophy. Registration updates `plugin.json`, the root `README.md`, and `skills/engineering/README.md`, validated by `scripts/validate.mjs`.

**Tech Stack:** Markdown (skill content), Node.js (`scripts/validate.mjs` for validation), git.

**Note on verification:** This plan authors prose, not code. "Verification" means structural checks — frontmatter parses, required sections exist, and `node scripts/validate.mjs` passes after registration. There is no unit-test loop.

---

## Pre-step: Commit the plan

- [ ] **Commit this plan document before beginning execution**

```bash
git add docs/superpowers/plans/2026-06-09-continuous-architecture.md
git commit -m "docs: add Continuous Architecture implementation plan"
```

---

## Task 1: Skill entry point (SKILL.md)

**Files:**
- Create: `skills/engineering/continuous-architecture/SKILL.md`

- [ ] **Step 1: Create the skill directory**

```bash
mkdir -p skills/engineering/continuous-architecture/references
```

- [ ] **Step 2: Write `skills/engineering/continuous-architecture/SKILL.md`**

````markdown
---
name: continuous-architecture
description: Use before committing changes in a large or monolithic codebase to prevent architectural and pattern drift. Checks the diff against colocated CARCH.md references, asks the developer about intent when a new pattern appears, and supports deliberate experiments. Also use to bootstrap CARCH.md references in a repo that has none, or to promote/deprecate an architectural experiment via /ca promote or /ca deprecate.
---

# Continuous Architecture (CA)

Modeled after CI/CD: a lightweight, continuous architectural check rather than a periodic manual review. CA keeps a large codebase healthy by leaving tightly scoped architectural references (`CARCH.md`) near the code they govern, then checking changes against them before commit — catching drift early while keeping engineers unburdened.

## When to Use

- **Before any commit** — run a drift check on the pending changes (this is the default mode).
- **First time in a repo with no `CARCH.md` files** — run bootstrap to anchor references.
- **Graduating or abandoning an experiment** — run `/ca promote` or `/ca deprecate`.

CA is never coercive. A clean check emits a single line. Experiments are supported, not blocked.

## Key Principles

1. **Context-frugal.** Load only the `CARCH.md` files the change actually implicates. Never bulk-load architecture into context. References are sparse by design — one per meaningful subsystem boundary.
2. **Deterministic discovery, LLM judgment for application.** Which references to load is computed from the diff (the vertical walk below), not guessed. How rules apply to the diff is your judgment.
3. **When in doubt, zoom out.** If a change spans multiple subsystems, touches shared infrastructure, or introduces something with no clear local precedent, walk all the way up and load the root `CARCH.md`. Prefer loading one reference too many over missing a cross-cutting rule.
4. **Unburden, don't gatekeep.** Hard violations are surfaced directly. Genuinely new patterns are met with a question about intent, not a block. The developer always decides.
5. **Drift-gap awareness.** Diff-based checking has known blind spots — stay alert to them: unremediated deprecation instances (tracked via the remediation checklist), horizontally-scattered experiment adopters (found via experiment-ID grep at deprecation time), newly added directories with no coverage (flagged via Tier 2), and large diffs that dilute attention (process in per-subsystem chunks).
6. **`CARCH.md` is the only state.** All architectural knowledge lives in `CARCH.md` files. Agent-instruction files hold only the invocation line; source code is never annotated.

## The CARCH.md Artifact

Colocated markdown placed at subsystem/module boundaries — the source of truth CA checks against. Covers both code-level patterns and high-level architecture. Its primary job is to prevent the *accidental* introduction of new patterns.

### Standardized header

Every `CARCH.md` begins with exactly this line, so any agent or human knows what the file is before reading a single pattern:

```markdown
<!-- CA: Continuous Architecture reference. Managed by the /ca skill. Do not edit manually. -->
```

### Template

```markdown
<!-- CA: Continuous Architecture reference. Managed by the /ca skill. Do not edit manually. -->
# [Subsystem Name] Architecture

## Patterns

### [Pattern Name]
**Status:** established | experimental | deprecated
**Experiment ID:** exp-<readable-slug>-<YYYY-MM>   (experimental/deprecated entries only)
**Rule:** One prescriptive sentence — what must be done.
**Rationale:** Why this rule exists. Helps make judgment calls in ambiguous cases.
**Canonical ref:** `path/to/canonical_example.py`

## Anti-Patterns
- [What not to do] — one-line rationale.

## Pending Remediation   (present only during an active deprecation)
- [ ] `path/to/file.py` — replace experimental pattern with established pattern (canonical ref above)
```

### Naming and placement

- File name is always `CARCH.md` (visible, first-class artifact; the header removes any ambiguity with a hand-written `ARCH.md`).
- One `CARCH.md` per meaningful subsystem boundary — a directory whose contents share a coherent architectural concern. Never per file or per feature.
- A root-level `CARCH.md` holds cross-cutting concerns (service ownership, data-flow rules, non-negotiable global patterns).

### Experiment ID

A human-readable, greppable identifier (e.g. `exp-event-sourcing-2026-06`) assigned when an experimental pattern is established. It links the same experiment across horizontally-unrelated subsystems so deprecation can find every adopting site. Uniqueness is maintained by well-defined experiment names.

## Reference Discovery (shared by Check and Lifecycle)

Discovery is algorithmic and repeatable. Application of the loaded rules is your judgment.

1. Compute the change set: by default the diff between the merge-base with the default branch and the working tree (committed and uncommitted), so a pre-commit check sees everything the branch introduces.
2. Run `git diff --name-only <merge-base>...` for changed paths and `git diff --name-status <merge-base>...` to detect added paths.
3. For each changed file path, walk the directory tree from the file up to the repo root, collecting every `CARCH.md` in the ancestry chain.
4. Load those `CARCH.md` files (sparseness keeps the chain bounded — typically 1–3 files), then load the diff content and apply rules.
5. For large diffs, process in per-subsystem chunks — one `CARCH.md` scope at a time — rather than all at once.

## Process: Mode Selection

Determine the mode from context, then follow the matching reference file:

- **No `CARCH.md` files exist anywhere in the repo** → Bootstrap mode. Read `references/bootstrap.md`.
- **A change set exists and references are present (pre-commit or explicit `/ca`)** → Check mode. Read `references/check.md`.
- **Developer invokes `/ca promote` or `/ca deprecate`, or asks to graduate/abandon an experiment** → Lifecycle mode. Read `references/lifecycle.md`.

When unsure which mode applies, ask the developer one clarifying question before proceeding.
````

- [ ] **Step 3: Verify frontmatter parses and required sections exist**

Run:
```bash
head -1 skills/engineering/continuous-architecture/SKILL.md
grep -c '^## ' skills/engineering/continuous-architecture/SKILL.md
```
Expected: first line is `---`; section count is `5` or more (When to Use, Key Principles, The CARCH.md Artifact, Reference Discovery, Process).

- [ ] **Step 4: Commit**

```bash
git add skills/engineering/continuous-architecture/SKILL.md
git commit -m "feat: add continuous-architecture skill entry point"
```

---

## Task 2: Bootstrap reference

**Files:**
- Create: `skills/engineering/continuous-architecture/references/bootstrap.md`

- [ ] **Step 1: Write `skills/engineering/continuous-architecture/references/bootstrap.md`**

````markdown
# CA Bootstrap Mode

Triggered when `/ca` runs and **no `CARCH.md` files exist** anywhere in the repo. Bootstrap anchors the initial set of references.

## 0. Expertise callout (do this first, every time)

Open with a clear warning, verbatim in intent:

> Bootstrapping CA requires someone with deep architectural knowledge of this codebase. The references created now become the source of truth every future check relies on. If that is not you right now, stop and return with the right person.

Wait for the developer to confirm they are the right person before continuing.

## 1. Informed scan

Scan the directory tree and existing code to form a *proposed* subsystem map. Identify candidate boundaries by:
- Significant surface area (directories with many files / much code)
- Distinct concerns (a directory whose contents share one architectural purpose)
- Visible pattern clusters (repeated structures: services, repositories, workers, routers, etc.)

Do not write any files yet.

## 2. Validate the map

Present the proposed subsystem map to the expert and ask them to correct it — add missing boundaries, remove spurious ones, merge or split. Reading first keeps the questions informed and saves tokens versus narrating from zero.

## 3. Per-subsystem questionnaire

For each confirmed subsystem, ask these questions one subsystem at a time (not all subsystems at once):

1. What are the dominant patterns here?
2. Are there any non-negotiable rules in this area?
3. What is the highest drift risk — what do developers most often get wrong here?
4. Is there a canonical file that exemplifies correct usage?

## 4. Draft and place

For each answered subsystem, draft a `CARCH.md` using the template in `SKILL.md` and place it at that subsystem's directory boundary. Put cross-cutting concerns (global rules, service ownership, data-flow constraints) in a root-level `CARCH.md`. Every file gets the standardized header.

## 5. Coverage summary

Close bootstrap with a summary listing:
- Every `CARCH.md` created and the subsystem it covers
- Any areas you identified but the expert chose to skip (explicitly uncovered)

This gives the expert an entry point for validating coverage.

## 6. Install the invocation line

Detect which agent-instruction files the repo already uses and append the CA invocation line to **every one present**. If none exist, create `AGENTS.md` as the cross-agent default. Appends must be **idempotent** — if the line is already present in a file, leave that file untouched.

The line (identical across files):

> Run a CA check (`/ca`) before any commit — load the nearest `CARCH.md` references and verify the change does not introduce architectural drift.

This is the only CA content in any instruction file — the invocation instruction, never architectural knowledge.

### Per-harness instruction files

| Harness | Instruction file |
|---------|------------------|
| Claude Code (Anthropic) | `CLAUDE.md` |
| OpenAI Codex / Codex CLI | `AGENTS.md` |
| Gemini CLI (Google) | `GEMINI.md` |
| GitHub Copilot | `.github/copilot-instructions.md` |
| Cursor | `.cursor/rules/ca.mdc` (legacy: `.cursorrules`) |
| Windsurf | `.windsurf/rules/ca.md` (legacy: `.windsurfrules`) |
| Cline | `.clinerules/ca.md` (file or directory form) |
| Cross-agent standard / fallback | `AGENTS.md` |

For Cursor and Windsurf, write the line inside the harness's rule-file wrapper convention; elsewhere append a plain markdown line.
````

- [ ] **Step 2: Verify the per-harness table is present**

Run:
```bash
grep -c 'CLAUDE.md\|AGENTS.md\|GEMINI.md\|copilot-instructions\|cursor\|windsurf\|clinerules' skills/engineering/continuous-architecture/references/bootstrap.md
```
Expected: a count of `7` or more (the table rows reference these).

- [ ] **Step 3: Commit**

```bash
git add skills/engineering/continuous-architecture/references/bootstrap.md
git commit -m "feat: add CA bootstrap reference"
```

---

## Task 3: Check reference

**Files:**
- Create: `skills/engineering/continuous-architecture/references/check.md`

- [ ] **Step 1: Write `skills/engineering/continuous-architecture/references/check.md`**

````markdown
# CA Check Mode

Triggered automatically pre-commit (via the agent-instruction line) or explicitly via `/ca`. First perform Reference Discovery (see `SKILL.md`), then run the two-tier check on the loaded references.

Before checking, if any loaded `CARCH.md` contains `experimental` entries, surface them once (non-blocking) — see `references/lifecycle.md`, "Passive surfacing."

## Tier 1 — Explicit violations (hard)

Check the diff against the declared rules in the loaded references. Flag anything that **directly contradicts an established pattern**. Direct the developer to conform the code before committing. No question is asked for a Tier 1 violation — an established rule is a rule.

When reporting a violation, cite:
- The rule it violates and the `CARCH.md` it came from
- The offending location in the diff
- The canonical ref as the target state

## Tier 2 — Coverage gaps (soft)

Anything in the diff **not clearly covered** by a loaded rule is surfaced as a candidate new pattern. Ask the developer exactly one question:

> This change introduces something not covered by existing architecture references: `[brief description]`. Is this intentional?

**If unintentional** → identify the closest established pattern (from the loaded references) and guide the developer to conform the code to it.

**If intentional** → ask the developer to characterize intent:
- **Prototype** — experimental, not intended to spread.
- **Pattern experiment** — testing whether this could replace an existing pattern.
- **New pattern needed** — filling a genuine gap.

Then document it as an `experimental` entry in the relevant `CARCH.md`, with an experiment ID. **Before creating a new experiment, scan existing `CARCH.md` files for active experiments** and ask:

> Is this a new experiment, or adoption of existing experiment `<id>`?

If it is adoption, add an entry in this subsystem's `CARCH.md` carrying the **same experiment ID** (linked, not duplicated). This is what makes horizontal deprecation possible later.

## New-area detection (part of Tier 2)

When the vertical walk for a changed file finds **no `CARCH.md` ancestor** (a newly added directory with no coverage), surface:

> No architectural references cover this new area. Consider running `/ca` to anchor one.

Exploratory scanning happens **only** on this new-folder detection — never on every check.

## Clean-pass output

When Tier 1 finds no violations and Tier 2 finds no gaps, output exactly one line and nothing else:

```
Architecture check OK
```

This confirms the skill ran and verified, with zero friction on clean work.
````

- [ ] **Step 2: Verify both tiers and the clean-pass line are present**

Run:
```bash
grep -c 'Tier 1\|Tier 2\|Architecture check OK' skills/engineering/continuous-architecture/references/check.md
```
Expected: a count of `3` or more.

- [ ] **Step 3: Commit**

```bash
git add skills/engineering/continuous-architecture/references/check.md
git commit -m "feat: add CA check reference"
```

---

## Task 4: Lifecycle reference

**Files:**
- Create: `skills/engineering/continuous-architecture/references/lifecycle.md`

- [ ] **Step 1: Write `skills/engineering/continuous-architecture/references/lifecycle.md`**

````markdown
# CA Experiment Lifecycle Mode

Covers passive surfacing of open experiments, `/ca promote`, and `/ca deprecate`.

## Passive surfacing

Whenever a Check-mode walk loads a `CARCH.md` containing `experimental` entries, surface them once, non-blocking, before running the check:

> This area has open architectural experiments: `[pattern name]` (`<intent>`). Consider `/ca promote` or `/ca deprecate` when ready.

One line per area. Never blocks the developer's work.

## /ca promote

Invoked when an experiment graduates to an established pattern:

1. Confirm the pattern name and the `CARCH.md` it lives in.
2. Update its status from `experimental` to `established` (remove the experiment ID field once established, or leave it as historical record — your call, but be consistent within a repo).
3. Suggest other subsystems where the pattern should now be adopted, based on similar code.
4. Flag existing code in the relevant subtree still following the old pattern as migration candidates.
5. Commit the `CARCH.md` update.

## /ca deprecate

Invoked when an experiment is abandoned. Applies identically to all three intent types (prototype, pattern experiment, new pattern needed). **Abandoning an experiment requires a code change to enforce the codebase back to the established pattern — deprecation is not complete until every adopting instance is remediated.**

1. **Update status** → `deprecated` in the experiment's home `CARCH.md`, with a brief note on why it was abandoned (institutional knowledge).
2. **Locate all instances across horizontal slices.** Grep every `CARCH.md` in the repo for the experiment ID to find every adopting subsystem:
   ```bash
   grep -rl "exp-<readable-slug>-<YYYY-MM>" --include=CARCH.md .
   ```
   Then within each adopting subsystem, locate the code following the experimental pattern (use the entry's canonical ref and scope note as the guide).
3. **Enumerate explicitly** into a `## Pending Remediation` checklist inside each relevant `CARCH.md` — concrete files and locations, not a vague note. The `CARCH.md` file serves as the working memory for this checklist.
4. **Guide remediation** toward the established pattern, using its canonical ref as the target state.
5. **Verify** with a Tier 1 check on the changed files, confirming no instances of the experimental pattern remain.
6. **Persist the checklist across checks.** The `## Pending Remediation` section resurfaces on every Check-mode walk that touches the area until every box is cleared. When the last box is checked, remove the section.

Deprecated experimental code is, in effect, a set of Tier 1 violations against the re-established pattern — that is the correct framing once the experiment is over.

## Why the experiment ID matters here

The vertical walk only finds references in a changed file's ancestry. Experiment adopters can be scattered across horizontally-unrelated subtrees that no single walk would reach. The shared, greppable experiment ID is what lets deprecation find them all. This is why Check mode links adopters to the same ID at the moment a pattern is adopted (see `references/check.md`).
````

- [ ] **Step 2: Verify promote, deprecate, and the experiment-ID grep are present**

Run:
```bash
grep -c '/ca promote\|/ca deprecate\|Pending Remediation\|grep -rl' skills/engineering/continuous-architecture/references/lifecycle.md
```
Expected: a count of `4` or more.

- [ ] **Step 3: Commit**

```bash
git add skills/engineering/continuous-architecture/references/lifecycle.md
git commit -m "feat: add CA experiment-lifecycle reference"
```

---

## Task 5: Register the skill and validate

**Files:**
- Modify: `.claude-plugin/plugin.json`
- Modify: `README.md`
- Modify: `skills/engineering/README.md`

- [ ] **Step 1: Add the skill to `.claude-plugin/plugin.json`**

Replace the file contents with:

```json
{
  "name": "mjannino-skills",
  "skills": [
    "./skills/engineering/continuous-architecture"
  ]
}
```

- [ ] **Step 2: Add the skill row to the root `README.md` Engineering table**

In `README.md`, replace this block:

```markdown
### Engineering

| Skill | Description |
|-------|-------------|
| *(none yet)* | |
```

with:

```markdown
### Engineering

| Skill | Description |
|-------|-------------|
| [continuous-architecture](skills/engineering/continuous-architecture/SKILL.md) | Prevent architectural and pattern drift in large codebases via colocated CARCH.md references checked before commit. |
```

- [ ] **Step 3: Add the skill row to `skills/engineering/README.md`**

In `skills/engineering/README.md`, replace this block:

```markdown
| Skill | Description |
|-------|-------------|
| *(none yet)* | |
```

with:

```markdown
| Skill | Description |
|-------|-------------|
| [continuous-architecture](continuous-architecture/SKILL.md) | Prevent architectural and pattern drift in large codebases via colocated CARCH.md references checked before commit. |
```

- [ ] **Step 4: Run the validator to confirm the registry is in sync**

Run:
```bash
node scripts/validate.mjs
```
Expected:
```
✓ All skills are valid and properly registered.
```

- [ ] **Step 5: Commit**

```bash
git add .claude-plugin/plugin.json README.md skills/engineering/README.md
git commit -m "feat: register continuous-architecture skill"
```

---

## Task 6: Final verification

- [ ] **Step 1: Confirm the full skill structure exists**

Run:
```bash
find skills/engineering/continuous-architecture -type f | sort
```
Expected:
```
skills/engineering/continuous-architecture/SKILL.md
skills/engineering/continuous-architecture/references/bootstrap.md
skills/engineering/continuous-architecture/references/check.md
skills/engineering/continuous-architecture/references/lifecycle.md
```

- [ ] **Step 2: Confirm validation passes and the tree is clean**

Run:
```bash
node scripts/validate.mjs && git status
```
Expected: `✓ All skills are valid and properly registered.` and `nothing to commit, working tree clean`.
