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

  it('returns empty array when changes dir does not exist', () => {
    expect(findActiveChanges(tempDir)).toEqual([]);
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

  it('infers build complete when all checkboxes are checked', () => {
    writeFile('openspec/changes/add-status/proposal.md', '## Why\nNeed status.\n');
    writeFile('openspec/changes/add-status/plan-ready.md', '# Plan\n');
    writeFile('docs/superpowers/plans/2026-06-02-add-status.md', '- [x] Step one\n- [x] Step two\n');

    const status = synthesizeWorkflowStatus(tempDir, 'add-status');

    expect(status.phase).toBe('build');
    expect(status.overallStatus).toBe('ready_for_next_phase');
    expect(status.nextCommand).toBe('/openflow close');
  });

  it('infers pending state when no files exist', () => {
    fs.mkdirSync(path.join(tempDir, 'openspec/changes/my-change'), { recursive: true });

    const status = synthesizeWorkflowStatus(tempDir, 'my-change');

    expect(status.phase).toBe('capture');
    expect(status.captureMode).toBe('none');
    expect(status.overallStatus).toBe('pending');
    expect(status.nextCommand).toBe('/openflow proposal');
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

  it('falls back to synthesis when workflow-status.md does not exist', () => {
    writeFile('openspec/changes/my-change/proposal.md', '# Proposal\n');

    const status = loadWorkflowStatus(tempDir, 'my-change');

    expect(status.inferred).toBe(true);
    expect(status.phase).toBe('capture');
  });
});

describe('detectWorkflowConflicts', () => {
  it('reports plan-ready gate conflict when file is missing', () => {
    writeFile('openspec/changes/add-status/proposal.md', '# Proposal\n');
    const status = synthesizeWorkflowStatus(tempDir, 'add-status');
    status.gates = [{ name: 'Plan ready', status: 'passed', evidence: 'plan-ready.md' }];

    const conflicts = detectWorkflowConflicts(tempDir, status);

    expect(conflicts).toEqual([
      'workflow-status.md says Plan ready = passed, but plan-ready.md is missing.',
    ]);
  });

  it('reports specs gate conflict when specs dir is empty', () => {
    writeFile('openspec/changes/add-status/proposal.md', '# Proposal\n');
    writeFile('openspec/changes/add-status/.gitkeep', '');
    fs.mkdirSync(path.join(tempDir, 'openspec/changes/add-status/specs'), { recursive: true });
    const status = synthesizeWorkflowStatus(tempDir, 'add-status');
    status.gates = [{ name: 'Specs validated', status: 'passed', evidence: 'specs/' }];

    const conflicts = detectWorkflowConflicts(tempDir, status);

    expect(conflicts).toEqual([
      'workflow-status.md says Specs validated = passed, but specs/*.md is missing.',
    ]);
  });

  it('reports archived-but-still-active conflict', () => {
    writeFile('openspec/changes/add-status/proposal.md', '# Proposal\n');
    const status = synthesizeWorkflowStatus(tempDir, 'add-status');
    status.phase = 'archived';

    const conflicts = detectWorkflowConflicts(tempDir, status);

    expect(conflicts).toContain('workflow-status.md says Phase = archived, but the change directory is still active.');
  });

  it('returns empty array when no conflicts exist', () => {
    writeFile('openspec/changes/add-status/proposal.md', '# Proposal\n');
    writeFile('openspec/changes/add-status/plan-ready.md', '# Plan\n');
    const status = synthesizeWorkflowStatus(tempDir, 'add-status');

    const conflicts = detectWorkflowConflicts(tempDir, status);

    expect(conflicts).toEqual([]);
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
    expect(dashboard).toContain('pending        1');
    expect(dashboard).toContain('Warning: example conflict');
    expect(dashboard).toContain('Run /openflow spec');
  });

  it('renders authoritative status from workflow-status.md', () => {
    writeFile('openspec/changes/add-status/workflow-status.md', `# Workflow Status: add-status

## Summary

- Phase: build
- Capture Mode: proposal
- Status: in_progress
- Last Updated: 2026-06-02
- Next Command: /openflow build
- Next Action: Continue implementation.

## Gates

| Gate | Status | Evidence |
|------|--------|----------|
| Requirements captured | passed | proposal.md |
| Specs validated | passed | openspec validate |
| Plan ready | passed | plan-ready.md |

## Tasks

| ID | Task | Status | Verification | Blocked By | Notes |
|----|------|--------|--------------|------------|-------|
| 1.1 | Add module | in_progress | npm test | - | - |
`);

    const status = loadWorkflowStatus(tempDir, 'add-status');
    const dashboard = renderWorkflowDashboard(status);

    expect(dashboard).toContain('Source: workflow-status.md');
    expect(dashboard).toContain('Phase: build');
    expect(dashboard).toContain('in_progress    1');
    expect(dashboard).toContain('Run /openflow build');
  });
});
