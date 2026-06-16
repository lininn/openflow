import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { checkOpenSpecInitialized } from './dependency-check.js';

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
