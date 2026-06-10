import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { generateSkills, resolveSkillTemplateContent } from './skill-generator.js';

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

  it('generates Codex skills with evidence-based OpenSpec task sync instructions', () => {
    generateSkills({
      cwd: tmpDir,
      tools: ['codex'],
      depStatus: {
        openspec: { installed: false },
        superpowers: { installed: false, checkedPaths: [] },
      },
    });

    const skillContent = fs.readFileSync(path.join(tmpDir, '.codex/skills/openflow/SKILL.md'), 'utf-8');
    const buildContent = fs.readFileSync(path.join(tmpDir, '.codex/skills/openflow/build.md'), 'utf-8');
    const closeContent = fs.readFileSync(path.join(tmpDir, '.codex/skills/openflow/close.md'), 'utf-8');

    expect(skillContent).toContain('代码、测试、实现计划状态、`openspec/changes/**/tasks.md` checkbox 状态');
    expect(skillContent).toContain('不得改写任务内容或规格要求');
    expect(buildContent).toContain('OpenSpec `tasks.md` 是归档前置状态');
    expect(buildContent).toContain('只能反映已验证完成的任务，不能改写任务内容或规格要求');
    expect(closeContent).toContain('确认并同步实现状态');
    expect(closeContent).toContain('自动比对是否已有对应实现、测试或验证证据');
    expect(closeContent).toContain('直接将 `tasks.md` 中对应 checkbox 从 `- [ ]` 更新为 `- [x]`');
    expect(closeContent).toContain('不能为了通过归档而猜测勾选');
    expect(closeContent).toContain('归档被变更顺序阻塞');
  });
});
