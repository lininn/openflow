import { Command } from 'commander';
import inquirer from 'inquirer';
import path from 'path';
import { checkDependencies, tryAutoInstall, checkOpenSpecInitialized, writeState } from '../core/dependency-check.js';
import { generateSkills } from '../core/skill-generator.js';
import { TOOL_PATHS, DEPS } from '../core/constants.js';
import { logger } from '../utils/logger.js';
import { exec, dirExists } from '../utils/shell.js';

const SUPPORTED_TOOLS = Object.keys(TOOL_PATHS);

export const initCommand = new Command('init')
  .description('在当前项目初始化 openflow skills')
  .option('-t, --tools <tools>', '目标工具，逗号分隔', 'claude')
  .action(async (options) => {
    const cwd = process.cwd();
    const tools = options.tools.split(',').map((t: string) => t.trim());

    logger.blank();
    logger.info('openflow init — 初始化工作流协调器');
    logger.blank();

    // Step 1: Check OpenSpec
    logger.step('检测 OpenSpec ...');
    let depStatus = checkDependencies();

    if (!depStatus.openspec.installed) {
      logger.warn('OpenSpec CLI 未安装');
      const { installOpenSpec } = await inquirer.prompt([
        {
          type: 'confirm',
          name: 'installOpenSpec',
          message: `是否自动安装？(npm install -g ${DEPS.openspec.npmPkg}@latest)`,
          default: true,
        },
      ]);

      if (installOpenSpec) {
        const ok = tryAutoInstall(DEPS.openspec.npmPkg);
        depStatus = checkDependencies(); // recheck
        if (ok) depStatus.openspec.autoInstalled = true;
      } else {
        logger.warn('跳过 OpenSpec 安装，spec 阶段将使用手动降级模式');
      }
    } else {
      logger.success(`OpenSpec CLI 已安装${depStatus.openspec.version ? ` (v${depStatus.openspec.version})` : ''}`);
    }

    // Step 2: Check Superpowers
    logger.step('检测 Superpowers ...');

    if (!depStatus.superpowers.installed) {
      logger.warn('Superpowers 未安装');
      logger.info(DEPS.superpowers.installHint);
      logger.info('安装后可重新运行 openflow init，或 build 阶段将使用手动降级模式');
    } else {
      logger.success('Superpowers 已安装');
    }

    // Step 3: Check if OpenSpec is initialized in project
    logger.step('检测项目 OpenSpec 初始化 ...');
    if (!checkOpenSpecInitialized(cwd)) {
      if (depStatus.openspec.installed) {
        const { initOpenSpec } = await inquirer.prompt([
          {
            type: 'confirm',
            name: 'initOpenSpec',
            message: '项目未初始化 OpenSpec，是否运行 openspec init？',
            default: true,
          },
        ]);

        if (initOpenSpec) {
          const toolsFlag = tools.map((t: string) => t).join(',');
          exec(`openspec init --tools ${toolsFlag}`, { stdio: 'inherit' });
          logger.success('OpenSpec 项目初始化完成');
        }
      } else {
        logger.info('项目未初始化 OpenSpec，将在首次使用 /openflow proposal 时自动创建目录');
      }
    } else {
      logger.success('OpenSpec 项目已初始化');
    }

    // Step 4: Generate skills
    logger.step('生成 openflow skills ...');
    generateSkills({ cwd, tools, depStatus });

    // Step 5: Write state
    writeState(cwd, {
      openspec: depStatus.openspec.installed,
      superpowers: depStatus.superpowers.installed,
      openspecProjectInitialized: checkOpenSpecInitialized(cwd),
      createdAt: new Date().toISOString(),
      tools,
    });

    logger.blank();
    logger.success('openflow 初始化完成！');
    logger.blank();

    if (!depStatus.superpowers.installed) {
      logger.warn('提示: Superpowers 未安装，/openflow build 将使用手动执行模式');
      logger.info(`  安装方式: ${DEPS.superpowers.installHint}`);
      logger.blank();
    }

    logger.info('可用命令:');
    logger.info('  /openflow proposal      轻量需求捕获');
    logger.info('  /openflow brainstorming  深度设计探索');
    logger.info('  /openflow spec           生成规格 + 翻译');
    logger.info('  /openflow build          执行实现');
    logger.info('  /openflow close          验证归档');
    logger.blank();
  });
