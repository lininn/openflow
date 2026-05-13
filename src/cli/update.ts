import { Command } from 'commander';
import { checkDependencies, readState, writeState, checkOpenSpecInitialized } from '../core/dependency-check.js';
import { generateSkills } from '../core/skill-generator.js';
import { logger } from '../utils/logger.js';

export const updateCommand = new Command('update')
  .description('Regenerate openflow skills in the current project')
  .action(() => {
    const cwd = process.cwd();
    const state = readState(cwd);

    if (!state) {
      logger.error('Project not initialized — run openflow init first');
      return;
    }

    logger.blank();
    logger.info('openflow update — regenerating skills');
    logger.blank();

    const depStatus = checkDependencies();
    generateSkills({
      cwd,
      tools: state.tools,
      depStatus,
    });

    writeState(cwd, {
      ...state,
      openspec: depStatus.openspec.installed,
      superpowers: depStatus.superpowers.installed,
      openspecProjectInitialized: checkOpenSpecInitialized(cwd),
    });

    logger.blank();
    logger.success('Skills updated');
    logger.blank();
  });
