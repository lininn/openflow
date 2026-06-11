import { Command } from 'commander';
import path from 'path';
import fs from 'fs';
import { checkDependencies, readState, checkOpenSpecInitialized } from '../core/dependency-check.js';
import { logger } from '../utils/logger.js';
import { dirExists } from '../utils/shell.js';

export const statusCommand = new Command('status')
  .description('Show dependency status and active changes')
  .action(() => {
    const cwd = process.cwd();

    logger.blank();
    logger.info('openflow status');
    logger.blank();

    const state = readState(cwd);

    // Dependencies
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

    // Project state
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

    // Active changes
    logger.step('Active changes:');
    const changesDir = path.join(cwd, 'openspec', 'changes');

    if (!dirExists(changesDir)) {
      logger.info('  None');
      return;
    }

    const entries = fs.readdirSync(changesDir, { withFileTypes: true })
      .filter((d) => d.isDirectory() && d.name !== 'archive');

    if (entries.length === 0) {
      logger.info('  None');
      return;
    }

    for (const entry of entries) {
      const changeDir = path.join(changesDir, entry.name);
      const hasPlanReady = fs.existsSync(path.join(changeDir, 'plan-ready.md'));
      const hasProposal = fs.existsSync(path.join(changeDir, 'proposal.md'));

      let status = '';
      if (hasPlanReady) {
        status = '→ ready for /openflow build or /openflow amend';
      } else if (hasProposal) {
        status = '→ ready for /openflow grill or /openflow spec';
      } else {
        status = '→ needs /openflow proposal';
      }

      logger.info(`  ${entry.name} ${status}`);
    }

    logger.blank();
  });
