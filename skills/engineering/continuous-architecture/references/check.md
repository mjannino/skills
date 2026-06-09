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
