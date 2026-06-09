# CA Experiment Lifecycle Mode

Covers passive surfacing of open experiments, `/ca promote`, and `/ca deprecate`.

## Passive surfacing

Whenever a Check-mode walk loads a `CARCH.md` containing `experimental` entries, surface them once, non-blocking, before running the check:

> This area has open architectural experiments: `[pattern name]` (`<intent>`). Consider `/ca promote` or `/ca deprecate` when ready.

One line per area. Never blocks the developer's work.

## /ca promote

Invoked when an experiment graduates to an established pattern:

1. Confirm the pattern name and the `CARCH.md` it lives in.
2. Update its status from `experimental` to `established` and remove the experiment ID field — IDs belong only to `experimental`/`deprecated` entries. (If you want to preserve provenance, record the retired ID in a commit message rather than the entry.)
3. Suggest other subsystems where the pattern should now be adopted, based on similar code.
4. Flag existing code in the relevant subtree still following the old pattern as migration candidates.
5. Commit the `CARCH.md` update.

## /ca deprecate

Invoked when an experiment is abandoned. Applies identically to all three intent types (prototype, pattern experiment, new pattern needed). **Abandoning an experiment requires code changes to enforce the codebase back to the established pattern — deprecation is not complete until every adopting instance is remediated.** Drive this proactively across the subsystems located in step 2; the `## Pending Remediation` checklist (step 3) tracks the work until it is cleared, and as a backstop resurfaces on future checks that touch each area.

1. **Update status** → `deprecated` in the experiment's home `CARCH.md`, with a brief note on why it was abandoned (institutional knowledge).
2. **Locate all instances across horizontal slices.** Grep every `CARCH.md` in the repo for the experiment ID to find every adopting subsystem:
   ```bash
   grep -rl "exp-<readable-slug>-<YYYY-MM>" --include=CARCH.md .
   ```
   Then within each adopting subsystem, locate the code following the experimental pattern (use the entry's canonical ref and scope note as the guide). The grep finds only adopters that were ID-linked when the pattern was adopted (see Check mode); any code that copied the pattern without going through `/ca` will not be found by the grep and must be caught by ordinary Tier 1 checks as those files change — this is a known limitation of diff-based detection.
3. **Enumerate explicitly** into a `## Pending Remediation` checklist inside each relevant `CARCH.md` — concrete files and locations, not a vague note. The `CARCH.md` file serves as the working memory for this checklist.
4. **Guide remediation** toward the established pattern, using its canonical ref as the target state.
5. **Verify** that every item in the `## Pending Remediation` checklist (across all affected `CARCH.md` files) has been addressed, running a Tier 1 check on each remediated file to confirm no instances of the experimental pattern remain.
6. **Persist the checklist across checks.** The `## Pending Remediation` section resurfaces on every Check-mode walk that touches the area until every box is cleared. When the last box is checked, remove the section.

Deprecated experimental code is, in effect, a set of Tier 1 violations against the re-established pattern — that is the correct framing once the experiment is over.

## Why the experiment ID matters here

The vertical walk only finds references in a changed file's ancestry. Experiment adopters can be scattered across horizontally-unrelated subtrees that no single walk would reach. The shared, greppable experiment ID is what lets deprecation find them all. This is why Check mode links adopters to the same ID at the moment a pattern is adopted (see `references/check.md`).
