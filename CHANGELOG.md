# Changelog

## Unreleased

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
