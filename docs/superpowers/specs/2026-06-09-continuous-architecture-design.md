# Continuous Architecture (CA) — Skill Design

**Date:** 2026-06-09
**Scope:** Design for a single `/ca` skill that prevents architectural and pattern drift in large monoliths by maintaining colocated architectural reference files and checking changes against them.

---

## Goal

Keep engineers unburdened while keeping a large codebase architecturally healthy. CA gives any LLM agent the wherewithal to:
- Leave targeted, tightly scoped architectural references (`CARCH.md`) near the code they govern
- Check changes against those references before commit, catching drift early
- Ask the developer about intent when something new appears, and support deliberate pattern experimentation rather than blocking it

CA is modeled after CI/CD: lightweight, automatic, and continuous, rather than a periodic manual architecture review.

---

## Design Principles

- **LLM-agnostic.** All artifacts are plain markdown readable by any agent. No dependency on Claude Code-specific mechanisms beyond an optional CLAUDE.md invocation line.
- **Context-frugal.** References are sparse (one per meaningful subsystem boundary) and loaded only when relevant. The skill never bulk-loads architecture into context.
- **Unburdening over gatekeeping.** Clean commits produce one line of output. Experiments are supported, not blocked. Developers are never forced to run CA — the skill is made *aware* and proactive, not coercive.
- **Deterministic discovery, LLM judgment for application.** Which references to load is computed from the diff; how rules apply is the LLM's judgment.

---

## Single Skill, Three Modes

CA installs as one skill (`/ca`). The LLM selects a mode from context:

| Mode | Trigger |
|------|---------|
| Bootstrap | `/ca` run when no `CARCH.md` files exist in the repo |
| Check | Pre-commit (via CLAUDE.md instruction) or explicit `/ca` |
| Promote / Deprecate | `/ca promote` or `/ca deprecate` |

---

## Artifact: CARCH.md

Colocated markdown files placed at subsystem/module boundaries. The source of truth CA checks against.

### Standardized header

Every `CARCH.md` begins with:

```markdown
<!-- CA: Continuous Architecture reference. Managed by the /ca skill. Do not edit manually. -->
```

This makes the file self-documenting: any LLM (or human) reading it knows immediately what it is and what manages it, before reading a single pattern.

### Template

```markdown
<!-- CA: Continuous Architecture reference. Managed by the /ca skill. Do not edit manually. -->
# [Subsystem Name] Architecture

## Patterns

### [Pattern Name]
**Status:** established | experimental | deprecated
**Experiment ID:** exp-<readable-slug>-<YYYY-MM>   (experimental/deprecated entries only)
**Rule:** One prescriptive sentence — what must be done.
**Rationale:** Why this rule exists. Helps the LLM make judgment calls in ambiguous cases.
**Canonical ref:** `path/to/canonical_example.py`

## Anti-Patterns
- [What not to do] — one-line rationale.

## Pending Remediation   (present only during an active deprecation)
- [ ] `path/to/file.py` — replace experimental pattern with established pattern (canonical ref above)
```

### Naming and placement

- File name: `CARCH.md` (visible, first-class repo artifact — distinct enough from a hand-written `ARCH.md` to avoid confusion, reinforced by the header)
- One `CARCH.md` per meaningful subsystem boundary — a directory whose contents share a coherent architectural concern. Not per file, not per feature.
- A root-level `CARCH.md` holds cross-cutting concerns (service ownership, data-flow rules, non-negotiable global patterns).
- Covers both code-level patterns and high-level architecture. Primary job: prevent *accidental* introduction of new patterns.

### Experiment ID

Human-readable, greppable identifier (e.g. `exp-event-sourcing-2026-06`) assigned when an experimental pattern is established. Used to link the same experiment across horizontally-unrelated subsystems so deprecation can find every adopting site. Uniqueness is maintained by well-defined experiment names.

---

## Artifact: CLAUDE.md instruction

Bootstrap appends one line to the repo's `CLAUDE.md`:

> Run a CA check (`/ca`) before any commit.

This is the only CA content in `CLAUDE.md` — the invocation instruction, never architectural knowledge. It makes the check automatic for any LLM working in the repo without coercing the developer; `/ca` remains an explicit manual escape hatch.

---

## Mode 1: Bootstrap

Triggered when `/ca` runs and no `CARCH.md` files exist.

1. **Expertise callout.** Open with a clear warning: bootstrap requires someone with deep architectural knowledge of the codebase. If that is not the current developer, stop and return with the right person.
2. **Informed scan.** The LLM scans the directory tree and existing code to form a *proposed* subsystem map — candidate boundaries identified by surface area, distinct concerns, and visible pattern clusters.
3. **Validate the map.** Present the proposed map to the expert for correction before asking questions. (Reading first keeps the questions informed and reduces token usage versus narrating from zero.)
4. **Per-subsystem questionnaire**, one subsystem at a time:
   - What are the dominant patterns here?
   - Are there non-negotiable rules?
   - What is the highest drift risk — what do developers most often get wrong?
   - Is there a canonical file that exemplifies correct usage?
5. **Draft and place.** For each answered subsystem, the LLM drafts a `CARCH.md` and places it at the appropriate boundary. Cross-cutting concerns go to a root-level `CARCH.md`.
6. **Coverage summary.** Close with a list of every `CARCH.md` created, the subsystems covered, and areas identified but skipped — an entry point for validating coverage.
7. **Install invocation line** in `CLAUDE.md`.

---

## Mode 2: Ongoing Check

Triggered automatically pre-commit (via CLAUDE.md) or explicitly via `/ca`.

### Reference discovery (deterministic)

1. Compute the change set: by default the diff between the merge-base with the default branch and the working tree (covering all branch changes, committed and uncommitted), so a pre-commit check sees everything the branch introduces. Run `git diff --name-only` (and `--name-status` to detect added paths) over that range.
2. For each changed file path, walk the directory tree from the file up to the repo root, collecting every `CARCH.md` in the ancestry chain.
3. Load those `CARCH.md` files. Discovery is algorithmic and repeatable; sparseness keeps the chain bounded (typically 1–3 files).
4. Then load the diff content and apply rules. **LLM judgment applies only to rule application, not discovery.**

For large diffs, process in subsystem chunks — one `CARCH.md` scope at a time — rather than all at once.

### Tier 1 — Explicit violations (hard)

The LLM checks the diff against declared rules in the loaded references. Anything that directly contradicts an established pattern is flagged, and the developer is directed to conform the code before committing. No question asked.

### Tier 2 — Coverage gaps (soft)

Anything in the diff not clearly covered by a loaded rule is surfaced as a candidate new pattern:

> This change introduces something not covered by existing architecture references: `[brief description]`. Is this intentional?

- **Unintentional** → the LLM identifies the closest established pattern and guides the developer to conform.
- **Intentional** → the LLM asks the developer to characterize intent (prototype | pattern experiment | new pattern needed) and documents it as an `experimental` entry with an experiment ID. Before creating a new experiment, the LLM scans existing `CARCH.md` files for active experiments and asks: *"Is this a new experiment or adoption of existing experiment `<id>`?"* — linking by ID when it is the latter.

**New-area detection (rolled into Tier 2):** when the vertical walk for a changed file finds *no* `CARCH.md` ancestor (a newly added directory with no coverage), Tier 2 surfaces:

> No architectural references cover this new area. Consider running `/ca` to anchor one.

Exploratory scanning happens only on new-folder detection — never on every check.

### Clean-pass output

```
Architecture check OK
```

No other output. One line confirms the skill ran and verified; nothing more.

---

## Mode 3: Experiment Lifecycle

### Passive surfacing

Whenever a Tier 1 walk loads a `CARCH.md` containing `experimental` entries, CA surfaces them once, non-blocking, before the check:

> This area has open architectural experiments: `[pattern name]` (`<intent>`). Consider `/ca promote` or `/ca deprecate` when ready.

### `/ca promote`

When an experiment graduates:
1. Confirm the pattern name and the `CARCH.md` it lives in.
2. Update status `experimental` → `established`.
3. Suggest other subsystems where the pattern should be adopted, based on similar code.
4. Flag existing code in the relevant subtree still following the old pattern as migration candidates.
5. Commit the `CARCH.md` update.

### `/ca deprecate`

When an experiment is abandoned — applies to all three intent types:
1. Update status → `deprecated`, with a brief note on why (institutional knowledge).
2. **Locate all instances across horizontal slices:** grep all `CARCH.md` files for the experiment ID to find every adopting subsystem, then within each, locate code following the experimental pattern.
3. **Enumerate explicitly** into a `## Pending Remediation` checklist inside the relevant `CARCH.md` file(s) — concrete files and locations, not a vague note. The CARCH file serves as working memory for this checklist.
4. **Guide remediation** toward the established pattern using the canonical ref as the target state.
5. **Verify** with a Tier 1 check on the changed files, confirming no experimental-pattern instances remain.
6. The checklist persists across CA checks until every item is cleared (it resurfaces on each walk that touches the area). When the last box is checked, CA removes the section.

This reframes deprecated experimental code as Tier 1 violations against the re-established pattern — the right framing, since the experiment is over and the old pattern is the rule again.

---

## Known Drift Gaps and Mitigations

| Gap | Mitigation |
|-----|------------|
| Unremediated files never touched again become permanent silent drift | The deprecation `## Pending Remediation` checklist is tracked in `CARCH.md` and resurfaces on every relevant check until cleared — not a one-time enumeration. |
| Horizontal (lateral) references invisible to the vertical walk | Steady-state checks are unaffected (changing a module loads its own CARCH via its vertical walk). The gap only opens during deprecation, closed by experiment-ID grep across all CARCH files. |
| New directories with no CARCH ancestor pass silently | Tier 2 new-area detection surfaces a coverage-gap prompt when the walk finds no ancestor. |
| Large diffs dilute LLM attention | Process large diffs in per-subsystem chunks scoped to one CARCH.md at a time. |

---

## Out of Scope

- Git pre-commit hooks or any non-LLM enforcement mechanism (CA assumes an LLM is always in the loop).
- A family of separate skills (single `/ca` skill with multiple functions, by design).
- Tagging or annotating source code directly (all CA state lives in `CARCH.md` files).
- Automated migration execution (CA guides and verifies remediation; the developer makes the changes).
