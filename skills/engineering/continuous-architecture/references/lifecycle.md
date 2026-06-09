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
