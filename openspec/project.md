# Project Context

## Purpose
OpenFlow is a TypeScript CLI that generates OpenSpec + Superpowers workflow skills for AI coding tools. It coordinates requirement capture, spec generation, implementation planning, build execution, amend cycles, and close/archive workflows.

## Tech Stack
- TypeScript with strict checking
- Node.js ESM modules
- Commander for CLI commands
- Inquirer for interactive prompts
- Vitest for tests
- OpenSpec change/spec documents

## Project Conventions

### Code Style
- Keep modules small and focused under `src/cli`, `src/core`, and `src/utils`.
- Prefer Node native APIs over shell commands for filesystem and environment checks.
- Use ESM imports with explicit `.js` extensions in TypeScript source so compiled output runs under Node16 module resolution.
- Avoid new runtime dependencies unless they remove clear complexity or are explicitly approved.

### Architecture Patterns
- `src/cli/*` owns Commander command wiring and user-facing output flow.
- `src/core/*` owns workflow generation, dependency state, and durable business rules.
- `src/utils/*` owns small reusable runtime helpers.
- `templates/*` is the canonical source for generated skill content; source code must not duplicate full template bodies.
- OpenFlow phases are controlled through OpenSpec documents and `workflow-status.md`; build is the only phase that should modify implementation files.

### Testing Strategy
- Add regression tests before behavior-changing fixes.
- Use `npm test` for the full test suite and focused `npm test -- <path>` while iterating.
- Run `npm run lint`, `npm run build`, and `npm test` before declaring implementation complete.
- Keep production `tsc` output under `dist/`; test files are excluded from build output.

### Git Workflow
- Work on feature branches or worktrees, not directly on `main`/`master`.
- Keep diffs small and reviewable.
- Commit messages should follow the repository Lore Commit Protocol when creating commits.
- Do not commit generated `dist/` output unless the release process explicitly requires it.

## Domain Context
- OpenFlow bridges two workflow systems: OpenSpec for durable requirements and Superpowers for execution discipline.
- Generated skills support multiple AI coding tools, including Claude, Codex, Cursor, and OpenCode.
- Phase alias skills exist so tools with skill completion can discover individual OpenFlow phases.

## Important Constraints
- Do not change workflow phase semantics without an OpenSpec change.
- Amend/spec phases may update spec and plan documents only; implementation changes belong in build.
- Keep generated skill templates in sync across tool targets.
- Preserve graceful degradation when OpenSpec or Superpowers is unavailable.

## External Dependencies
- OpenSpec CLI (`openspec`) for change/spec validation and archive workflows.
- Superpowers writing-plans skill for detailed implementation plans when available.
- npm package publishing for `@lininn/openflow`.
