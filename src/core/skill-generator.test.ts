import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { resolveSkillTemplateContent } from './skill-generator.js';

describe('skill template resolution', () => {
  let tmpDir: string;

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'openflow-templates-'));
  });

  afterEach(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  it('reads template content from disk', () => {
    fs.writeFileSync(path.join(tmpDir, 'SKILL.md'), '# Template from disk\n');

    expect(resolveSkillTemplateContent(tmpDir, 'SKILL.md')).toBe('# Template from disk\n');
  });

  it('throws a clear error when a template is missing', () => {
    expect(() => resolveSkillTemplateContent(tmpDir, 'SKILL.md')).toThrow(
      `Missing openflow template: ${path.join(tmpDir, 'SKILL.md')}`,
    );
  });

  it('keeps close instructions from archiving changes before prerequisite specs exist', () => {
    const content = resolveSkillTemplateContent(path.resolve('templates'), 'close.md');

    expect(content).toContain('## MODIFIED Requirements');
    expect(content).toContain('openspec/specs/<capability>/spec.md');
    expect(content).toContain('openspec/changes/*/specs/<capability>/spec.md');
    expect(content).toContain('## ADDED Requirements');
    expect(content).toContain('归档被变更顺序阻塞');
    expect(content).toContain('请先归档创建该规格的变更');
  });
});
