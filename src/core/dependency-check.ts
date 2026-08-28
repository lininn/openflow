import { execSync } from 'child_process';
import { cmdExists, fileExists, dirExists, exec } from '../utils/shell.js';
import { DEPS, TOOL_PATHS, getSuperpowersInstallHint } from './constants.js';
import { logger } from '../utils/logger.js';
import path from 'path';
import os from 'os';
import fs from 'fs';

export interface DepStatus {
  openspec: { installed: boolean; version?: string; autoInstalled?: boolean };
  superpowers: {
    installed: boolean;
    hint?: string;
    path?: string;
    checkedPaths: string[];
    missingTools?: string[];
  };
}

export interface CheckDependencyOptions {
  cwd?: string;
  tools?: string[];
  /** Overridable home directory. Defaults to os.homedir(); primarily for tests. */
  home?: string;
}

export function checkDependencies(options: CheckDependencyOptions = {}): DepStatus {
  const home = options.home ?? os.homedir();
  const cwd = options.cwd ?? process.cwd();
  const hasSelectedTools = Boolean(options.tools?.length);
  const tools = hasSelectedTools ? options.tools! : Object.keys(TOOL_PATHS);

  // Check OpenSpec
  const openspecInstalled = cmdExists(DEPS.openspec.cliCmd);
  let openspecVersion: string | undefined;
  if (openspecInstalled) {
    openspecVersion = exec('openspec --version') || undefined;
  }

  // Check Superpowers in the selected tools' local and global skill dirs.
  const toolChecks = tools.map((tool) => {
    const checkedPaths = getSuperpowersSkillPaths(cwd, home, [tool]);
    return {
      tool,
      checkedPaths,
      path: checkedPaths.find((candidate) => fs.existsSync(candidate)),
    };
  });
  const missingTools = toolChecks.filter((check) => !check.path).map((check) => check.tool);
  const superpowersSkillPath = toolChecks.find((check) => check.path)?.path;
  const superpowersInstalled = hasSelectedTools
    ? missingTools.length === 0
    : Boolean(superpowersSkillPath);
  const superpowersSkillPaths = toolChecks.flatMap((check) => check.checkedPaths);

  return {
    openspec: {
      installed: openspecInstalled,
      version: openspecVersion,
    },
    superpowers: {
      installed: superpowersInstalled,
      hint: superpowersInstalled ? undefined : getSuperpowersInstallHint(missingTools),
      path: superpowersSkillPath,
      checkedPaths: superpowersSkillPaths,
      missingTools,
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

  // OpenCode-specific: superpowers plugin installs to the package cache.
  // The cache structure varies by install source:
  //   npm:   packages/superpowers/node_modules/superpowers/skills/...
  //   git:   packages/superpowers@<protocol>:/<host>/<path>/node_modules/superpowers/skills/...
  // We search up to 4 levels deep for node_modules/superpowers/skills/{checkPath}.
  if (tools.includes('opencode')) {
    const cacheBase = path.join(home, '.cache', 'opencode', 'packages');
    if (fs.existsSync(cacheBase)) {
      const skillsRelPath = path.join('node_modules', 'superpowers', 'skills', DEPS.superpowers.checkPath);
      for (const entry of fs.readdirSync(cacheBase, { withFileTypes: true })) {
        if (!entry.isDirectory() || !entry.name.startsWith('superpowers@')) continue;
        // Walk up to 4 directory levels under the package dir, adding
        // candidates at each level + skillsRelPath.
        const walkDirs = [path.join(cacheBase, entry.name)];
        const visited = new Set<string>();
        for (let depth = 0; depth < 4 && walkDirs.length > 0; depth++) {
          const nextWalk: string[] = [];
          for (const dir of walkDirs) {
            if (visited.has(dir)) continue;
            visited.add(dir);
            candidates.add(path.join(dir, skillsRelPath));
            for (const sub of fs.readdirSync(dir, { withFileTypes: true })) {
              if (sub.isDirectory()) {
                nextWalk.push(path.join(dir, sub.name));
              }
            }
          }
          walkDirs.length = 0;
          walkDirs.push(...nextWalk);
        }
      }
    }
  }

  // Codex plugins install under the marketplace cache rather than
  // ~/.codex/skills/. Include the cached Superpowers writing-plans skill.
  if (tools.includes('codex')) {
    const cacheDir = path.join(home, DEPS.superpowers.codexPluginCacheDir);
    for (const skillPath of scanPluginCacheForSuperpowers(
      cacheDir,
      DEPS.superpowers.pluginSkillPath,
    )) {
      candidates.add(skillPath);
    }
  }

  // Cursor marketplace plugins use a versioned cache. Local development
  // plugins use ~/.cursor/plugins/local/<plugin>.
  if (tools.includes('cursor')) {
    const cacheDir = path.join(home, DEPS.superpowers.cursorPluginCacheDir);
    for (const skillPath of scanPluginCacheForSuperpowers(
      cacheDir,
      DEPS.superpowers.pluginSkillPath,
    )) {
      candidates.add(skillPath);
    }
    candidates.add(path.join(
      home,
      DEPS.superpowers.cursorPluginLocalDir,
      DEPS.superpowers.pluginSkillPath,
    ));
  }

  // Superpowers is usually installed as a Claude Code *plugin*, not into
  // ~/.claude/skills/. Include plugin install locations so that a
  // plugin-based install is detected correctly.
  if (tools.includes('claude')) {
    for (const pluginPath of getClaudePluginSuperpowersPaths(cwd, home)) {
      candidates.add(pluginPath);
    }
  }

  return [...candidates];
}

/**
 * Resolve possible `writing-plans/SKILL.md` locations for Superpowers when
 * installed as a Claude Code plugin.
 *
 * Strategy:
 * 1. Read `.claude/plugins/installed_plugins.json` (authoritative source that
 *    records each plugin's `installPath`) and use the recorded install paths.
 * 2. Fall back to scanning `.claude/plugins/cache` for any versioned plugin
 *    directory containing the skill, in case the registry is missing.
 */
function getClaudePluginSuperpowersPaths(cwd: string, home: string): string[] {
  const results = new Set<string>();
  const pluginSkillPath = DEPS.superpowers.pluginSkillPath;

  for (const root of [home, cwd]) {
    // 1. Registry-based resolution.
    const registryFile = path.join(root, DEPS.superpowers.claudePluginRegistry);
    for (const installPath of readSuperpowersInstallPaths(registryFile)) {
      results.add(path.join(installPath, pluginSkillPath));
    }

    // 2. Cache-directory scan fallback.
    const cacheDir = path.join(root, DEPS.superpowers.claudePluginCacheDir);
    for (const skillPath of scanPluginCacheForSuperpowers(cacheDir, pluginSkillPath)) {
      results.add(skillPath);
    }
  }

  return [...results];
}

function readSuperpowersInstallPaths(registryFile: string): string[] {
  if (!fs.existsSync(registryFile)) return [];

  let registry: unknown;
  try {
    registry = JSON.parse(fs.readFileSync(registryFile, 'utf-8'));
  } catch {
    return [];
  }

  const plugins = (registry as { plugins?: Record<string, unknown> })?.plugins;
  if (!plugins || typeof plugins !== 'object') return [];

  const paths: string[] = [];
  for (const [key, entries] of Object.entries(plugins)) {
    // Match "superpowers@<marketplace>" but not "superpowers-chrome@...".
    const pluginName = key.split('@')[0];
    if (pluginName !== 'superpowers') continue;

    for (const entry of Array.isArray(entries) ? entries : []) {
      const installPath = (entry as { installPath?: string })?.installPath;
      if (typeof installPath === 'string' && installPath) {
        paths.push(installPath);
      }
    }
  }
  return paths;
}

function scanPluginCacheForSuperpowers(cacheDir: string, pluginSkillPath: string): string[] {
  if (!fs.existsSync(cacheDir)) return [];

  const results: string[] = [];
  let marketplaces: fs.Dirent[];
  try {
    marketplaces = fs.readdirSync(cacheDir, { withFileTypes: true });
  } catch {
    return [];
  }

  for (const marketplace of marketplaces) {
    if (!marketplace.isDirectory()) continue;
    const pluginDir = path.join(cacheDir, marketplace.name, 'superpowers');
    if (!fs.existsSync(pluginDir)) continue;

    let versions: fs.Dirent[];
    try {
      versions = fs.readdirSync(pluginDir, { withFileTypes: true });
    } catch {
      continue;
    }

    for (const version of versions) {
      if (!version.isDirectory()) continue;
      results.push(path.join(pluginDir, version.name, pluginSkillPath));
    }
  }
  return results;
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
