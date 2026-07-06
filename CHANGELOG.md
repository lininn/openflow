# Changelog

## Unreleased

## 0.5.0

- Fixed Superpowers plugin detection for OpenCode — corrected `TOOL_PATHS.opencode.skillsDir` from `.opencode/commands` to `.opencode/skills`, and added a bounded scan of the OpenCode package cache (`~/.cache/opencode/packages/superpowers@*/`) for `node_modules/superpowers/skills/writing-plans/SKILL.md`, covering both flat-npm and nested git-URL layouts. Resolves false "not installed" warnings under OpenCode (#19).
- Added regression coverage for both OpenCode cache layouts and the tool-selection guard.

## 0.4.6

- Fixed Superpowers plugin detection for Claude Code — `openflow init` now checks `installed_plugins.json` registry and `plugins/cache` directory, resolving false "not installed" warnings when Superpowers is installed as a plugin (#17).
- Narrowed OpenSpec init guard to `proposal` and `brainstorming` entry phases only; `grill`/`spec`/`amend`/`build`/`close` no longer trigger init prompts.
- Added `Grill decision` gate — capture phase is now `blocked` after proposal until the user explicitly skips or completes grill-me, preventing premature state transitions.
- Persisted artifact language in `openspec/config.yaml` via `language.artifacts` field with `inferred`/`user-confirmed`/`defaulted` detection source.
- Added delta structure self-check in spec/amend/close phases — new capabilities must use only `ADDED Requirements`; `MODIFIED`/`REMOVED`/`RENAMED` are rejected when the base spec does not exist.
- Added build-phase language review instructions to reject mixed Chinese/English Superpowers plan skeletons before implementation starts.

## 0.4.6-beta.0

- Added a language bridge from OpenFlow `plan-ready.md` to Superpowers `writing-plans`, so generated implementation plans must localize human-readable template headings for Chinese projects while preserving code identifiers, commands, paths, event names, and OpenSpec keywords.
- Added build-phase language review instructions to reject mixed Chinese/English Superpowers plan skeletons before implementation starts.

## 0.4.5

- Added GLM-5.2 sponsor section to English and Chinese READMEs with a clickable link to the iFlytek MaaS platform.
- Republished 0.4.4 changes (close-phase guard, init language persistence, grill-me capture block, skill template updates, regression coverage) to npm — 0.4.4 was not republishable due to a version collision.

## 0.4.4

- Prevented close phase from inheriting proposal-only guards, fixing an issue where archiving would incorrectly block on proposal-time constraints.
- Persisted artifact language for project initialization — `openspec init` now records the chosen language in `config.yaml` and reuses it on subsequent runs.
- Blocked capture phase for grill-me decision after brainstorming/proposal, preventing premature state transitions.
- Updated generated skill instructions (Codex, Claude, Cursor) with init-phase routing and close-phase guard awareness.
- Added regression coverage for init language scaffolding, skill generator guard propagation, and workflow status guard checks.

## 0.4.3

- Fixed README diagram links to use repository-local assets instead of pinned unpkg 0.4.1 URLs, so GitHub renders the current workflow diagram.

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
