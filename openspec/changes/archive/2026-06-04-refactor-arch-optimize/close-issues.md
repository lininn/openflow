## Close Issues

### 2026-06-04: Archive blocked by new spec delta shape

- Command: `openspec archive refactor-arch-optimize --yes`
- Result: failed before changing files.
- Evidence:
  - `project: target spec does not exist; only ADDED requirements are allowed for new specs.`
  - `Aborted. No files were changed.`
- Cause: `openspec/changes/refactor-arch-optimize/specs/project/spec.md` creates a new `project` spec but also contains a `## MODIFIED Requirements` section for `exec() Error Handling`.
- Required next step: run `/openflow amend` and convert the `exec() Error Handling` delta into an `ADDED Requirements` entry, or otherwise create/adjust the target spec so archive can apply cleanly.
