import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { checkDependencies, checkOpenSpecInitialized } from './dependency-check.js';

describe('checkOpenSpecInitialized', () => {
  let tmpDir: string;

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'openflow-deps-'));
  });

  afterEach(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  it('does not treat an empty openspec directory as initialized', () => {
    fs.mkdirSync(path.join(tmpDir, 'openspec'), { recursive: true });

    expect(checkOpenSpecInitialized(tmpDir)).toBe(false);
  });

  it('treats openspec/config.yaml as initialized project context', () => {
    fs.mkdirSync(path.join(tmpDir, 'openspec'), { recursive: true });
    fs.writeFileSync(path.join(tmpDir, 'openspec/config.yaml'), 'schema: spec-driven\n', 'utf-8');

    expect(checkOpenSpecInitialized(tmpDir)).toBe(true);
  });

  it('treats legacy openspec/project.md as initialized so context migration can run', () => {
    fs.mkdirSync(path.join(tmpDir, 'openspec'), { recursive: true });
    fs.writeFileSync(path.join(tmpDir, 'openspec/project.md'), '# Project\n', 'utf-8');

    expect(checkOpenSpecInitialized(tmpDir)).toBe(true);
  });
});

describe('checkDependencies Superpowers plugin detection', () => {
  let tmpDir: string;
  let fakeHome: string;

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'openflow-sp-'));
    // Isolated empty home so the real machine's ~/.claude plugins never leak in.
    fakeHome = path.join(tmpDir, 'fake-home');
    fs.mkdirSync(fakeHome, { recursive: true });
  });

  afterEach(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  it('detects Superpowers installed as a Claude plugin via installed_plugins.json', () => {
    // Simulate a plugin installed to an arbitrary location recorded in the registry.
    const installPath = path.join(tmpDir, 'plugins-store', 'superpowers-1.2.3');
    fs.mkdirSync(path.join(installPath, 'skills', 'writing-plans'), { recursive: true });
    fs.writeFileSync(
      path.join(installPath, 'skills', 'writing-plans', 'SKILL.md'),
      '# writing-plans\n',
      'utf-8',
    );

    const registryDir = path.join(tmpDir, '.claude', 'plugins');
    fs.mkdirSync(registryDir, { recursive: true });
    fs.writeFileSync(
      path.join(registryDir, 'installed_plugins.json'),
      JSON.stringify({
        version: 2,
        plugins: {
          'superpowers@my-marketplace': [{ installPath }],
        },
      }),
      'utf-8',
    );

    const status = checkDependencies({ cwd: tmpDir, home: fakeHome, tools: ['claude'] });
    expect(status.superpowers.installed).toBe(true);
    expect(status.superpowers.path).toBe(
      path.join(installPath, 'skills', 'writing-plans', 'SKILL.md'),
    );
  });

  it('detects Superpowers by scanning the plugin cache when the registry is missing', () => {
    const skillFile = path.join(
      tmpDir,
      '.claude',
      'plugins',
      'cache',
      'my-marketplace',
      'superpowers',
      '4.5.6',
      'skills',
      'writing-plans',
      'SKILL.md',
    );
    fs.mkdirSync(path.dirname(skillFile), { recursive: true });
    fs.writeFileSync(skillFile, '# writing-plans\n', 'utf-8');

    const status = checkDependencies({ cwd: tmpDir, home: fakeHome, tools: ['claude'] });
    expect(status.superpowers.installed).toBe(true);
    expect(status.superpowers.path).toBe(skillFile);
  });

  it('does not match superpowers-chrome as the superpowers plugin', () => {
    const installPath = path.join(tmpDir, 'plugins-store', 'superpowers-chrome-1.0.0');
    fs.mkdirSync(path.join(installPath, 'skills', 'writing-plans'), { recursive: true });
    fs.writeFileSync(
      path.join(installPath, 'skills', 'writing-plans', 'SKILL.md'),
      '# not the real one\n',
      'utf-8',
    );

    const registryDir = path.join(tmpDir, '.claude', 'plugins');
    fs.mkdirSync(registryDir, { recursive: true });
    fs.writeFileSync(
      path.join(registryDir, 'installed_plugins.json'),
      JSON.stringify({
        version: 2,
        plugins: {
          'superpowers-chrome@my-marketplace': [{ installPath }],
        },
      }),
      'utf-8',
    );

    const status = checkDependencies({ cwd: tmpDir, home: fakeHome, tools: ['claude'] });
    expect(status.superpowers.installed).toBe(false);
  });

  it('ignores plugin locations when claude is not among the selected tools', () => {
    const skillFile = path.join(
      tmpDir,
      '.claude',
      'plugins',
      'cache',
      'my-marketplace',
      'superpowers',
      '4.5.6',
      'skills',
      'writing-plans',
      'SKILL.md',
    );
    fs.mkdirSync(path.dirname(skillFile), { recursive: true });
    fs.writeFileSync(skillFile, '# writing-plans\n', 'utf-8');

    const status = checkDependencies({ cwd: tmpDir, home: fakeHome, tools: ['codex'] });
    expect(status.superpowers.installed).toBe(false);
  });

  it('detects Superpowers in the Codex plugin cache', () => {
    const skillFile = path.join(
      fakeHome,
      '.codex',
      'plugins',
      'cache',
      'openai-curated',
      'superpowers',
      '11c74d6b',
      'skills',
      'writing-plans',
      'SKILL.md',
    );
    fs.mkdirSync(path.dirname(skillFile), { recursive: true });
    fs.writeFileSync(skillFile, '# writing-plans\n', 'utf-8');

    const status = checkDependencies({ cwd: tmpDir, home: fakeHome, tools: ['codex'] });
    expect(status.superpowers.installed).toBe(true);
    expect(status.superpowers.path).toBe(skillFile);
  });

  it('ignores the Codex plugin cache when codex is not among the selected tools', () => {
    const skillFile = path.join(
      fakeHome,
      '.codex',
      'plugins',
      'cache',
      'openai-curated',
      'superpowers',
      '11c74d6b',
      'skills',
      'writing-plans',
      'SKILL.md',
    );
    fs.mkdirSync(path.dirname(skillFile), { recursive: true });
    fs.writeFileSync(skillFile, '# writing-plans\n', 'utf-8');

    const status = checkDependencies({ cwd: tmpDir, home: fakeHome, tools: ['cursor'] });
    expect(status.superpowers.installed).toBe(false);
  });

  it('reports the selected tools that are still missing Superpowers', () => {
    const skillFile = path.join(
      fakeHome,
      '.codex',
      'plugins',
      'cache',
      'openai-curated',
      'superpowers',
      '11c74d6b',
      'skills',
      'writing-plans',
      'SKILL.md',
    );
    fs.mkdirSync(path.dirname(skillFile), { recursive: true });
    fs.writeFileSync(skillFile, '# writing-plans\n', 'utf-8');

    const status = checkDependencies({ cwd: tmpDir, home: fakeHome, tools: ['codex', 'cursor'] });
    expect(status.superpowers.installed).toBe(false);
    expect(status.superpowers.missingTools).toEqual(['cursor']);
    expect(status.superpowers.hint).toBe('Run `/add-plugin superpowers` in Cursor Agent chat.');
  });

  it('detects Superpowers in the Cursor marketplace cache', () => {
    const skillFile = path.join(
      fakeHome,
      '.cursor',
      'plugins',
      'cache',
      'cursor-public',
      'superpowers',
      'abc123',
      'skills',
      'writing-plans',
      'SKILL.md',
    );
    fs.mkdirSync(path.dirname(skillFile), { recursive: true });
    fs.writeFileSync(skillFile, '# writing-plans\n', 'utf-8');

    const status = checkDependencies({ cwd: tmpDir, home: fakeHome, tools: ['cursor'] });
    expect(status.superpowers.installed).toBe(true);
    expect(status.superpowers.path).toBe(skillFile);
  });

  it('detects Superpowers in the OpenCode package cache (nested git-URL layout)', () => {
    // Mirrors the real OpenCode git install layout from issue #19:
    //   ~/.cache/opencode/packages/superpowers@git+https:/github.com/obra/superpowers.git/
    //     node_modules/superpowers/skills/writing-plans/SKILL.md
    const skillFile = path.join(
      fakeHome,
      '.cache',
      'opencode',
      'packages',
      'superpowers@git+https:',
      'github.com',
      'obra',
      'superpowers.git',
      'node_modules',
      'superpowers',
      'skills',
      'writing-plans',
      'SKILL.md',
    );
    fs.mkdirSync(path.dirname(skillFile), { recursive: true });
    fs.writeFileSync(skillFile, '# writing-plans\n', 'utf-8');

    const status = checkDependencies({ cwd: tmpDir, home: fakeHome, tools: ['opencode'] });
    expect(status.superpowers.installed).toBe(true);
    expect(status.superpowers.path).toBe(skillFile);
  });

  it('detects Superpowers in the OpenCode package cache (flat npm layout)', () => {
    const skillFile = path.join(
      fakeHome,
      '.cache',
      'opencode',
      'packages',
      'superpowers@1.2.3',
      'node_modules',
      'superpowers',
      'skills',
      'writing-plans',
      'SKILL.md',
    );
    fs.mkdirSync(path.dirname(skillFile), { recursive: true });
    fs.writeFileSync(skillFile, '# writing-plans\n', 'utf-8');

    const status = checkDependencies({ cwd: tmpDir, home: fakeHome, tools: ['opencode'] });
    expect(status.superpowers.installed).toBe(true);
    expect(status.superpowers.path).toBe(skillFile);
  });

  it('ignores the OpenCode package cache when opencode is not among the selected tools', () => {
    const skillFile = path.join(
      fakeHome,
      '.cache',
      'opencode',
      'packages',
      'superpowers@1.2.3',
      'node_modules',
      'superpowers',
      'skills',
      'writing-plans',
      'SKILL.md',
    );
    fs.mkdirSync(path.dirname(skillFile), { recursive: true });
    fs.writeFileSync(skillFile, '# writing-plans\n', 'utf-8');

    const status = checkDependencies({ cwd: tmpDir, home: fakeHome, tools: ['codex'] });
    expect(status.superpowers.installed).toBe(false);
  });
});
