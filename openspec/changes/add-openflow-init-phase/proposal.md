## Why
Global OpenFlow skill installation does not initialize project-specific OpenSpec context. When users first run `/openflow proposal` in a business project, the workflow currently has to choose between blocking entirely or proceeding with generic prompts, neither of which captures project coding rules well.

A dedicated `/openflow init` phase gives users an AI-assisted project onboarding step that can inspect existing code, ask targeted questions, and write useful `openspec/config.yaml` context before proposals/specs/build consume it.

## What Changes
- Add `/openflow init` as a workflow phase alongside proposal/spec/build/close.
- Change missing-project-context behavior from a hard guard to an optional prompt: ask whether to run `/openflow init`; if skipped, continue the requested phase without `config.yaml` constraints.
- Define `/openflow init` as an interactive, non-implementation phase that may read project files and write only `openspec/config.yaml` plus normal OpenFlow project metadata.
- Support empty projects by asking for stack/rules explicitly and offering industry-standard defaults.
- Generate tool-visible aliases for `openflow-init` where phase aliases are supported.

## Impact
- Affected specs: project
- Affected code: `templates/SKILL.md`, new `templates/init.md`, phase generation in `src/core/skill-generator.ts`, tests for generated skills
- User-visible behavior: `/openflow proposal` no longer blocks on missing `openspec/config.yaml`; users can initialize context or skip it.
