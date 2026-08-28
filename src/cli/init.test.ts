import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ensureOpenSpecProjectContext, initCommand } from './init.js';

describe('OpenSpec project context initialization', () => {
  let tmpDir: string;

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'openflow-init-'));
  });

  afterEach(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  it('creates openspec directory and config.yaml when both are missing', () => {
    ensureOpenSpecProjectContext(tmpDir);

    const config = fs.readFileSync(path.join(tmpDir, 'openspec/config.yaml'), 'utf-8');
    expect(config).toContain('schema: spec-driven');
    expect(config).toContain('language:');
    expect(config).toContain('artifacts: en-US');
    expect(config).toContain('detection: defaulted');
    expect(config).toContain('context: |');
    expect(config).toContain('rules:');
  });

  it('creates config.yaml context scaffold when OpenSpec is initialized without config', () => {
    fs.mkdirSync(path.join(tmpDir, 'openspec'), { recursive: true });

    ensureOpenSpecProjectContext(tmpDir);

    const config = fs.readFileSync(path.join(tmpDir, 'openspec/config.yaml'), 'utf-8');
    expect(config).toContain('schema: spec-driven');
    expect(config).toContain('language:');
    expect(config).toContain('artifacts: en-US');
    expect(config).toContain('human-facing OpenFlow artifacts');
    expect(config).toContain('context: |');
    expect(config).toContain('Superpowers receives it later through plan-ready.md');
    expect(config).toContain('rules:');
    expect(config).toContain('Reference existing specs before inventing new behavior.');
  });

  it('appends context scaffold to config.yaml without context', () => {
    fs.mkdirSync(path.join(tmpDir, 'openspec'), { recursive: true });
    fs.writeFileSync(path.join(tmpDir, 'openspec/config.yaml'), 'schema: spec-driven\n', 'utf-8');

    ensureOpenSpecProjectContext(tmpDir);

    const config = fs.readFileSync(path.join(tmpDir, 'openspec/config.yaml'), 'utf-8');
    expect(config).toContain('schema: spec-driven');
    expect(config).toContain('language:');
    expect(config).toContain('context: |');
    expect(config).toContain('rules:');
  });

  it('appends language scaffold to config.yaml without language preference', () => {
    fs.mkdirSync(path.join(tmpDir, 'openspec'), { recursive: true });
    fs.writeFileSync(
      path.join(tmpDir, 'openspec/config.yaml'),
      'schema: spec-driven\ncontext: |\n  Tech stack: TypeScript\nrules:\n  specs:\n    - Keep existing rule\n',
      'utf-8',
    );

    ensureOpenSpecProjectContext(tmpDir);

    const config = fs.readFileSync(path.join(tmpDir, 'openspec/config.yaml'), 'utf-8');
    expect(config).toContain('language:');
    expect(config).toContain('artifacts: en-US');
    expect(config).toContain('Keep existing rule');
    expect(config.match(/^rules:/gm)).toHaveLength(1);
  });

  it('appends only context when config.yaml already has rules', () => {
    fs.mkdirSync(path.join(tmpDir, 'openspec'), { recursive: true });
    fs.writeFileSync(
      path.join(tmpDir, 'openspec/config.yaml'),
      'schema: spec-driven\nrules:\n  specs:\n    - Keep existing rule\n',
      'utf-8',
    );

    ensureOpenSpecProjectContext(tmpDir);

    const config = fs.readFileSync(path.join(tmpDir, 'openspec/config.yaml'), 'utf-8');
    expect(config).toContain('context: |');
    expect(config).toContain('language:');
    expect(config.match(/^rules:/gm)).toHaveLength(1);
    expect(config).toContain('Keep existing rule');
  });

  it('does not rewrite config.yaml that already has context, language, and rules', () => {
    fs.mkdirSync(path.join(tmpDir, 'openspec'), { recursive: true });
    const original = 'schema: spec-driven\nlanguage:\n  artifacts: zh-CN\n  detection: user-confirmed\ncontext: |\n  Tech stack: TypeScript\nrules:\n  specs:\n    - Keep existing rule\n';
    fs.writeFileSync(path.join(tmpDir, 'openspec/config.yaml'), original, 'utf-8');

    ensureOpenSpecProjectContext(tmpDir);

    expect(fs.readFileSync(path.join(tmpDir, 'openspec/config.yaml'), 'utf-8')).toBe(original);
  });
});

describe('init tool selection', () => {
  let tmpDir: string;

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'openflow-init-tools-'));
    fs.mkdirSync(path.join(tmpDir, 'openspec'), { recursive: true });
    fs.writeFileSync(path.join(tmpDir, 'openspec/config.yaml'), 'schema: spec-driven\n');
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllEnvs();
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  it('shows the selected tools and matching Superpowers guidance', async () => {
    const originalCwd = process.cwd();
    const lines: string[] = [];
    vi.stubEnv('HOME', path.join(tmpDir, 'home'));
    vi.spyOn(console, 'log').mockImplementation((...args: unknown[]) => {
      lines.push(args.join(' '));
    });

    try {
      process.chdir(tmpDir);
      await initCommand.parseAsync(['node', 'openflow', '--tools', 'cursor']);
    } finally {
      process.chdir(originalCwd);
    }

    const output = lines.join('\n');
    expect(output).toContain('Selected tools: cursor');
    expect(output).toContain('Superpowers not found for selected tools: cursor');
    expect(output).toContain('Run `/add-plugin superpowers` in Cursor Agent chat.');
  });

  it('rejects an unsupported tool', async () => {
    initCommand.exitOverride();

    await expect(
      initCommand.parseAsync(['node', 'openflow', '--tools', 'codex;invalid']),
    ).rejects.toThrow('Unsupported tool: codex;invalid');
  });
});
