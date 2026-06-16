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
      if (name === 'Requirements captured') return { name, status: hasProposal ? 'passed' as const : 'pending' as const, evidence: hasProposal ? 'proposal.md' : '-' };
      if (name === 'Specs validated') return { name, status: hasSpecs ? 'passed' as const : 'pending' as const, evidence: hasSpecs ? 'specs/' : '-' };
      if (name === 'Plan ready') return { name, status: hasPlanReady ? 'passed' as const : 'pending' as const, evidence: hasPlanReady ? 'plan-ready.md' : '-' };
      if (name === 'Implementation complete') return { name, status: implementationComplete ? 'passed' as const : 'pending' as const, evidence: implementationComplete ? 'docs/superpowers/plans/' : '-' };
      return { name, status: 'pending' as const, evidence: '-' };
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
    gates: gates.length ? gates : DEFAULT_GATES.map((name) => ({ name, status: 'pending' as const, evidence: '-' })),
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
      status: 'pending' as const,
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
