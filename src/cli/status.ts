import { Command } from 'commander';
import path from 'path';
import fs from 'fs';
import { checkDependencies, readState, checkOpenSpecInitialized } from '../core/dependency-check.js';
import { logger } from '../utils/logger.js';
import { dirExists } from '../utils/shell.js';

export const statusCommand = new Command('status')
  .description('显示依赖状态和活跃变更')
  .action(() => {
    const cwd = process.cwd();

    logger.blank();
    logger.info('openflow status');
    logger.blank();

    // Dependencies
    logger.step('依赖:');
    const depStatus = checkDependencies();

    if (depStatus.openspec.installed) {
      logger.success(`OpenSpec CLI${depStatus.openspec.version ? ` v${depStatus.openspec.version}` : ''}`);
    } else {
      logger.warn('OpenSpec CLI — 未安装');
    }

    if (depStatus.superpowers.installed) {
      logger.success('Superpowers');
    } else {
      logger.warn('Superpowers — 未安装 (build 阶段将使用手动模式)');
    }

    logger.blank();

    // Project state
    logger.step('项目:');
    const state = readState(cwd);

    if (state) {
      logger.success(`已初始化 (${state.tools.join(', ')})`);
      logger.info(`  初始化时间: ${state.createdAt}`);
    } else {
      logger.warn('未初始化，请运行 openflow init');
      return;
    }

    if (checkOpenSpecInitialized(cwd)) {
      logger.success('OpenSpec 项目已初始化');
    } else {
      logger.warn('OpenSpec 项目未初始化');
    }

    logger.blank();

    // Active changes
    logger.step('活跃变更:');
    const changesDir = path.join(cwd, 'openspec', 'changes');
    const archiveDir = path.join(changesDir, 'archive');

    if (!dirExists(changesDir)) {
      logger.info('  无');
      return;
    }

    const entries = fs.readdirSync(changesDir, { withFileTypes: true })
      .filter((d) => d.isDirectory() && d.name !== 'archive');

    if (entries.length === 0) {
      logger.info('  无');
      return;
    }

    for (const entry of entries) {
      const changeDir = path.join(changesDir, entry.name);
      const hasPlanReady = fs.existsSync(path.join(changeDir, 'plan-ready.md'));
      const hasProposal = fs.existsSync(path.join(changeDir, 'proposal.md'));

      let status = '';
      if (hasPlanReady) {
        status = '→ ready for /openflow build';
      } else if (hasProposal) {
        status = '→ needs /openflow spec';
      } else {
        status = '→ needs /openflow proposal';
      }

      logger.info(`  ${entry.name} ${status}`);
    }

    logger.blank();
  });
