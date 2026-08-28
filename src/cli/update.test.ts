import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { updateCommand } from './update.js';

describe('update tool selection', () => {
  let tmpDir: string;

  beforeEach(() => {
    updateCommand.setOptionValue('tools', undefined);
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'openflow-update-tools-'));
    fs.mkdirSync(path.join(tmpDir, '.openflow'), { recursive: true });
    fs.writeFileSync(
      path.join(tmpDir, '.openflow/state.json'),
      JSON.stringify({
        openspec: true,
        superpowers: false,
        openspecProjectInitialized: false,
        createdAt: '2026-08-28T00:00:00.000Z',
        tools: ['claude'],
      }),
    );
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllEnvs();
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  it('uses and saves a --tools override', async () => {
    const originalCwd = process.cwd();
    const lines: string[] = [];
    vi.stubEnv('HOME', path.join(tmpDir, 'home'));
    vi.spyOn(console, 'log').mockImplementation((...args: unknown[]) => {
      lines.push(args.join(' '));
    });
    updateCommand.exitOverride();

    try {
      process.chdir(tmpDir);
      await updateCommand.parseAsync(['node', 'openflow', '--tools', 'codex']);
    } finally {
      process.chdir(originalCwd);
    }

    const state = JSON.parse(fs.readFileSync(path.join(tmpDir, '.openflow/state.json'), 'utf-8'));
    expect(state.tools).toEqual(['codex']);
    expect(fs.existsSync(path.join(tmpDir, '.codex/skills/openflow/SKILL.md'))).toBe(true);
    expect(fs.existsSync(path.join(tmpDir, '.claude/skills/openflow/SKILL.md'))).toBe(false);
    expect(lines.join('\n')).toContain('Selected tools: codex');
  });

  it('uses the saved tools when no override is given', async () => {
    const originalCwd = process.cwd();
    const lines: string[] = [];
    vi.stubEnv('HOME', path.join(tmpDir, 'home'));
    vi.spyOn(console, 'log').mockImplementation((...args: unknown[]) => {
      lines.push(args.join(' '));
    });

    try {
      process.chdir(tmpDir);
      await updateCommand.parseAsync(['node', 'openflow']);
    } finally {
      process.chdir(originalCwd);
    }

    const state = JSON.parse(fs.readFileSync(path.join(tmpDir, '.openflow/state.json'), 'utf-8'));
    expect(state.tools).toEqual(['claude']);
    expect(fs.existsSync(path.join(tmpDir, '.claude/skills/openflow/SKILL.md'))).toBe(true);
    expect(lines.join('\n')).toContain('Selected tools: claude');
  });

  it('rejects an empty tool selection', async () => {
    updateCommand.exitOverride();

    await expect(
      updateCommand.parseAsync(['node', 'openflow', '--tools', ',']),
    ).rejects.toThrow('Select at least one tool');
  });

  it('rejects an unsupported tool saved by an older version', async () => {
    const stateFile = path.join(tmpDir, '.openflow/state.json');
    const state = JSON.parse(fs.readFileSync(stateFile, 'utf-8'));
    fs.writeFileSync(stateFile, JSON.stringify({ ...state, tools: ['unsupported'] }));
    const originalCwd = process.cwd();
    const errors: string[] = [];
    vi.spyOn(console, 'error').mockImplementation((...args: unknown[]) => {
      errors.push(args.join(' '));
    });

    try {
      process.chdir(tmpDir);
      await updateCommand.parseAsync(['node', 'openflow']);
    } finally {
      process.chdir(originalCwd);
    }

    expect(errors.join('\n')).toContain('Saved tool selection is invalid: Unsupported tool: unsupported');
    expect(fs.existsSync(path.join(tmpDir, '.unsupported'))).toBe(false);
    expect(JSON.parse(fs.readFileSync(stateFile, 'utf-8')).tools).toEqual(['unsupported']);
  });
});
