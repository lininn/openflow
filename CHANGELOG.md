# Changelog

## Unreleased

## 0.4.2

- Clarified `/openflow init` documentation as project introduction, rules, and implementation constraints capture instead of a config-file operation.
- Reworked the OpenFlow workflow diagram layout so state routing, init, capture, handoff, amend, build, and close nodes no longer overlap.
- Regenerated the workflow PNG from the updated SVG.

## 0.4.1

- Added workflow-status module: programmatic status tracking, conflict detection, and dashboard rendering for active OpenSpec changes.
- Replaced simple file-existence status detection in `/openflow status` with a full dashboard showing phase, gates, tasks, blockers, conflicts, and next action.
- Updated `templates/SKILL.md` with status-first routing: read `workflow-status.md` before recommending next command; infer state from files when status file is missing; detect and warn on conflicts between status claims and actual files.
- Added `workflow-status.md` maintenance instructions to all 6 phase templates (proposal, brainstorming, spec, build, amend, close).
- Fixed `ensureOpenSpecProjectContext` being called unconditionally even when user skips OpenSpec initialization.
- Replaced fragile regex-based YAML key detection (`hasTopLevelKey`) with `yaml.parse()` from the existing `yaml` dependency.
- Unified `fs.existsSync` calls in `init.ts` to use project's `fileExists`/`dirExists` utilities.

## 0.4.0

- Added the optional `grill-me` gate to the OpenFlow proposal and brainstorming flow before spec generation.
- Prevented bare `/openflow` and direct `/openflow spec` from entering spec until the user chooses `grill-me` or explicitly skips it.
- Added regression coverage for generated OpenFlow skill instructions across supported tool targets.

## 0.3.4

- Synced OpenSpec `tasks.md` checkbox state during OpenFlow build and close so completed Superpowers plans no longer block archiving.
- Preserved close-phase archive dependency checks in generated Codex skills.
- Added regression coverage for generated Codex OpenFlow task-sync instructions.

## 0.3.3-beta.2

- Added close-phase archive dependency checks for changes that modify specs not yet present in `openspec/specs/`.
- Documented the prerequisite-change ordering path so OpenFlow records a blocker instead of attempting an invalid archive.

## 0.3.3-beta.1

- Added a Vitest-based test baseline for core utilities.
- Replaced shell-based file, directory, and command existence checks with native Node APIs.
- Added CI configuration for install, static check, build, and tests.
- Added source-tree artifact ignore rules for mistaken `src/**/*.js` and `src/**/*.d.ts` emissions.
- Removed the large inline `SKILL.md` fallback from skill generation in favor of explicit template files.
- Documented OpenSpec project conventions for future changes.
- Embedded workflow diagrams in the English and Chinese README files and included the diagram assets in the npm package.

## 0.3.2

- Current published baseline for the OpenSpec + Superpowers workflow orchestrator.
