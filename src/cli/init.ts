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
  .description('Initialize openflow skills in the current project')
  .option('-t, --tools <tools>', 'Target tools, comma-separated', 'claude')
  .action(async (options) => {
    const cwd = process.cwd();
    const tools = options.tools.split(',').map((t: string) => t.trim());

    logger.blank();
    logger.info('openflow init — workflow orchestrator setup');
    logger.blank();

    // Step 1: Check OpenSpec
    logger.step('Checking OpenSpec ...');
    let depStatus = checkDependencies();

    if (!depStatus.openspec.installed) {
      logger.warn('OpenSpec CLI not installed');
      const { installOpenSpec } = await inquirer.prompt([
        {
          type: 'confirm',
          name: 'installOpenSpec',
          message: `Auto-install? (npm install -g ${DEPS.openspec.npmPkg}@latest)`,
          default: true,
        },
      ]);

      if (installOpenSpec) {
        const ok = tryAutoInstall(DEPS.openspec.npmPkg);
        depStatus = checkDependencies(); // recheck
        if (ok) depStatus.openspec.autoInstalled = true;
      } else {
        logger.warn('Skipped OpenSpec install — spec phase will use manual fallback');
      }
    } else {
      logger.success(`OpenSpec CLI installed${depStatus.openspec.version ? ` (v${depStatus.openspec.version})` : ''}`);
    }

    // Step 2: Check Superpowers
    logger.step('Checking Superpowers ...');

    if (!depStatus.superpowers.installed) {
      logger.warn('Superpowers not installed');
      logger.info(DEPS.superpowers.installHint);
      logger.info('Re-run openflow init after installing, or build phase will use manual fallback');
    } else {
      logger.success('Superpowers installed');
    }

    // Step 3: Check if OpenSpec is initialized in project
    logger.step('Checking project OpenSpec initialization ...');
    if (!checkOpenSpecInitialized(cwd)) {
      if (depStatus.openspec.installed) {
        const { initOpenSpec } = await inquirer.prompt([
          {
            type: 'confirm',
            name: 'initOpenSpec',
            message: 'OpenSpec not initialized in this project. Run openspec init?',
            default: true,
          },
        ]);

        if (initOpenSpec) {
          const toolsFlag = tools.map((t: string) => t).join(',');
          exec(`openspec init --tools ${toolsFlag}`, { stdio: 'inherit' });
          logger.success('OpenSpec project initialized');
        }
      } else {
        logger.info('OpenSpec not initialized — directories will be auto-created on first /openflow proposal');
      }
    } else {
      logger.success('OpenSpec project initialized');
    }

    // Step 4: Generate skills
    logger.step('Generating openflow skills ...');
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
    logger.success('openflow initialized!');
    logger.blank();

    if (!depStatus.superpowers.installed) {
      logger.warn('Note: Superpowers not installed — /openflow build will use manual execution mode');
      logger.info(`  Install with: ${DEPS.superpowers.installHint}`);
      logger.blank();
    }

    logger.info('Available commands:');
    logger.info('  /openflow proposal      Quick requirement capture');
    logger.info('  /openflow brainstorming  Deep design exploration');
    logger.info('  /openflow spec           Generate specs + translate');
    logger.info('  /openflow build          Execute implementation');
    logger.info('  /openflow close          Verify + archive');
    logger.blank();
  });
