import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { generateSkills } from './skill-generator.js';
import { TOOL_PATHS } from './constants.js';

const toolNames = ['claude', 'codex', 'cursor', 'opencode'] as const;

describe('tool path integration', () => {
  let tmpDir: string;

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'openflow-tools-'));
  });

  afterEach(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  it('defines skill directories for all supported tools', () => {
    expect(Object.keys(TOOL_PATHS).sort()).toEqual([...toolNames].sort());
    for (const tool of toolNames) {
      expect(TOOL_PATHS[tool].skillsDir).toMatch(/^\.[A-Za-z0-9_-]+\/.+/);
    }
  });

  it('generates main skills into each configured tool directory', () => {
    generateSkills({
      cwd: tmpDir,
      tools: [...toolNames],
      depStatus: {
        openspec: { installed: false },
        superpowers: { installed: false, checkedPaths: [] },
      },
    });

    for (const tool of toolNames) {
      expect(fs.existsSync(path.join(tmpDir, TOOL_PATHS[tool].skillsDir, 'openflow', 'SKILL.md'))).toBe(true);
    }
  });
});
