# Refactor Arch Optimize Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fix OpenFlow's verified engineering quality gaps: unsafe shell checks, missing tests, source artifact noise, CI/style checks, template fallback duplication, release notes, and stale workflow-status work.

**Architecture:** Keep runtime CLI behavior stable while adding a small test harness and replacing shell-based existence checks with Node native APIs. Tooling changes stay in dev dependencies and CI, and documentation/state files track completion through OpenFlow workflow status.

**Tech Stack:** TypeScript ESM, Node.js fs/path APIs, Commander CLI, npm scripts, Vitest or Node test runner, GitHub Actions, one formatter/linter tool.

---

## File Structure

- Modify: `package.json` - add test/style scripts and dev dependencies.
- Modify: `package-lock.json` - lock dependency changes.
- Modify: `tsconfig.json` - exclude tests from production build if needed.
- Modify: `src/utils/shell.ts` - replace shell checks with native APIs and expose detectable exec failure.
- Create: `src/utils/shell.test.ts` - regression tests for file/dir/cmd/exec behavior.
- Create or modify: `src/core/skill-generator.test.ts` - template generation regression tests.
- Modify: `.gitignore` - ignore mistaken `src/**/*.js` and `src/**/*.d.ts` emissions.
- Create: `.github/workflows/ci.yml` - run install/build/test/style checks.
- Modify: `package.json` - use `tsc --noEmit` as the deterministic static check without adding a formatter dependency.
- Modify: `src/core/skill-generator.ts` - remove large inline fallback and fail clearly when templates are missing.
- Create: `CHANGELOG.md` - user-visible release history.
- Modify: `openspec/project.md` - replace placeholder project conventions with real ones.
- Modify: `openspec/changes/refactor-arch-optimize/workflow-status.md` - synchronize task statuses.
- Modify: `openspec/changes/refactor-arch-optimize/tasks.md` - check completed tasks.
- Modify: `docs/superpowers/plans/2026-06-04-refactor-arch-optimize.md` - track this plan.

---

### Task 1: Test Harness And Shell Safety

**Files:**
- Modify: `package.json`
- Modify: `package-lock.json`
- Modify: `tsconfig.json`
- Modify: `src/utils/shell.ts`
- Create: `src/utils/shell.test.ts`
- Modify: `openspec/changes/refactor-arch-optimize/workflow-status.md`

- [x] **Step 1: Add test infrastructure**

Add an `npm test` script, install the test runner, and ensure production `tsc` excludes `src/**/*.test.ts`.

- [x] **Step 2: Write failing shell tests**

Create tests that assert:
- `fileExists()` returns true only for files.
- `dirExists()` returns true only for directories.
- paths containing spaces and shell metacharacters are handled literally.
- `cmdExists('node')` returns true.
- `cmdExists('definitely-not-openflow-command')` returns false.
- `exec()` exposes failure separately from successful empty stdout.

- [x] **Step 3: Run shell tests and verify RED**

Run `npm test -- src/utils/shell.test.ts`.

Expected before implementation: failure because `exec()` does not distinguish command failure from empty stdout and shell path checks mishandle special characters.

- [x] **Step 4: Implement native file/dir/cmd checks**

Use `fs.statSync()` for file/directory checks, search `PATH` for executable command names, and add an `execResult()` helper while preserving `exec()` compatibility.

- [x] **Step 5: Run focused tests and build**

Run `npm test -- src/utils/shell.test.ts` and `npm run build`.

Expected: tests pass and TypeScript build succeeds.

---

### Task 2: Build Artifact Hygiene

**Files:**
- Modify: `.gitignore`
- Remove untracked generated files: `src/**/*.js`, `src/**/*.d.ts`
- Modify: `openspec/changes/refactor-arch-optimize/workflow-status.md`

- [x] **Step 1: Ignore mistaken source emissions**

Add ignore rules for `src/**/*.js` and `src/**/*.d.ts`.

- [x] **Step 2: Remove existing untracked source emissions**

Delete current untracked generated files under `src/`.

- [x] **Step 3: Verify status is clean for source artifacts**

Run `git status --short` and confirm no `src/**/*.js` or `src/**/*.d.ts` entries remain.

---

### Task 3: Skill Generator Template Fallback

**Files:**
- Modify: `src/core/skill-generator.ts`
- Create or modify: `src/core/skill-generator.test.ts`
- Modify: `openspec/changes/refactor-arch-optimize/workflow-status.md`

- [x] **Step 1: Write failing template tests**

Assert that normal template files generate skills and that a missing template throws a clear error instead of silently using stale inline content.

- [x] **Step 2: Run focused tests and verify RED**

Run `npm test -- src/core/skill-generator.test.ts`.

Expected before implementation: missing-template test fails because inline fallback is still used.

- [x] **Step 3: Remove inline fallback**

Remove `getInlineTemplate()` and make missing templates throw a clear error naming the missing file.

- [x] **Step 4: Run focused tests and build**

Run `npm test -- src/core/skill-generator.test.ts` and `npm run build`.

---

### Task 4: CI And Style Automation

**Files:**
- Modify: `package.json`
- Modify: `package-lock.json`
- Create: `.github/workflows/ci.yml`
- Modify: `package.json`
- Modify: `openspec/changes/refactor-arch-optimize/workflow-status.md`

- [x] **Step 1: Add style scripts and config**

Configured `npm run lint` as `tsc --noEmit` to provide a deterministic static check without adding a new formatter dependency.

- [x] **Step 2: Add CI workflow**

Create a GitHub Actions workflow for `npm ci`, style check, `npm run build`, and `npm test`.

- [x] **Step 3: Verify local CI-equivalent commands**

Run style check, `npm run build`, and `npm test`.

---

### Task 5: Workflow Status Decision

**Files:**
- Inspect: `.worktrees/openflow-workflow-status`
- Modify: `src/cli/status.ts` and related files only if merging the draft is chosen
- Modify: `openspec/changes/refactor-arch-optimize/workflow-status.md`

- [x] **Step 1: Compare current main status command with worktree draft**

Inspect the draft files and decide whether to merge the complete model/tests or record the worktree as out-of-scope for this change.

- [x] **Step 2: Apply decision**

Decision: do not merge the 570-line workflow-status model and 797-line test draft in this safety/tooling pass; document it as a deferred feature so this change stays scoped.

---

### Task 6: Documentation And Release Notes

**Files:**
- Create: `CHANGELOG.md`
- Modify: `openspec/project.md`
- Modify: `openspec/changes/refactor-arch-optimize/tasks.md`
- Modify: `openspec/changes/refactor-arch-optimize/workflow-status.md`

- [x] **Step 1: Add changelog**

Create a concise release history entry for current user-visible changes.

- [x] **Step 2: Fill project conventions**

Replace placeholder OpenSpec project text with actual conventions for this TypeScript CLI.

- [x] **Step 3: Final verification**

Run `openspec validate refactor-arch-optimize --strict`, `npm run build`, `npm test`, and the style check.
