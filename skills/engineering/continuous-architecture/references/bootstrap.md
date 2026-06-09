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
