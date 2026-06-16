import fs from 'node:fs';
import { Command } from 'commander';
import inquirer from 'inquirer';
import path from 'path';
import { checkDependencies, tryAutoInstall, checkOpenSpecInitialized, writeState } from '../core/dependency-check.js';
import { generateSkills } from '../core/skill-generator.js';
import { TOOL_PATHS, DEPS } from '../core/constants.js';
import { logger } from '../utils/logger.js';
import { exec, dirExists, fileExists } from '../utils/shell.js';
import { parse as parseYaml } from 'yaml';

const SUPPORTED_TOOLS = Object.keys(TOOL_PATHS);

export const initCommand = new Command('init')
  .description('Initialize openflow skills in the current project')
  .option('-t, --tools <tools>', 'Target tools, comma-separated', 'claude')
  .option('-g, --global', 'Install skills globally under home tool directories')
  .action(async (options) => {
    const cwd = process.cwd();
    const tools = options.tools.split(',').map((t: string) => t.trim());
    const installGlobally = Boolean(options.global);

    logger.blank();
    logger.info(`openflow init — ${installGlobally ? 'global skill setup' : 'workflow orchestrator setup'}`);
    logger.blank();

    // Step 1: Check OpenSpec
    logger.step('Checking OpenSpec ...');
    let depStatus = checkDependencies({ cwd, tools });

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
        depStatus = checkDependencies({ cwd, tools }); // recheck
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
      logger.success(`Superpowers installed${depStatus.superpowers.path ? ` (${depStatus.superpowers.path})` : ''}`);
    }

    if (installGlobally) {
      logger.step('Skipping project OpenSpec initialization for global install');
    } else {
      // Step 3: Check if OpenSpec is initialized in project
      logger.step('Checking project OpenSpec initialization ...');
      let shouldEnsureContext = checkOpenSpecInitialized(cwd);

      if (!shouldEnsureContext) {
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
            shouldEnsureContext = true;
          }
        } else {
          logger.info('OpenSpec not initialized — directories will be auto-created on first /openflow proposal');
        }
      } else {
        logger.success('OpenSpec project initialized');
      }

      if (shouldEnsureContext) {
        ensureOpenSpecProjectContext(cwd);
      }
    }

    // Step 4: Generate skills
    logger.step('Generating openflow skills ...');
    generateSkills({ cwd, tools, depStatus, global: installGlobally });

    if (!installGlobally) {
      // Step 5: Write state
      writeState(cwd, {
        openspec: depStatus.openspec.installed,
        superpowers: depStatus.superpowers.installed,
        openspecProjectInitialized: checkOpenSpecInitialized(cwd),
        createdAt: new Date().toISOString(),
        tools,
      });
    }

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
    logger.info('  /openflow grill         Optional stress-test before spec');
    logger.info('  /openflow spec           Generate specs + translate');
    logger.info('  /openflow amend          Revise requirements before close');
    logger.info('  /openflow build          Execute implementation');
    logger.info('  /openflow close          Verify + archive');
    logger.blank();
  });

export function ensureOpenSpecProjectContext(cwd: string): void {
  const openspecDir = path.join(cwd, 'openspec');
  if (!dirExists(openspecDir)) {
    fs.mkdirSync(openspecDir, { recursive: true });
  }

  const configPath = path.join(openspecDir, 'config.yaml');
  const legacyProjectPath = path.join(openspecDir, 'project.md');

  if (!fileExists(configPath)) {
    fs.writeFileSync(configPath, getDefaultOpenSpecConfig(), 'utf-8');
    logger.success('Created openspec/config.yaml with OpenFlow context scaffold');
  } else {
    const configContent = fs.readFileSync(configPath, 'utf-8');
    const additions = getMissingConfigScaffold(configContent);
    if (additions) {
      fs.appendFileSync(configPath, `\n${additions}`, 'utf-8');
      logger.success('Added missing context/rules scaffold to openspec/config.yaml');
    } else {
      logger.success('OpenSpec project context configured in openspec/config.yaml');
    }
  }

  if (fileExists(legacyProjectPath)) {
    logger.warn('Legacy openspec/project.md detected. OpenSpec now injects project context from openspec/config.yaml. Review project.md, move useful content into config.yaml context/rules, then delete project.md when ready.');
  }
}

function getMissingConfigScaffold(content: string): string {
  const sections: string[] = [];

  if (!hasTopLevelKey(content, 'context')) {
    sections.push(getContextSection());
  }

  if (!hasTopLevelKey(content, 'rules')) {
    sections.push(getRulesSection());
  }

  return sections.join('\n');
}

function hasTopLevelKey(content: string, key: string): boolean {
  try {
    const doc = parseYaml(content);
    return doc != null && typeof doc === 'object' && key in doc;
  } catch {
    return false;
  }
}

function getDefaultOpenSpecConfig(): string {
  return `schema: spec-driven
${getContextSection()}
${getRulesSection()}`;
}

function getContextSection(): string {
  return `
# Project context is injected into OpenSpec planning artifacts.
# Keep this concise: Superpowers receives it later through plan-ready.md.
context: |
  TODO: Describe the project tech stack, architecture patterns, testing strategy,
  code style, domain constraints, and external dependencies that AI implementers
  must follow.
`;
}

function getRulesSection(): string {
  return `
rules:
  specs:
    - Reference existing specs before inventing new behavior.
    - Every requirement must include concrete scenarios and acceptance checks.
  design:
    - Preserve project architecture patterns and explain any new dependency.
  tasks:
    - Include exact files, tests, verification commands, and rollback notes.
`;
}
