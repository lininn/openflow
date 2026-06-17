import { execSync } from 'child_process';
import { cmdExists, fileExists, dirExists, exec } from '../utils/shell.js';
import { DEPS, TOOL_PATHS } from './constants.js';
import { logger } from '../utils/logger.js';
import path from 'path';
import os from 'os';
import fs from 'fs';

export interface DepStatus {
  openspec: { installed: boolean; version?: string; autoInstalled?: boolean };
  superpowers: { installed: boolean; hint?: string; path?: string; checkedPaths: string[] };
}

export interface CheckDependencyOptions {
  cwd?: string;
  tools?: string[];
}

export function checkDependencies(options: CheckDependencyOptions = {}): DepStatus {
  const home = os.homedir();
  const cwd = options.cwd ?? process.cwd();
  const tools = options.tools?.length ? options.tools : Object.keys(TOOL_PATHS);

  // Check OpenSpec
  const openspecInstalled = cmdExists(DEPS.openspec.cliCmd);
  let openspecVersion: string | undefined;
  if (openspecInstalled) {
    openspecVersion = exec('openspec --version') || undefined;
  }

  // Check Superpowers in the selected tools' local and global skill dirs.
  const superpowersSkillPaths = getSuperpowersSkillPaths(cwd, home, tools);
  const superpowersSkillPath = superpowersSkillPaths.find((candidate) => fs.existsSync(candidate));
  const superpowersInstalled = Boolean(superpowersSkillPath);

  return {
    openspec: {
      installed: openspecInstalled,
      version: openspecVersion,
    },
    superpowers: {
      installed: superpowersInstalled,
      hint: superpowersInstalled ? undefined : DEPS.superpowers.installHint,
      path: superpowersSkillPath,
      checkedPaths: superpowersSkillPaths,
    },
  };
}

function getSuperpowersSkillPaths(cwd: string, home: string, tools: string[]): string[] {
  const candidates = new Set<string>();

  for (const tool of tools) {
    const toolPaths = TOOL_PATHS[tool];
    if (!toolPaths) continue;

    candidates.add(path.join(cwd, toolPaths.skillsDir, DEPS.superpowers.checkPath));
    candidates.add(path.join(home, toolPaths.skillsDir, DEPS.superpowers.checkPath));
  }

  return [...candidates];
}

export function tryAutoInstall(pkg: string): boolean {
  logger.step(`Installing ${pkg} ...`);
  try {
    execSync(`npm install -g ${pkg}@latest`, { stdio: 'inherit' });
    logger.success(`${pkg} installed`);
    return true;
  } catch {
    logger.error(`Failed to install ${pkg} — please run manually: npm install -g ${pkg}@latest`);
    return false;
  }
}

export function checkOpenSpecInitialized(cwd: string): boolean {
  const openspecDir = path.join(cwd, 'openspec');
  return (
    dirExists(openspecDir) &&
    (fileExists(path.join(openspecDir, 'config.yaml')) || fileExists(path.join(openspecDir, 'project.md')))
  );
}

export interface InitState {
  openspec: boolean;
  superpowers: boolean;
  openspecProjectInitialized: boolean;
  createdAt: string;
  tools: string[];
}

export function readState(cwd: string): InitState | null {
  for (const stateFile of getStateFileCandidates(cwd)) {
    if (!fileExists(stateFile)) continue;
    try {
      return JSON.parse(fs.readFileSync(stateFile, 'utf-8'));
    } catch {
      return null;
    }
  }

  return null;
}

export function writeState(cwd: string, state: InitState): void {
  const stateDir = path.join(cwd, '.openflow');
  if (!dirExists(stateDir)) {
    fs.mkdirSync(stateDir, { recursive: true });
  }
  const stateFile = path.join(stateDir, 'state.json');
  fs.writeFileSync(stateFile, JSON.stringify(state, null, 2) + '\n');
}

function getStateFileCandidates(cwd: string): string[] {
  return [
    path.join(cwd, '.openflow', 'state.json'),
    path.join(cwd, '.claude', 'openflow-state.json'),
  ];
}
