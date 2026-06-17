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
