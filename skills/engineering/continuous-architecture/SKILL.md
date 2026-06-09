---
name: continuous-architecture
description: Use before committing changes in a large or monolithic codebase to prevent architectural and pattern drift. Checks the diff against colocated CARCH.md references, asks the developer about intent when a new pattern appears, and supports deliberate experiments. Also use to bootstrap CARCH.md references in a repo that has none, or to promote/deprecate an architectural experiment via /ca promote or /ca deprecate.
---

# Continuous Architecture (CA)

Modeled after CI/CD: a lightweight, continuous architectural check rather than a periodic manual review. CA keeps a large codebase healthy by leaving tightly scoped architectural references (`CARCH.md`) near the code they govern, then checking changes against them before commit — catching drift early while keeping engineers unburdened.

Invoked as `/ca` — the shorthand for the `continuous-architecture` skill. `/ca promote` and `/ca deprecate` are the same skill entered in Lifecycle mode.

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

A human-readable, greppable identifier (e.g. `exp-event-sourcing-2026-06`) assigned when an experimental pattern is established. It links the same experiment across horizontally-unrelated subsystems so deprecation can find every adopting site. Uniqueness is maintained by well-defined experiment names. Deprecation finds adopters by grepping for the full ID string literally (e.g. `grep -rl "exp-event-sourcing-2026-06"`), so the exact token must be reused verbatim wherever the experiment is adopted — the `-YYYY-MM` suffix is part of the literal token, not a parsed field.

## Reference Discovery (shared by Check and Lifecycle)

1. Compute the change set: by default the diff between the merge-base with the default branch and the working tree (committed and uncommitted), so a pre-commit check sees everything the branch introduces.
2. Run `git diff --name-only $(git merge-base HEAD <default-branch>)` for changed paths and `git diff --name-status $(git merge-base HEAD <default-branch>)` to detect added paths. (Diffing against the merge-base with no `..`/`...` includes both committed and uncommitted changes.)
3. For each changed file path, walk the directory tree from the file up to the repo root, collecting every `CARCH.md` in the ancestry chain.
4. Load those `CARCH.md` files (sparseness keeps the chain bounded — typically 1–3 files), then load the diff content and apply rules.
5. For large diffs, process in per-subsystem chunks — one `CARCH.md` scope at a time — rather than all at once.

## Process: Mode Selection

Determine the mode from context, then follow the matching reference file:

- **No `CARCH.md` files exist anywhere in the repo** → Bootstrap mode. Read `references/bootstrap.md`.
- **A change set exists and references are present (pre-commit or explicit `/ca`)** → Check mode. Read `references/check.md`.
- **Developer invokes `/ca promote` or `/ca deprecate`, or asks to graduate/abandon an experiment** → Lifecycle mode. Read `references/lifecycle.md`.

When unsure which mode applies, ask the developer one clarifying question before proceeding.
