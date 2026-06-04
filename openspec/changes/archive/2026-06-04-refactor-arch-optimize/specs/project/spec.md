## ADDED Requirements

### Requirement: Version Should Be Single-Sourced

The CLI version number SHALL be read from `package.json` at runtime, not hard-coded in source.

#### Scenario: CLI reports correct version
- **WHEN** user runs `openflow --version`
- **THEN** the output SHALL match the `version` field in `package.json`

### Requirement: File System Operations Must Use Native APIs

All file/directory existence checks SHALL use `fs.existsSync()` instead of shell commands (`test -f`, `test -d`).

#### Scenario: fileExists returns correct result
- **WHEN** `fileExists(somePath)` is called
- **THEN** it SHALL return `true` if `fs.existsSync(somePath)` returns true AND the path points to a file
- **AND** it SHALL NOT spawn a child process

### Requirement: cmdExists Must Not Shell-Out

The `cmdExists` function SHALL check command availability without executing a shell command.

#### Scenario: cmdExists with installed command
- **WHEN** `cmdExists('node')` is called
- **THEN** it SHALL return `true`
- **AND** it SHALL NOT execute `which` or any other shell subprocess

### Requirement: There Should Be Tests

The project SHALL have a test suite covering at least the utility functions (shell.ts, logger.ts, constants.ts).

#### Scenario: tests exist and pass
- **WHEN** `npm test` is run
- **THEN** the exit code SHALL be 0
- **AND** there SHALL be at least 3 test cases covering shell.ts file/dir/command checks

### Requirement: Source Tree Must Not Accumulate Build Artifacts

The repository SHALL ignore TypeScript build artifacts generated under `src/` and keep production output under `dist/`.

#### Scenario: src build artifacts are ignored
- **WHEN** TypeScript emits `.js` or `.d.ts` files into `src/` by mistake
- **THEN** `git status --short` SHALL NOT show those files as untracked project changes
- **AND** the cleanup task SHALL remove existing untracked `src/**/*.js` and `src/**/*.d.ts` artifacts from the working tree

### Requirement: CI Must Validate Build And Tests

The project SHALL provide a GitHub Actions workflow that installs dependencies, builds the package, and runs the test suite.

#### Scenario: pull request validation
- **WHEN** a pull request or push runs the CI workflow
- **THEN** CI SHALL execute `npm ci`
- **AND** CI SHALL execute `npm run build`
- **AND** CI SHALL execute `npm test`

### Requirement: Formatting And Linting Must Be Automated

The project SHALL provide an automated code style check using a single configured tool.

#### Scenario: style check
- **WHEN** maintainers run the documented style command
- **THEN** the command SHALL report TypeScript and Markdown formatting or lint issues deterministically
- **AND** CI SHOULD run the same check after the tool is configured

### Requirement: Workflow Status Draft Must Be Resolved

The project SHALL either merge the workflow-status implementation and tests from the `openflow-workflow-status` worktree or explicitly remove that stale worktree to avoid duplicate task state.

#### Scenario: workflow-status decision is recorded
- **WHEN** the refactor change is completed
- **THEN** the repository SHALL contain either committed workflow-status code/tests or no active workflow-status worktree requiring follow-up
- **AND** the decision SHALL be reflected in the implementation tasks

### Requirement: Release History Must Be Visible

The project SHALL maintain a `CHANGELOG.md` or equivalent release notes file for user-visible changes.

#### Scenario: release notes exist
- **WHEN** a version is prepared for publication
- **THEN** the release notes SHALL summarize user-visible CLI, workflow, and packaging changes

### Requirement: exec() Error Handling

The `exec()` function in shell.ts SHALL distinguish between successful empty output and command failure.

#### Scenario: exec handles failure gracefully
- **WHEN** a shell command fails
- **THEN** `exec()` SHALL NOT throw
- **AND** callers SHALL be able to detect failure vs empty success (optional enhancement)
