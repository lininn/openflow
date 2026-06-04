# OpenFlow Workflow Status Design

## Purpose

OpenFlow currently has clear phase boundaries, but task progress is mostly inferred from files and checkbox completion. This design adds a unified workflow status layer so users and agents can see the active change, current phase, gate progress, task state, blockers, verification evidence, and next action.

## Goals

- Preserve the existing `/openflow proposal`, `/openflow brainstorming`, `/openflow spec`, `/openflow build`, `/openflow amend`, and `/openflow close` commands.
- Support both lightweight and deep requirement capture as valid starting points.
- Add a single navigation status file per active change.
- Make `/openflow` produce a clear dashboard before recommending the next command.
- Track task states beyond unchecked/checked boxes.
- Detect and report conflicts between status metadata and actual files.

## Non-Goals

- Replace OpenSpec documents as the source of requirements or specs.
- Replace Superpowers implementation plans as the source of execution detail.
- Introduce a separate database, daemon, or external state store.
- Force every small task into a heavy workflow.

## Architecture

Each active change may include a `workflow-status.md` file:

```text
openspec/changes/<change-id>/
├── proposal.md
├── design.md
├── tasks.md
├── plan-ready.md
├── workflow-status.md
├── close-issues.md
└── specs/
```

Source responsibilities:

- `proposal.md`: problem, motivation, requested change.
- `design.md`: technical decisions and trade-offs.
- `tasks.md`: OpenSpec-level implementation checklist.
- `plan-ready.md`: translation into Superpowers-ready execution steps.
- `workflow-status.md`: navigation state, gates, task states, blockers, verification evidence, and next action.
- `docs/superpowers/plans/*.md`: implementation execution plans.

`workflow-status.md` is a navigation source of truth. Requirements and behavior remain in OpenSpec files. Implementation details remain in Superpowers plans.

## Capture Entry Model

The workflow has two valid capture entries:

```text
capture
├── proposal       lightweight requirement capture
└── brainstorming  deep discovery and design exploration
      ↓
spec
      ↓
build
      ↓
close
      ↓
archived
```

`workflow-status.md` records this as:

```md
- Phase: capture
- Capture Mode: proposal | brainstorming
```

`proposal` and `brainstorming` both produce `proposal.md` and initialize workflow state. `brainstorming` may also seed technical decisions for the later spec stage.

## Status File Format

Recommended template:

```md
# Workflow Status: <change-id>

## Summary

- Phase: capture | spec | build | close | archived
- Capture Mode: proposal | brainstorming | none
- Status: pending | in_progress | blocked | ready_for_next_phase | completed
- Last Updated: YYYY-MM-DD
- Next Command: /openflow spec
- Next Action: Generate OpenSpec specs, tasks, and plan-ready.md.

## Gates

| Gate | Status | Evidence |
|------|--------|----------|
| Requirements captured | passed | proposal.md |
| Specs validated | pending | - |
| Plan ready | pending | - |
| Implementation complete | pending | - |
| Verification complete | pending | - |
| Archived | pending | - |

## Tasks

| ID | Task | Status | Verification | Blocked By | Notes |
|----|------|--------|--------------|------------|-------|
| 1.1 | Example task | pending | - | - | - |

## Amendments

| Date | Reason | Affected Specs | Affected Tasks | Status |
|------|--------|----------------|----------------|--------|
```

## Phase Values

- `capture`: requirements are being captured through proposal or brainstorming.
- `spec`: OpenSpec files and `plan-ready.md` are being generated or validated.
- `build`: implementation is in progress.
- `close`: consistency verification and archive are in progress.
- `archived`: the change has been verified and archived.

## Task Status Values

- `pending`: not started.
- `in_progress`: actively being worked on.
- `blocked`: cannot continue until a dependency or decision is resolved.
- `implemented`: code or document changes are written, but verification is not complete.
- `verified`: verification passed, but the task is not yet closed.
- `done`: task is complete and closed.
- `superseded`: task was replaced by an amendment or a later decision.
- `failed`: verification failed and follow-up work is required.

## Gate Status Values

- `pending`: not yet satisfied.
- `passed`: satisfied with evidence.
- `failed`: attempted and failed.
- `blocked`: cannot be evaluated yet.
- `not_applicable`: not required for this change.

## Stage Behavior

### Proposal

When `/openflow proposal` completes requirement capture:

- Create or update `proposal.md`.
- Create `workflow-status.md` if missing.
- Set `Phase: capture`.
- Set `Capture Mode: proposal`.
- Set `Status: ready_for_next_phase`.
- Set `Next Command: /openflow spec`.
- Mark `Requirements captured` as `passed` with `proposal.md` evidence.
- Initialize task rows as `pending` if tasks are known.

### Brainstorming

When `/openflow brainstorming` completes discovery:

- Create or update `proposal.md` with background, options, trade-offs, and chosen direction.
- Create `workflow-status.md` if missing.
- Set `Phase: capture`.
- Set `Capture Mode: brainstorming`.
- Set `Status: ready_for_next_phase`.
- Set `Next Command: /openflow spec`.
- Mark `Requirements captured` as `passed` with `proposal.md` evidence.

### Spec

When `/openflow spec` starts:

- Set `Phase: spec`.
- Set `Status: in_progress`.

When it completes:

- Generate or update `design.md`, `specs/**/spec.md`, `tasks.md`, and `plan-ready.md`.
- Run `openspec validate <change-id> --strict` when available.
- Set `Specs validated` to `passed` with validation evidence.
- Set `Plan ready` to `passed` with `plan-ready.md` evidence.
- Sync task rows from `tasks.md` into `workflow-status.md` without overwriting existing non-pending statuses unless the task identity changed.
- Set `Status: ready_for_next_phase`.
- Set `Next Command: /openflow build`.

### Build

When `/openflow build` starts:

- Set `Phase: build`.
- Set `Status: in_progress`.
- Set `Next Command: /openflow build`.

During execution:

- Set a task to `in_progress` when work starts.
- Set it to `implemented` when code changes are written but not verified.
- Set it to `verified` when tests or checks pass.
- Set it to `done` when the task is closed.
- Set it to `blocked` with `Blocked By` and `Notes` when progress requires another task, user decision, or amend.
- Set it to `failed` when verification fails and follow-up work is required.

When all tasks are complete:

- Require all task rows to be `done` or `superseded`.
- Set `Implementation complete` to `passed`.
- Set `Status: ready_for_next_phase`.
- Set `Next Command: /openflow close`.

### Amend

`amend` is a controlled correction path, not a primary phase.

When requirements, specs, acceptance criteria, or boundaries change:

- Keep the current phase context.
- Set `Status: blocked` while amendment is needed.
- Set `Next Command: /openflow amend`.
- Append an `Amendments` row with reason, affected specs, affected tasks, and status.

When amend completes:

- Update OpenSpec documents.
- Regenerate or update `plan-ready.md`.
- Append new task rows.
- Mark replaced tasks as `superseded`.
- Restore the previous phase, usually `build`.
- Set `Next Command: /openflow build`.

### Close

When `/openflow close` starts:

- Set `Phase: close`.
- Set `Status: in_progress`.

During verification:

- Check design decisions against code.
- Check spec deltas against implementation.
- Record inconsistencies in `close-issues.md`.

If inconsistencies exist:

- Set `Verification complete` to `failed` with `close-issues.md` evidence.
- Set `Status: blocked`.
- Set `Next Command: /openflow amend`.

If verification passes:

- Set `Verification complete` to `passed`.
- Run `openspec validate <change-id> --strict` when available.
- Archive the change.
- Set `Archived` to `passed`.
- Set `Phase: archived`.
- Set `Status: completed`.

## Dashboard Behavior

When the user runs `/openflow` without a subcommand, OpenFlow should first show a dashboard instead of immediately executing a phase.

Example:

```text
OpenFlow Status

Change: refactor-arch-optimize
Phase: capture
Capture Mode: proposal
Status: ready_for_next_phase

Gates:
✓ Requirements captured      proposal.md
• Specs validated            pending
• Plan ready                 pending
• Implementation complete    pending
• Verification complete      pending
• Archived                   pending

Tasks:
pending       9
in_progress   0
blocked       0
implemented   0
verified      0
done          0
failed        0
superseded    0

Next:
Run /openflow spec to generate specs, tasks, and plan-ready.md.
```

The dashboard should include:

- Active change id.
- Phase and capture mode.
- Overall status.
- Gate table.
- Task counts by status.
- Blockers, if any.
- Recommended next command and action.
- Status/file conflicts, if any.

## Missing Status File Handling

Existing changes may not have `workflow-status.md`. When `/openflow` finds an active change without a status file, it should synthesize a read-only dashboard from existing files and recommend initialization.

Recommended behavior:

- If `proposal.md` exists and `plan-ready.md` is missing, infer `Phase: capture` and `Status: ready_for_next_phase`.
- If `plan-ready.md` exists and no implementation plan exists, infer `Phase: spec` and `Status: ready_for_next_phase`.
- If an implementation plan exists with incomplete checkboxes, infer `Phase: build` and `Status: in_progress`.
- If all implementation plan checkboxes are complete, infer `Phase: build` and `Status: ready_for_next_phase`.
- Offer to create `workflow-status.md` from the inferred state before making further workflow changes.

The inferred dashboard must be clearly labeled as inferred, not authoritative.

## Conflict Detection

OpenFlow should scan the filesystem and compare it with `workflow-status.md`.

Examples:

- `Plan ready` is `passed`, but `plan-ready.md` is missing.
- `Specs validated` is `passed`, but no `specs/**/spec.md` exists.
- `Implementation complete` is `passed`, but implementation plan checkboxes are incomplete.
- `Phase: archived`, but the change directory is still active.

Conflict output should be explicit:

```text
Warning: workflow-status.md says Plan ready = passed, but plan-ready.md is missing.
Recommended fix: run /openflow spec to regenerate plan-ready.md or amend the status.
```

The workflow should not silently overwrite user-visible state when a conflict is found.

## Completion Criteria

A change is complete only when:

1. All task rows are `done` or `superseded`.
2. Required gates are `passed` or `not_applicable`.
3. Close-stage consistency verification passes.
4. The OpenSpec change is archived.
5. `workflow-status.md` has `Phase: archived` and `Status: completed`.

## Rollout Plan

1. Add the `workflow-status.md` specification to OpenFlow docs and templates.
2. Update phase docs so proposal, brainstorming, spec, build, amend, and close maintain the status file.
3. Update `/openflow` state detection to read status, scan files, and render a dashboard.
4. Add conflict detection between status metadata and actual files.
5. Add tests or fixtures for dashboard rendering and status transitions.

## Risks and Mitigations

- Risk: status file becomes stale.
  - Mitigation: scan files and show conflicts before recommending actions.
- Risk: extra status tracking makes small changes heavy.
  - Mitigation: keep the file Markdown-based and initialize only essential fields.
- Risk: task identity changes cause status loss.
  - Mitigation: sync by stable task ID where possible and avoid overwriting non-pending statuses.
- Risk: agents treat workflow status as requirements truth.
  - Mitigation: document that requirements remain in OpenSpec files; status is navigation only.

## Approval Gate

Implementation should not begin until this design is reviewed and approved.
