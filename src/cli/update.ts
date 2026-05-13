import { Command } from 'commander';
import { checkDependencies, readState, writeState, checkOpenSpecInitialized } from '../core/dependency-check.js';
import { generateSkills } from '../core/skill-generator.js';
import { logger } from '../utils/logger.js';

export const updateCommand = new Command('update')
  .description('重新生成项目内的 openflow skills')
  .action(() => {
    const cwd = process.cwd();
    const state = readState(cwd);

    if (!state) {
      logger.error('项目未初始化，请先运行 openflow init');
      return;
    }

    logger.blank();
    logger.info('openflow update — 重新生成 skills');
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
    logger.success('skills 已更新');
    logger.blank();
  });
