# OpenFlow Workflow Status Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a unified `workflow-status.md` navigation layer and dashboard so OpenFlow clearly reports each active change's phase, gates, task status, blockers, conflicts, and next action.

**Architecture:** Add a focused `src/core/workflow-status.ts` module that reads active changes, parses optional `workflow-status.md`, synthesizes inferred state when missing, detects file/status conflicts, and renders dashboard text. Wire `openflow status` to this module, then update OpenFlow skill templates so agents maintain the status file across proposal, brainstorming, spec, build, amend, and close phases.

**Tech Stack:** TypeScript ESM, Node.js `fs`/`path`, Commander CLI, Vitest for unit tests.

---

## File Structure

- Modify: `package.json`
  - Add Vitest 4 dev dependency, test scripts, and raise Node engine to `>=20.19.0`.
- Create: `vitest.config.mts`
  - Configure Node environment and test include pattern.
- Modify: `tsconfig.json`
  - Exclude test files from production `tsc` output so package builds stay clean.
- Create: `src/core/workflow-status.ts`
  - Own the workflow status data model, Markdown parsing, inference, conflict detection, and dashboard rendering.
- Create: `src/core/workflow-status.test.ts`
  - Unit tests for missing status inference, status parsing, conflict detection, and dashboard output.
- Modify: `src/cli/status.ts`
  - Replace simple active-change listing with workflow dashboard output.
- Modify: `templates/SKILL.md`
  - Teach `/openflow` to use `workflow-status.md` and show a dashboard before routing.
- Modify: `templates/proposal.md`
  - Require proposal completion to initialize workflow status.
- Modify: `templates/brainstorming.md`
  - Require brainstorming completion to initialize workflow status with `Capture Mode: brainstorming`.
- Modify: `templates/spec.md`
  - Require spec start/completion to update gates and tasks.
- Modify: `templates/build.md`
  - Require build execution to update per-task state.
- Modify: `templates/amend.md`
  - Require amendments to record blocked/superseded state.
- Modify: `templates/close.md`
  - Require close verification/archive to update final gates.
- Modify: `src/core/skill-generator.ts`
  - Keep inline fallback aligned with updated `SKILL.md` behavior, or remove stale fallback content for `SKILL.md` by making it minimal and dashboard-aware.

---

### Task 1: Add Vitest test infrastructure

**Files:**
- Modify: `package.json`
- Modify: `tsconfig.json`
- Create: `vitest.config.mts`

- [ ] **Step 1: Install Vitest**

Run:

```bash
npm install -D vitest@^4.1.8
```

Expected: `package.json` and `package-lock.json` include Vitest 4 in dev dependencies.

- [ ] **Step 2: Raise package Node engine**

Modify `package.json` engines to exactly:

```json
{
  "engines": {
    "node": ">=20.19.0"
  }
}
```

This matches the Node requirement of Vitest/Vite 4 and avoids the critical Vitest 3 audit finding.

- [ ] **Step 3: Update package scripts**

Modify `package.json` scripts to exactly:

```json
{
  "scripts": {
    "build": "tsc",
    "dev": "tsc --watch",
    "test": "vitest run",
    "test:watch": "vitest",
    "prepublishOnly": "npm run build",
    "postinstall": "node ./scripts/postinstall.js"
  }
}
```

- [ ] **Step 4: Add Vitest config**

Create `vitest.config.mts`:

```ts
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    include: ['src/**/*.test.ts'],
    passWithNoTests: true,
  },
});
```

- [ ] **Step 5: Keep production TypeScript build scoped to src**

Leave `tsconfig.json` production scope unchanged so `npm run build` only emits `src/**/*` into `dist`:

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "Node16",
    "moduleResolution": "Node16",
    "outDir": "./dist",
    "rootDir": "./src",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "declaration": true,
    "sourceMap": false
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist", "src/**/*.test.ts"]
}
```

- [ ] **Step 6: Run tests before adding test files**

Run:

```bash
npm test
```

Expected: Vitest exits successfully even before tests are added because `passWithNoTests: true` is set. Future tasks add actual tests.

- [ ] **Step 7: Build**

Run:

```bash
npm run build
```

Expected: TypeScript build passes.

- [ ] **Step 8: Verify diff scope**

Run:

```bash
git diff -- package.json package-lock.json tsconfig.json vitest.config.mts
```

Expected: diff only adds Vitest 4 infrastructure and raises `engines.node` to `>=20.19.0`. Continue automatically if the scope matches; do not commit unless the user explicitly asks for a commit.

---

### Task 2: Add workflow status model tests first

**Files:**
- Create: `src/core/workflow-status.test.ts`
- Create later in Task 3: `src/core/workflow-status.ts`

- [ ] **Step 1: Write failing tests**

Create `src/core/workflow-status.test.ts`:

```ts
import fs from 'fs';
import os from 'os';
import path from 'path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import {
  detectWorkflowConflicts,
  findActiveChanges,
  loadWorkflowStatus,
  renderWorkflowDashboard,
  synthesizeWorkflowStatus,
} from './workflow-status.js';

let tempDir: string;

function writeFile(relativePath: string, content: string): void {
  const target = path.join(tempDir, relativePath);
  fs.mkdirSync(path.dirname(target), { recursive: true });
  fs.writeFileSync(target, content);
}

beforeEach(() => {
  tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'openflow-status-'));
});

afterEach(() => {
  fs.rmSync(tempDir, { recursive: true, force: true });
});

describe('findActiveChanges', () => {
  it('returns non-archive change directories sorted by name', () => {
    fs.mkdirSync(path.join(tempDir, 'openspec/changes/archive'), { recursive: true });
    fs.mkdirSync(path.join(tempDir, 'openspec/changes/update-z'), { recursive: true });
    fs.mkdirSync(path.join(tempDir, 'openspec/changes/add-a'), { recursive: true });

    expect(findActiveChanges(tempDir)).toEqual(['add-a', 'update-z']);
  });
});

describe('synthesizeWorkflowStatus', () => {
  it('infers capture state when proposal exists and plan-ready is missing', () => {
    writeFile('openspec/changes/refactor-arch-optimize/proposal.md', '## Why\nImprove workflow.\n');
    writeFile('openspec/changes/refactor-arch-optimize/tasks.md', '## 1. Work\n- [ ] 1.1 Add status dashboard\n- [ ] 1.2 Update templates\n');

    const status = synthesizeWorkflowStatus(tempDir, 'refactor-arch-optimize');

    expect(status.changeId).toBe('refactor-arch-optimize');
    expect(status.phase).toBe('capture');
    expect(status.captureMode).toBe('proposal');
    expect(status.overallStatus).toBe('ready_for_next_phase');
    expect(status.nextCommand).toBe('/openflow spec');
    expect(status.gates.find((gate) => gate.name === 'Requirements captured')?.status).toBe('passed');
    expect(status.tasks).toHaveLength(2);
    expect(status.tasks[0]).toMatchObject({ id: '1.1', status: 'pending' });
  });

  it('infers build-ready state when plan-ready exists and implementation plan is missing', () => {
    writeFile('openspec/changes/add-status/proposal.md', '## Why\nNeed status.\n');
    writeFile('openspec/changes/add-status/plan-ready.md', '# Plan\n');

    const status = synthesizeWorkflowStatus(tempDir, 'add-status');

    expect(status.phase).toBe('spec');
    expect(status.overallStatus).toBe('ready_for_next_phase');
    expect(status.nextCommand).toBe('/openflow build');
    expect(status.gates.find((gate) => gate.name === 'Plan ready')?.status).toBe('passed');
  });

  it('infers build in progress when implementation plan has unchecked boxes', () => {
    writeFile('openspec/changes/add-status/proposal.md', '## Why\nNeed status.\n');
    writeFile('openspec/changes/add-status/plan-ready.md', '# Plan\n');
    writeFile('docs/superpowers/plans/2026-06-02-add-status.md', '- [x] Step one\n- [ ] Step two\n');

    const status = synthesizeWorkflowStatus(tempDir, 'add-status');

    expect(status.phase).toBe('build');
    expect(status.overallStatus).toBe('in_progress');
    expect(status.nextCommand).toBe('/openflow build');
  });
});

describe('loadWorkflowStatus', () => {
  it('parses workflow-status.md summary, gates, and tasks', () => {
    writeFile('openspec/changes/add-status/workflow-status.md', `# Workflow Status: add-status

## Summary

- Phase: build
- Capture Mode: brainstorming
- Status: blocked
- Last Updated: 2026-06-02
- Next Command: /openflow amend
- Next Action: Resolve missing acceptance criteria.

## Gates

| Gate | Status | Evidence |
|------|--------|----------|
| Requirements captured | passed | proposal.md |
| Specs validated | passed | openspec validate add-status --strict |
| Plan ready | passed | plan-ready.md |

## Tasks

| ID | Task | Status | Verification | Blocked By | Notes |
|----|------|--------|--------------|------------|-------|
| 1.1 | Add dashboard | blocked | npm test | Acceptance criteria | Need amend |
`);

    const status = loadWorkflowStatus(tempDir, 'add-status');

    expect(status.inferred).toBe(false);
    expect(status.phase).toBe('build');
    expect(status.captureMode).toBe('brainstorming');
    expect(status.overallStatus).toBe('blocked');
    expect(status.nextCommand).toBe('/openflow amend');
    expect(status.tasks[0]).toMatchObject({ id: '1.1', status: 'blocked', blockedBy: 'Acceptance criteria' });
  });
});

describe('detectWorkflowConflicts', () => {
  it('reports plan-ready gate conflict when file is missing', () => {
    const status = loadWorkflowStatus(tempDir, 'add-status');
    status.gates = [{ name: 'Plan ready', status: 'passed', evidence: 'plan-ready.md' }];

    const conflicts = detectWorkflowConflicts(tempDir, status);

    expect(conflicts).toEqual([
      'workflow-status.md says Plan ready = passed, but plan-ready.md is missing.',
    ]);
  });
});

describe('renderWorkflowDashboard', () => {
  it('renders inferred status, gate evidence, task counts, conflicts, and next action', () => {
    writeFile('openspec/changes/refactor-arch-optimize/proposal.md', '## Why\nImprove workflow.\n');
    writeFile('openspec/changes/refactor-arch-optimize/tasks.md', '- [ ] 1.1 Add status dashboard\n');

    const status = synthesizeWorkflowStatus(tempDir, 'refactor-arch-optimize');
    const dashboard = renderWorkflowDashboard(status, ['example conflict']);

    expect(dashboard).toContain('OpenFlow Status');
    expect(dashboard).toContain('Change: refactor-arch-optimize');
    expect(dashboard).toContain('Source: inferred from files');
    expect(dashboard).toContain('Requirements captured');
    expect(dashboard).toContain('pending       1');
    expect(dashboard).toContain('Warning: example conflict');
    expect(dashboard).toContain('Run /openflow spec');
  });
});
```

- [ ] **Step 2: Run tests and verify failure**

Run:

```bash
npm test -- src/core/workflow-status.test.ts
```

Expected: FAIL because `src/core/workflow-status.ts` does not exist.

- [ ] **Step 3: Verify diff scope**

Run:

```bash
git diff -- src/core/workflow-status.test.ts
```

Expected: diff only adds failing workflow status tests. Continue automatically if the scope matches; do not commit unless the user explicitly asks for a commit.

---

### Task 3: Implement workflow status model

**Files:**
- Create: `src/core/workflow-status.ts`
- Test: `src/core/workflow-status.test.ts`

- [ ] **Step 1: Add workflow status implementation**

Create `src/core/workflow-status.ts`:

```ts
import fs from 'fs';
import path from 'path';

export type WorkflowPhase = 'capture' | 'spec' | 'build' | 'close' | 'archived';
export type CaptureMode = 'proposal' | 'brainstorming' | 'none';
export type WorkflowOverallStatus = 'pending' | 'in_progress' | 'blocked' | 'ready_for_next_phase' | 'completed';
export type WorkflowGateStatus = 'pending' | 'passed' | 'failed' | 'blocked' | 'not_applicable';
export type WorkflowTaskStatus = 'pending' | 'in_progress' | 'blocked' | 'implemented' | 'verified' | 'done' | 'superseded' | 'failed';

export interface WorkflowGate {
  name: string;
  status: WorkflowGateStatus;
  evidence: string;
}

export interface WorkflowTask {
  id: string;
  task: string;
  status: WorkflowTaskStatus;
  verification: string;
  blockedBy: string;
  notes: string;
}

export interface WorkflowStatus {
  changeId: string;
  inferred: boolean;
  phase: WorkflowPhase;
  captureMode: CaptureMode;
  overallStatus: WorkflowOverallStatus;
  lastUpdated: string;
  nextCommand: string;
  nextAction: string;
  gates: WorkflowGate[];
  tasks: WorkflowTask[];
}

const DEFAULT_GATES = [
  'Requirements captured',
  'Specs validated',
  'Plan ready',
  'Implementation complete',
  'Verification complete',
  'Archived',
] as const;

const TASK_STATUSES: WorkflowTaskStatus[] = [
  'pending',
  'in_progress',
  'blocked',
  'implemented',
  'verified',
  'done',
  'superseded',
  'failed',
];

export function findActiveChanges(cwd: string): string[] {
  const changesDir = path.join(cwd, 'openspec', 'changes');
  if (!fs.existsSync(changesDir)) return [];

  return fs.readdirSync(changesDir, { withFileTypes: true })
    .filter((entry) => entry.isDirectory() && entry.name !== 'archive')
    .map((entry) => entry.name)
    .sort((a, b) => a.localeCompare(b));
}

export function loadWorkflowStatus(cwd: string, changeId: string): WorkflowStatus {
  const statusPath = path.join(cwd, 'openspec', 'changes', changeId, 'workflow-status.md');
  if (!fs.existsSync(statusPath)) {
    return synthesizeWorkflowStatus(cwd, changeId);
  }

  return parseWorkflowStatus(changeId, fs.readFileSync(statusPath, 'utf-8'));
}

export function synthesizeWorkflowStatus(cwd: string, changeId: string): WorkflowStatus {
  const changeDir = path.join(cwd, 'openspec', 'changes', changeId);
  const proposalPath = path.join(changeDir, 'proposal.md');
  const planReadyPath = path.join(changeDir, 'plan-ready.md');
  const specsDir = path.join(changeDir, 'specs');
  const hasProposal = fs.existsSync(proposalPath);
  const hasPlanReady = fs.existsSync(planReadyPath);
  const hasSpecs = fs.existsSync(specsDir) && hasAnyMarkdownFile(specsDir);
  const planFiles = findImplementationPlanFiles(cwd, changeId);
  const implementationStarted = planFiles.length > 0;
  const implementationComplete = implementationStarted && planFiles.every((file) => allCheckboxesChecked(file));
  const tasks = readOpenSpecTasks(changeDir);

  let phase: WorkflowPhase = 'capture';
  let overallStatus: WorkflowOverallStatus = 'pending';
  let nextCommand = '/openflow proposal';
  let nextAction = 'Capture requirements for a new OpenSpec change.';

  if (implementationComplete) {
    phase = 'build';
    overallStatus = 'ready_for_next_phase';
    nextCommand = '/openflow close';
    nextAction = 'Verify implementation consistency and archive the change.';
  } else if (implementationStarted) {
    phase = 'build';
    overallStatus = 'in_progress';
    nextCommand = '/openflow build';
    nextAction = 'Continue implementation from the incomplete plan tasks.';
  } else if (hasPlanReady) {
    phase = 'spec';
    overallStatus = 'ready_for_next_phase';
    nextCommand = '/openflow build';
    nextAction = 'Execute the implementation plan.';
  } else if (hasProposal) {
    phase = 'capture';
    overallStatus = 'ready_for_next_phase';
    nextCommand = '/openflow spec';
    nextAction = 'Generate OpenSpec specs, tasks, and plan-ready.md.';
  }

  return {
    changeId,
    inferred: true,
    phase,
    captureMode: hasProposal ? 'proposal' : 'none',
    overallStatus,
    lastUpdated: '-',
    nextCommand,
    nextAction,
    gates: DEFAULT_GATES.map((name) => {
      if (name === 'Requirements captured') return { name, status: hasProposal ? 'passed' : 'pending', evidence: hasProposal ? 'proposal.md' : '-' };
      if (name === 'Specs validated') return { name, status: hasSpecs ? 'passed' : 'pending', evidence: hasSpecs ? 'specs/' : '-' };
      if (name === 'Plan ready') return { name, status: hasPlanReady ? 'passed' : 'pending', evidence: hasPlanReady ? 'plan-ready.md' : '-' };
      if (name === 'Implementation complete') return { name, status: implementationComplete ? 'passed' : 'pending', evidence: implementationComplete ? 'docs/superpowers/plans/' : '-' };
      return { name, status: 'pending', evidence: '-' };
    }),
    tasks,
  };
}

export function detectWorkflowConflicts(cwd: string, status: WorkflowStatus): string[] {
  const changeDir = path.join(cwd, 'openspec', 'changes', status.changeId);
  const conflicts: string[] = [];

  for (const gate of status.gates) {
    if (gate.status !== 'passed') continue;

    if (gate.name === 'Requirements captured' && !fs.existsSync(path.join(changeDir, 'proposal.md'))) {
      conflicts.push('workflow-status.md says Requirements captured = passed, but proposal.md is missing.');
    }

    if (gate.name === 'Plan ready' && !fs.existsSync(path.join(changeDir, 'plan-ready.md'))) {
      conflicts.push('workflow-status.md says Plan ready = passed, but plan-ready.md is missing.');
    }

    if (gate.name === 'Specs validated') {
      const specsDir = path.join(changeDir, 'specs');
      if (!fs.existsSync(specsDir) || !hasAnyMarkdownFile(specsDir)) {
        conflicts.push('workflow-status.md says Specs validated = passed, but specs/*.md is missing.');
      }
    }

    if (gate.name === 'Implementation complete') {
      const planFiles = findImplementationPlanFiles(cwd, status.changeId);
      if (planFiles.length === 0 || !planFiles.every((file) => allCheckboxesChecked(file))) {
        conflicts.push('workflow-status.md says Implementation complete = passed, but implementation plan checkboxes are incomplete.');
      }
    }
  }

  const activeChangeDir = path.join(cwd, 'openspec', 'changes', status.changeId);
  if (status.phase === 'archived' && fs.existsSync(activeChangeDir)) {
    conflicts.push('workflow-status.md says Phase = archived, but the change directory is still active.');
  }

  return conflicts;
}

export function renderWorkflowDashboard(status: WorkflowStatus, conflicts: string[] = []): string {
  const counts = countTasks(status.tasks);
  const lines = [
    'OpenFlow Status',
    '',
    `Change: ${status.changeId}`,
    `Source: ${status.inferred ? 'inferred from files' : 'workflow-status.md'}`,
    `Phase: ${status.phase}`,
    `Capture Mode: ${status.captureMode}`,
    `Status: ${status.overallStatus}`,
    '',
    'Gates:',
    ...status.gates.map((gate) => `${gateMarker(gate.status)} ${gate.name.padEnd(27)} ${gate.evidence}`),
    '',
    'Tasks:',
    ...TASK_STATUSES.map((taskStatus) => `${taskStatus.padEnd(13)} ${String(counts[taskStatus] ?? 0).padStart(2)}`),
  ];

  const blockedTasks = status.tasks.filter((task) => task.status === 'blocked');
  if (blockedTasks.length > 0) {
    lines.push('', 'Blockers:');
    for (const task of blockedTasks) {
      lines.push(`- ${task.id} ${task.task}: ${task.blockedBy}${task.notes !== '-' ? ` (${task.notes})` : ''}`);
    }
  }

  if (conflicts.length > 0) {
    lines.push('', 'Conflicts:');
    for (const conflict of conflicts) {
      lines.push(`Warning: ${conflict}`);
    }
  }

  lines.push('', 'Next:', `Run ${status.nextCommand} to ${lowercaseFirst(status.nextAction)}`);
  return lines.join('\n');
}

function parseWorkflowStatus(changeId: string, content: string): WorkflowStatus {
  const summary = parseSummary(content);
  const gates = parseTable(content, 'Gates').map((row) => ({
    name: row.Gate ?? '',
    status: parseGateStatus(row.Status),
    evidence: row.Evidence || '-',
  })).filter((gate) => gate.name);
  const tasks = parseTable(content, 'Tasks').map((row) => ({
    id: row.ID ?? '',
    task: row.Task ?? '',
    status: parseTaskStatus(row.Status),
    verification: row.Verification || '-',
    blockedBy: row['Blocked By'] || '-',
    notes: row.Notes || '-',
  })).filter((task) => task.id);

  return {
    changeId,
    inferred: false,
    phase: parsePhase(summary.Phase),
    captureMode: parseCaptureMode(summary['Capture Mode']),
    overallStatus: parseOverallStatus(summary.Status),
    lastUpdated: summary['Last Updated'] || '-',
    nextCommand: summary['Next Command'] || '/openflow',
    nextAction: summary['Next Action'] || 'inspect current workflow state.',
    gates: gates.length ? gates : DEFAULT_GATES.map((name) => ({ name, status: 'pending', evidence: '-' })),
    tasks,
  };
}

function parseSummary(content: string): Record<string, string> {
  const summary = sectionLines(content, 'Summary');
  const result: Record<string, string> = {};

  for (const line of summary) {
    const match = line.match(/^-\s*([^:]+):\s*(.*)$/);
    if (match) result[match[1].trim()] = match[2].trim();
  }

  return result;
}

function parseTable(content: string, heading: string): Record<string, string>[] {
  const lines = sectionLines(content, heading).filter((line) => line.trim().startsWith('|'));
  if (lines.length < 2) return [];

  const headers = splitTableRow(lines[0]);
  return lines.slice(2).map((line) => {
    const values = splitTableRow(line);
    return Object.fromEntries(headers.map((header, index) => [header, values[index] ?? '']));
  });
}

function sectionLines(content: string, heading: string): string[] {
  const lines = content.split(/\r?\n/);
  const start = lines.findIndex((line) => line.trim() === `## ${heading}`);
  if (start < 0) return [];
  const rest = lines.slice(start + 1);
  const end = rest.findIndex((line) => line.startsWith('## '));
  return end < 0 ? rest : rest.slice(0, end);
}

function splitTableRow(line: string): string[] {
  return line.split('|').slice(1, -1).map((cell) => cell.trim());
}

function readOpenSpecTasks(changeDir: string): WorkflowTask[] {
  const tasksPath = path.join(changeDir, 'tasks.md');
  if (!fs.existsSync(tasksPath)) return [];

  return fs.readFileSync(tasksPath, 'utf-8')
    .split(/\r?\n/)
    .map((line) => line.match(/^- \[[ xX]\]\s+([\d.]+)\s+(.+)$/))
    .filter((match): match is RegExpMatchArray => Boolean(match))
    .map((match) => ({
      id: match[1],
      task: match[2].trim(),
      status: 'pending',
      verification: '-',
      blockedBy: '-',
      notes: '-',
    }));
}

function findImplementationPlanFiles(cwd: string, changeId: string): string[] {
  const plansDir = path.join(cwd, 'docs', 'superpowers', 'plans');
  if (!fs.existsSync(plansDir)) return [];

  return fs.readdirSync(plansDir, { withFileTypes: true })
    .filter((entry) => entry.isFile() && entry.name.endsWith('.md') && entry.name.includes(changeId))
    .map((entry) => path.join(plansDir, entry.name));
}

function allCheckboxesChecked(filePath: string): boolean {
  const checkboxes = fs.readFileSync(filePath, 'utf-8').match(/- \[[ xX]\]/g) ?? [];
  return checkboxes.length > 0 && checkboxes.every((checkbox) => checkbox.toLowerCase() === '- [x]');
}

function hasAnyMarkdownFile(dir: string): boolean {
  return fs.readdirSync(dir, { withFileTypes: true }).some((entry) => {
    const childPath = path.join(dir, entry.name);
    return entry.isDirectory() ? hasAnyMarkdownFile(childPath) : entry.isFile() && entry.name.endsWith('.md');
  });
}

function countTasks(tasks: WorkflowTask[]): Record<WorkflowTaskStatus, number> {
  return TASK_STATUSES.reduce((acc, status) => {
    acc[status] = tasks.filter((task) => task.status === status).length;
    return acc;
  }, {} as Record<WorkflowTaskStatus, number>);
}

function gateMarker(status: WorkflowGateStatus): string {
  if (status === 'passed') return '✓';
  if (status === 'failed') return '✗';
  if (status === 'blocked') return '!';
  if (status === 'not_applicable') return '-';
  return '•';
}

function lowercaseFirst(value: string): string {
  return value ? value[0].toLowerCase() + value.slice(1) : value;
}

function parsePhase(value: string | undefined): WorkflowPhase {
  return value === 'spec' || value === 'build' || value === 'close' || value === 'archived' ? value : 'capture';
}

function parseCaptureMode(value: string | undefined): CaptureMode {
  return value === 'proposal' || value === 'brainstorming' ? value : 'none';
}

function parseOverallStatus(value: string | undefined): WorkflowOverallStatus {
  return value === 'in_progress' || value === 'blocked' || value === 'ready_for_next_phase' || value === 'completed' ? value : 'pending';
}

function parseGateStatus(value: string | undefined): WorkflowGateStatus {
  return value === 'passed' || value === 'failed' || value === 'blocked' || value === 'not_applicable' ? value : 'pending';
}

function parseTaskStatus(value: string | undefined): WorkflowTaskStatus {
  return TASK_STATUSES.includes(value as WorkflowTaskStatus) ? value as WorkflowTaskStatus : 'pending';
}
```

- [ ] **Step 2: Run workflow status tests**

Run:

```bash
npm test -- src/core/workflow-status.test.ts
```

Expected: PASS for all workflow status tests.

- [ ] **Step 3: Build**

Run:

```bash
npm run build
```

Expected: PASS.

- [ ] **Step 4: Verify diff scope**

Run:

```bash
git diff -- src/core/workflow-status.ts src/core/workflow-status.test.ts
```

Expected: diff adds the workflow status model and updates only the planned tests. Continue automatically if the scope matches; do not commit unless the user explicitly asks for a commit.

---

### Task 4: Wire workflow dashboard into status command

**Files:**
- Modify: `src/cli/status.ts`
- Test: `src/core/workflow-status.test.ts`

- [ ] **Step 1: Update active change status output**

Replace the active changes block in `src/cli/status.ts` with dashboard rendering. The resulting file should be:

```ts
import { Command } from 'commander';
import { checkDependencies, readState, checkOpenSpecInitialized } from '../core/dependency-check.js';
import { detectWorkflowConflicts, findActiveChanges, loadWorkflowStatus, renderWorkflowDashboard } from '../core/workflow-status.js';
import { logger } from '../utils/logger.js';

export const statusCommand = new Command('status')
  .description('Show dependency status and active changes')
  .action(() => {
    const cwd = process.cwd();

    logger.blank();
    logger.info('openflow status');
    logger.blank();

    const state = readState(cwd);

    logger.step('Dependencies:');
    const depStatus = checkDependencies({ cwd, tools: state?.tools });

    if (depStatus.openspec.installed) {
      logger.success(`OpenSpec CLI${depStatus.openspec.version ? ` v${depStatus.openspec.version}` : ''}`);
    } else {
      logger.warn('OpenSpec CLI — not installed');
    }

    if (depStatus.superpowers.installed) {
      logger.success(`Superpowers${depStatus.superpowers.path ? ` (${depStatus.superpowers.path})` : ''}`);
    } else {
      logger.warn('Superpowers — not installed (build phase will use manual mode)');
    }

    logger.blank();
    logger.step('Project:');

    if (state) {
      logger.success(`Initialized (${state.tools.join(', ')})`);
      logger.info(`  Created at: ${state.createdAt}`);
    } else {
      logger.warn('Not initialized — run openflow init');
      return;
    }

    if (checkOpenSpecInitialized(cwd)) {
      logger.success('OpenSpec project initialized');
    } else {
      logger.warn('OpenSpec project not initialized');
    }

    logger.blank();
    logger.step('Workflow:');

    const changes = findActiveChanges(cwd);
    if (changes.length === 0) {
      logger.info('  No active changes');
      logger.info('  Next: run /openflow proposal or /openflow brainstorming');
      logger.blank();
      return;
    }

    for (const changeId of changes) {
      const status = loadWorkflowStatus(cwd, changeId);
      const conflicts = detectWorkflowConflicts(cwd, status);
      logger.info(renderWorkflowDashboard(status, conflicts));
      logger.blank();
    }
  });
```

- [ ] **Step 2: Run tests**

Run:

```bash
npm test
```

Expected: PASS.

- [ ] **Step 3: Build**

Run:

```bash
npm run build
```

Expected: PASS.

- [ ] **Step 4: Run status command against current repo**

Run:

```bash
node bin/openflow.js status
```

Expected: output includes `Workflow:`, `OpenFlow Status`, active change `refactor-arch-optimize`, `Source: inferred from files`, and `Run /openflow spec`.

- [ ] **Step 5: Verify diff scope**

Run:

```bash
git diff -- src/cli/status.ts
```

Expected: diff only wires status command to the dashboard renderer. Continue automatically if the scope matches; do not commit unless the user explicitly asks for a commit.

---

### Task 5: Update main OpenFlow template to define status-first routing

**Files:**
- Modify: `templates/SKILL.md`
- Modify: `src/core/skill-generator.ts`

- [ ] **Step 1: Update `templates/SKILL.md` status sections**

In `templates/SKILL.md`, replace the `## 状态检测` section with:

```md
## 状态检测与 Dashboard

当用户调用 `/openflow` 不带子命令，或调用某个子命令需要确认前置条件时，先读取当前 active change 的 `workflow-status.md`。如果文件不存在，基于文件系统推断状态，并明确标记为 inferred。

状态源优先级：

1. `openspec/changes/<change-id>/workflow-status.md` — 流程导航状态
2. 文件系统扫描 — 校验状态是否真实存在
3. 会话记忆 — 只能用于续接，不可作为事实来源

Dashboard 必须显示：

- 当前 active change
- 状态来源：`workflow-status.md` 或 `inferred from files`
- Phase：`capture | spec | build | close | archived`
- Capture Mode：`proposal | brainstorming | none`
- Overall Status：`pending | in_progress | blocked | ready_for_next_phase | completed`
- Gates：需求、规格、计划、实现、验证、归档
- Tasks：按 `pending/in_progress/blocked/implemented/verified/done/failed/superseded` 统计
- Conflicts：状态文件和实际文件不一致时必须列出
- Next Command / Next Action

如果只有一个 active change，直接展示该 change 的 dashboard。如果有多个 active changes，先列出所有 dashboard，然后询问用户要操作哪一个。

### 缺失 workflow-status.md 的处理

如果 active change 没有 `workflow-status.md`：

| 文件状态 | 推断 Phase | 推断 Status | Next |
|----------|------------|-------------|------|
| 有 `proposal.md`，无 `plan-ready.md` | capture | ready_for_next_phase | `/openflow spec` |
| 有 `plan-ready.md`，无实现计划 | spec | ready_for_next_phase | `/openflow build` |
| 有实现计划且 checkbox 未完成 | build | in_progress | `/openflow build` |
| 有实现计划且 checkbox 全完成 | build | ready_for_next_phase | `/openflow close` |

推断 dashboard 必须写明 `Source: inferred from files`，不得伪装成权威状态。

### 冲突处理

如果 `workflow-status.md` 与文件系统冲突，必须显示冲突并推荐修复动作，不得静默覆盖。

示例：

```text
Warning: workflow-status.md says Plan ready = passed, but plan-ready.md is missing.
Recommended fix: run /openflow spec to regenerate plan-ready.md or amend the status.
```
```

Then replace the old `判定结果` list with:

```md
判定结果：
- 无 active change → 提示从 `/openflow proposal` 或 `/openflow brainstorming` 开始
- Phase = capture 且 ready_for_next_phase → 推荐 `/openflow spec`
- Phase = spec 且 ready_for_next_phase → 推荐 `/openflow build`
- Phase = build 且 in_progress → 继续 `/openflow build`
- Phase = build 且 ready_for_next_phase → 推荐 `/openflow close`
- Phase = close 且 blocked → 推荐 `/openflow amend`
- Phase = archived 且 completed → 提示变更已完成，可以开始新 change
```

- [ ] **Step 2: Update inline fallback main template**

In `src/core/skill-generator.ts`, update the inline `'SKILL.md'` content inside `getInlineTemplate()` so it includes the same `## 状态检测与 Dashboard` section from Step 1. Keep the surrounding frontmatter and routing sections intact.

- [ ] **Step 3: Build**

Run:

```bash
npm run build
```

Expected: PASS.

- [ ] **Step 4: Verify diff scope**

Run:

```bash
git diff -- templates/SKILL.md src/core/skill-generator.ts
```

Expected: diff only defines workflow status dashboard routing. Continue automatically if the scope matches; do not commit unless the user explicitly asks for a commit.

---

### Task 6: Update phase templates to maintain workflow status

**Files:**
- Modify: `templates/proposal.md`
- Modify: `templates/brainstorming.md`
- Modify: `templates/spec.md`
- Modify: `templates/build.md`
- Modify: `templates/amend.md`
- Modify: `templates/close.md`

- [ ] **Step 1: Update proposal template**

In `templates/proposal.md`, after the instruction that writes `proposal.md`, insert:

```md
### 3.5 初始化 workflow-status.md

创建或更新 `openspec/changes/<变更名>/workflow-status.md`：

```markdown
# Workflow Status: <变更名>

## Summary

- Phase: capture
- Capture Mode: proposal
- Status: ready_for_next_phase
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

## Amendments

| Date | Reason | Affected Specs | Affected Tasks | Status |
|------|--------|----------------|----------------|--------|
```

如果已经能从用户需求中明确任务，填入 Tasks 表并把状态设为 `pending`。不要把猜测性任务写入状态表。
```

- [ ] **Step 2: Update brainstorming template**

In `templates/brainstorming.md`, after the instruction that writes `proposal.md`, insert the same `workflow-status.md` template as Step 1, but set:

```md
- Capture Mode: brainstorming
```

and add this sentence:

```md
如果 brainstorming 产出了方案取舍或关键技术方向，把这些内容写入 `proposal.md` 的设计方向段落；不要在 capture 阶段创建代码实现计划。
```

- [ ] **Step 3: Update spec template**

In `templates/spec.md`, add a new subsection after `### 4. 自动生成 plan-ready.md（翻译层）`:

```md
### 4.5 更新 workflow-status.md

`/openflow spec` 开始时：

```markdown
- Phase: spec
- Status: in_progress
```

规格生成、严格校验和 `plan-ready.md` 生成完成后，更新：

```markdown
- Phase: spec
- Status: ready_for_next_phase
- Next Command: /openflow build
- Next Action: Execute the implementation plan.
```

Gates 更新为：

| Gate | Status | Evidence |
|------|--------|----------|
| Requirements captured | passed | proposal.md |
| Specs validated | passed | `openspec validate <变更名> --strict` |
| Plan ready | passed | plan-ready.md |
| Implementation complete | pending | - |
| Verification complete | pending | - |
| Archived | pending | - |

把 `tasks.md` 中的任务同步到 `workflow-status.md` 的 Tasks 表。同步规则：

1. 新任务追加为 `pending`
2. 已存在任务保留非 `pending` 状态
3. 不删除已存在任务；如果任务被规格修订替代，交给 `/openflow amend` 标记 `superseded`
```

- [ ] **Step 4: Update build template**

In `templates/build.md`, add this subsection after `### 4. 执行实现`:

```md
### 4.5 同步任务状态

执行每个任务时同步 `workflow-status.md`：

| 时机 | Task Status | Verification | Blocked By | Notes |
|------|-------------|--------------|------------|-------|
| 开始任务 | in_progress | - | - | 当前正在执行 |
| 代码或文档已改完，验证未跑 | implemented | pending | - | 等待验证 |
| 验证通过 | verified | 验证命令或检查结果 | - | - |
| 任务关闭 | done | 验证命令或检查结果 | - | - |
| 任务卡住 | blocked | - | 阻塞来源 | 需要的决定或依赖 |
| 验证失败 | failed | 失败命令 | - | 失败摘要 |

所有任务完成后，只有当 Tasks 表中所有任务都是 `done` 或 `superseded`，才允许设置：

```markdown
- Phase: build
- Status: ready_for_next_phase
- Next Command: /openflow close
- Next Action: Verify implementation consistency and archive the change.
```

并把 `Implementation complete` gate 标记为 `passed`。
```

- [ ] **Step 5: Update amend template**

In `templates/amend.md`, add this subsection after `### 2. 判断是 amend 还是 build`:

```md
### 2.5 标记 amend 阻塞状态

如果判断需要 amend，先更新 `workflow-status.md`：

```markdown
- Status: blocked
- Next Command: /openflow amend
- Next Action: Revise OpenSpec documents and update implementation tasks.
```

在 `## Amendments` 表中追加：

| Date | Reason | Affected Specs | Affected Tasks | Status |
|------|--------|----------------|----------------|--------|
| YYYY-MM-DD | 本次修订原因 | 受影响 spec 路径 | 受影响任务 ID | in_progress |
```

Then add this after `### 6. 同步详细实现计划`:

```md
### 6.5 完成 amend 状态同步

amend 完成后：

- 新增任务追加到 Tasks 表，状态为 `pending`
- 被替代任务标记为 `superseded`
- Amendments 表中本次记录状态改为 `done`
- 恢复原 Phase，通常是 `build`
- 设置 `Next Command: /openflow build`
```

- [ ] **Step 6: Update close template**

In `templates/close.md`, add this subsection after `### 1. 确认实现状态`:

```md
### 1.5 标记 close 开始

开始 close 时更新 `workflow-status.md`：

```markdown
- Phase: close
- Status: in_progress
- Next Command: /openflow close
- Next Action: Verify implementation consistency and archive the change.
```
```

Add this after `### 4. 处理不一致`:

```md
如果发现不一致，更新 `workflow-status.md`：

```markdown
- Status: blocked
- Next Command: /openflow amend
- Next Action: Resolve close-stage consistency issues.
```

并把 `Verification complete` gate 标记为 `failed`，Evidence 写 `close-issues.md`。
```

Add this after archive confirmation:

```md
归档成功后更新 `workflow-status.md`：

```markdown
- Phase: archived
- Status: completed
- Next Command: /openflow proposal
- Next Action: Start a new change if needed.
```

Gates 中 `Verification complete` 和 `Archived` 都标记为 `passed`。
```

- [ ] **Step 7: Build**

Run:

```bash
npm run build
```

Expected: PASS.

- [ ] **Step 8: Verify diff scope**

Run:

```bash
git diff -- templates/proposal.md templates/brainstorming.md templates/spec.md templates/build.md templates/amend.md templates/close.md
```

Expected: diff only adds phase-specific workflow status maintenance instructions. Continue automatically if the scope matches; do not commit unless the user explicitly asks for a commit.

---

### Task 7: Add generated status docs to current installed skill files

**Files:**
- Modify: `.claude/skills/openflow/SKILL.md`
- Modify: `.claude/skills/openflow/proposal.md`
- Modify: `.claude/skills/openflow/brainstorming.md`
- Modify: `.claude/skills/openflow/spec.md`
- Modify: `.claude/skills/openflow/build.md`
- Modify: `.claude/skills/openflow/amend.md`
- Modify: `.claude/skills/openflow/close.md`

- [ ] **Step 1: Regenerate local skill files**

Run:

```bash
npm run build
node bin/openflow.js update --tool claude
```

Expected: `.claude/skills/openflow/*.md` reflect the updated templates.

- [ ] **Step 2: Verify generated skill diff**

Run:

```bash
git diff -- .claude/skills/openflow templates src/core/skill-generator.ts
```

Expected: `.claude/skills/openflow` contains the same workflow status instructions as `templates`. Continue automatically if the scope matches.

- [ ] **Step 3: Run status command**

Run:

```bash
node bin/openflow.js status
```

Expected: status dashboard still renders current active change.

- [ ] **Step 4: Verify generated skill tracking scope**

Run:

```bash
git ls-files -- .claude/skills/openflow/SKILL.md
```

If output contains `.claude/skills/openflow/SKILL.md`, keep the generated skill files in the working tree for final verification. If output is empty, leave generated files untracked and do not add them unless the user explicitly asks.

---

### Task 8: Add workflow status fixture for the active change

**Files:**
- Create: `openspec/changes/refactor-arch-optimize/workflow-status.md`

- [ ] **Step 1: Create status file for current active change**

Create `openspec/changes/refactor-arch-optimize/workflow-status.md`:

```md
# Workflow Status: refactor-arch-optimize

## Summary

- Phase: capture
- Capture Mode: proposal
- Status: ready_for_next_phase
- Last Updated: 2026-06-02
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
| 1.1 | 修复版本号不一致：从 `package.json` 读取版本，或统一为单一来源 | pending | - | - | - |
| 1.2 | 重构 shell.ts：`fileExists`/`dirExists` 改用 `fs.existsSync`，消除 shell 注入风险 | pending | - | - | - |
| 1.3 | `cmdExists()` 改用 `fs.access()` 或 `which` 包，避免 shell 执行 | pending | - | - | - |
| 1.4 | 添加测试基础设施（vitest/jest），为核心功能编写单元测试 | pending | - | - | - |
| 2.1 | 消除模板双重维护：移除 `getInlineTemplate()` 中的 SKILL.md 硬编码，统一从文件读取 | pending | - | - | - |
| 2.2 | Logger 增加 debug 级别和 `--json` 模式 | pending | - | - | - |
| 3.1 | 配置 GitHub Actions CI（lint + test + publish on tag） | pending | - | - | - |
| 3.2 | 填充 `openspec/project.md` 为项目真实配置 | pending | - | - | - |
| 3.3 | 验证各工具的 skill 路径正确性，补充集成测试 | pending | - | - | - |

## Amendments

| Date | Reason | Affected Specs | Affected Tasks | Status |
|------|--------|----------------|----------------|--------|
```

- [ ] **Step 2: Run dashboard with authoritative status**

Run:

```bash
node bin/openflow.js status
```

Expected: dashboard shows `Source: workflow-status.md` for `refactor-arch-optimize`, task count `pending       9`, and next command `/openflow spec`.

- [ ] **Step 3: Run tests and build**

Run:

```bash
npm test
npm run build
```

Expected: both commands pass.

- [ ] **Step 4: Verify diff scope**

Run:

```bash
git diff -- openspec/changes/refactor-arch-optimize/workflow-status.md
```

Expected: diff only adds workflow status for the active change. Continue automatically if the scope matches; do not commit unless the user explicitly asks for a commit.

---

### Task 9: Final verification

**Files:**
- Verify all modified files from prior tasks.

- [ ] **Step 1: Run full test suite**

Run:

```bash
npm test
```

Expected: PASS.

- [ ] **Step 2: Run TypeScript build**

Run:

```bash
npm run build
```

Expected: PASS.

- [ ] **Step 3: Verify status dashboard**

Run:

```bash
node bin/openflow.js status
```

Expected output includes:

```text
OpenFlow Status
Change: refactor-arch-optimize
Source: workflow-status.md
Phase: capture
Capture Mode: proposal
Status: ready_for_next_phase
pending       9
Run /openflow spec
```

- [ ] **Step 4: Verify inferred dashboard still works**

Run:

```bash
mv openspec/changes/refactor-arch-optimize/workflow-status.md /tmp/openflow-workflow-status.md
node bin/openflow.js status
mv /tmp/openflow-workflow-status.md openspec/changes/refactor-arch-optimize/workflow-status.md
```

Expected output from the middle command includes:

```text
Source: inferred from files
Run /openflow spec
```

- [ ] **Step 5: Check git diff**

Run:

```bash
git diff --stat
```

Expected: only files from this plan are changed.

- [ ] **Step 6: Re-run verification after fixes if any were needed**

If Step 1-5 required small fixes, re-run:

```bash
npm test
npm run build
node bin/openflow.js status
```

Expected: all verification commands pass. Do not commit unless the user explicitly asks for a commit.
```
