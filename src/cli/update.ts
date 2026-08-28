import { Command } from 'commander';
import { checkDependencies, readState, writeState, checkOpenSpecInitialized } from '../core/dependency-check.js';
import { generateSkills } from '../core/skill-generator.js';
import { logger } from '../utils/logger.js';
import { parseToolOption } from './tool-selection.js';

export const updateCommand = new Command('update')
  .description('Regenerate openflow skills in the current project')
  .option('-t, --tools <tools>', 'Override target tools, comma-separated', parseToolOption)
  .action((options) => {
    const cwd = process.cwd();
    const state = readState(cwd);

    if (!state) {
      logger.error('Project not initialized — run openflow init first');
      return;
    }

    let tools: string[];
    if (options.tools) {
      tools = options.tools as string[];
    } else {
      try {
        const savedTools = Array.isArray(state.tools) ? state.tools.join(',') : '';
        tools = parseToolOption(savedTools);
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        logger.error(`Saved tool selection is invalid: ${message}`);
        logger.info('Run openflow update --tools <tools> to replace it');
        return;
      }
    }

    logger.blank();
    logger.info('openflow update — regenerating skills');
    logger.info(`Selected tools: ${tools.join(', ')}`);
    logger.blank();

    const depStatus = checkDependencies({ cwd, tools });
    generateSkills({
      cwd,
      tools,
      depStatus,
    });

    writeState(cwd, {
      ...state,
      openspec: depStatus.openspec.installed,
      superpowers: depStatus.superpowers.installed,
      openspecProjectInitialized: checkOpenSpecInitialized(cwd),
      tools,
    });

    logger.blank();
    logger.success('Skills updated');
    logger.blank();
  });
