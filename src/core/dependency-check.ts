import { execSync } from 'child_process';
import { cmdExists, fileExists, dirExists, exec } from '../utils/shell.js';
import { DEPS, TOOL_PATHS } from './constants.js';
import { logger } from '../utils/logger.js';
import path from 'path';
import os from 'os';
import fs from 'fs';

export interface DepStatus {
  openspec: { installed: boolean; version?: string; autoInstalled?: boolean };
  superpowers: { installed: boolean; hint?: string };
}

export function checkDependencies(): DepStatus {
  const home = os.homedir();

  // Check OpenSpec
  const openspecInstalled = cmdExists(DEPS.openspec.cliCmd);
  let openspecVersion: string | undefined;
  if (openspecInstalled) {
    openspecVersion = exec('openspec --version') || undefined;
  }

  // Check Superpowers
  const superpowersSkillPath = path.join(home, '.claude', 'skills', DEPS.superpowers.checkPath);
  const superpowersInstalled = fileExists(superpowersSkillPath);

  return {
    openspec: {
      installed: openspecInstalled,
      version: openspecVersion,
    },
    superpowers: {
      installed: superpowersInstalled,
      hint: superpowersInstalled ? undefined : DEPS.superpowers.installHint,
    },
  };
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
  return dirExists(path.join(cwd, 'openspec'));
}

export interface InitState {
  openspec: boolean;
  superpowers: boolean;
  openspecProjectInitialized: boolean;
  createdAt: string;
  tools: string[];
}

export function readState(cwd: string): InitState | null {
  const stateFile = path.join(cwd, '.claude', 'openflow-state.json');
  if (!fileExists(stateFile)) return null;
  try {
    return JSON.parse(fs.readFileSync(stateFile, 'utf-8'));
  } catch {
    return null;
  }
}

export function writeState(cwd: string, state: InitState): void {
  const stateDir = path.join(cwd, '.claude');
  if (!dirExists(stateDir)) {
    fs.mkdirSync(stateDir, { recursive: true });
  }
  const stateFile = path.join(stateDir, 'openflow-state.json');
  fs.writeFileSync(stateFile, JSON.stringify(state, null, 2) + '\n');
}
