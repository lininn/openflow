import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { ensureOpenSpecProjectContext } from './init.js';

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
    expect(config).toContain('context: |');
    expect(config).toContain('rules:');
  });

  it('creates config.yaml context scaffold when OpenSpec is initialized without config', () => {
    fs.mkdirSync(path.join(tmpDir, 'openspec'), { recursive: true });

    ensureOpenSpecProjectContext(tmpDir);

    const config = fs.readFileSync(path.join(tmpDir, 'openspec/config.yaml'), 'utf-8');
    expect(config).toContain('schema: spec-driven');
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
    expect(config).toContain('context: |');
    expect(config).toContain('rules:');
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
    expect(config.match(/^rules:/gm)).toHaveLength(1);
    expect(config).toContain('Keep existing rule');
  });

  it('does not rewrite config.yaml that already has context and rules', () => {
    fs.mkdirSync(path.join(tmpDir, 'openspec'), { recursive: true });
    const original = 'schema: spec-driven\ncontext: |\n  Tech stack: TypeScript\nrules:\n  specs:\n    - Keep existing rule\n';
    fs.writeFileSync(path.join(tmpDir, 'openspec/config.yaml'), original, 'utf-8');

    ensureOpenSpecProjectContext(tmpDir);

    expect(fs.readFileSync(path.join(tmpDir, 'openspec/config.yaml'), 'utf-8')).toBe(original);
  });
});
