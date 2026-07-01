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

  it('requires plan-ready translation to preserve Superpowers handoff detail', () => {
    const specContent = resolveSkillTemplateContent(path.resolve('templates'), 'spec.md');
    const amendContent = resolveSkillTemplateContent(path.resolve('templates'), 'amend.md');

    expect(specContent).toContain('planning brief');
    expect(specContent).toContain('## Source Coverage');
    expect(specContent).toContain('## Project Context');
    expect(specContent).toContain('## Applicable OpenSpec Rules');
    expect(specContent).toContain('openspec/config.yaml');
    expect(specContent).toContain('Superpowers `writing-plans` 的输入预期');
    expect(specContent).toContain('## File Responsibility Map');
    expect(specContent).toContain('## Implementation Slices');
    expect(specContent).toContain('## Verification Plan');
    expect(specContent).toContain('## Superpowers Handoff');
    expect(specContent).toContain('不得只转写 tasks.md 标题');
    expect(specContent).toContain('缺少这些内容视为未完成翻译');
    expect(specContent).toContain('明确 TDD 期望');
    expect(specContent).toContain('TDD 计划');
    expect(amendContent).toContain('更新 `## Source Coverage`');
    expect(amendContent).toContain('## 追加 Implementation Slices');
    expect(amendContent).toContain('新增 slice 是否包含文件、测试、验证命令和完成标准');
    expect(amendContent).toContain('TDD 计划');
  });

  it('requires proposal and brainstorming to ask before optional grill-me', () => {
    const proposalContent = resolveSkillTemplateContent(path.resolve('templates'), 'proposal.md');
    const brainstormingContent = resolveSkillTemplateContent(path.resolve('templates'), 'brainstorming.md');

    for (const content of [proposalContent, brainstormingContent]) {
      expect(content).toContain('必须询问用户是否进入可选的 grill-me 压力测试节点');
      expect(content).toContain('Status: blocked');
      expect(content).toContain('Next Command: /openflow grill');
      expect(content).toContain('Grill decision');
      expect(content).toContain('你也可以输入“跳过”');
      expect(content).toContain('用户选择 grill-me / 压力测试 / 继续追问 → 切到 `/openflow grill`');
      expect(content).toContain('用户选择跳过 / 不需要 / 直接 spec → 提示下一步为 `/openflow spec`');
    }
  });

  it('defines the init phase as an interactive project-context setup step', () => {
    const skillContent = resolveSkillTemplateContent(path.resolve('templates'), 'SKILL.md');
    const initContent = resolveSkillTemplateContent(path.resolve('templates'), 'init.md');

    expect(skillContent).toContain('proposal | init | brainstorming | grill | spec | amend | build | close');
    expect(skillContent).toContain('/openflow init');
    expect(skillContent).toContain('Missing `openspec/config.yaml`');
    expect(skillContent).toContain('询问用户是否执行 `/openflow init`');
    expect(skillContent).toContain('只有用户明确表示跳过');
    expect(skillContent).toContain('`grill`、`spec`、`amend`、`build`、`close` 阶段不得触发本初始化询问');
    expect(initContent).toContain('## 目标');
    expect(initContent).toContain('读取用户项目的代码风格');
    expect(initContent).toContain('项目文档和生成产物语言');
    expect(initContent).toContain('language:');
    expect(initContent).toContain('artifacts: zh-CN');
    expect(initContent).toContain('Parser-required OpenSpec headings');
    expect(initContent).toContain('行业标准');
    expect(initContent).toContain('空项目');
    expect(initContent).toContain('写入 `openspec/config.yaml`');
  });

  it('does not auto-enter spec before the grill-me decision is handled', () => {
    const skillContent = resolveSkillTemplateContent(path.resolve('templates'), 'SKILL.md');
    const specContent = resolveSkillTemplateContent(path.resolve('templates'), 'spec.md');

    expect(skillContent).toContain('先询问是否进入可选 grill-me');
    expect(skillContent).toContain('不得直接加载 spec');
    expect(specContent).toContain('进入 spec 前必须先处理可选 grill-me 决策');
    expect(specContent).toContain('用户选择跳过 / 不需要 / 直接 spec 后才继续本阶段');
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
    const initContent = fs.readFileSync(path.join(tmpDir, '.codex/skills/openflow/init.md'), 'utf-8');
    const grillContent = fs.readFileSync(path.join(tmpDir, '.codex/skills/openflow/grill.md'), 'utf-8');
    const proposalContent = fs.readFileSync(path.join(tmpDir, '.codex/skills/openflow/proposal.md'), 'utf-8');
    const brainstormingContent = fs.readFileSync(path.join(tmpDir, '.codex/skills/openflow/brainstorming.md'), 'utf-8');
    const proposalAliasContent = fs.readFileSync(path.join(tmpDir, '.codex/skills/openflow-proposal/SKILL.md'), 'utf-8');
    const grillAliasContent = fs.readFileSync(path.join(tmpDir, '.codex/skills/openflow-grill/SKILL.md'), 'utf-8');
    const initAliasContent = fs.readFileSync(path.join(tmpDir, '.codex/skills/openflow-init/SKILL.md'), 'utf-8');
    const buildContent = fs.readFileSync(path.join(tmpDir, '.codex/skills/openflow/build.md'), 'utf-8');
    const closeContent = fs.readFileSync(path.join(tmpDir, '.codex/skills/openflow/close.md'), 'utf-8');

    expect(skillContent).toContain('proposal | init | brainstorming | grill | spec | amend | build | close');
    expect(skillContent).toContain('/openflow grill');
    expect(skillContent).toContain('/openflow init');
    expect(skillContent).toContain('OpenSpec 初始化入口门禁');
    expect(skillContent).toContain('openflow init --tools codex');
    expect(skillContent).toContain('询问用户是否执行 `/openflow init`');
    expect(initContent).toContain('读取用户项目的代码风格');
    expect(initContent).toContain('空项目');
    expect(initAliasContent).toContain('name: openflow-init');
    expect(initAliasContent).not.toContain('OpenSpec 初始化入口门禁');
    expect(initAliasContent).not.toContain('在任何项目扫描、需求分析、创建 change 之前');
    expect(skillContent).toContain('先询问是否进入可选 grill-me');
    expect(skillContent).toContain('proposal、brainstorming、grill、spec 或 amend');
    expect(skillContent).toContain('proposal/brainstorming/grill/spec/amend');
    expect(skillContent).toContain('缺少 grill 决策 → 询问是否进入可选 grill-me');
    expect(grillContent).toContain('name: openflow/grill');
    expect(grillContent).toContain('本阶段只允许写 `openspec/changes/**/proposal.md`');
    expect(proposalAliasContent).toContain('OpenSpec 初始化入口门禁');
    expect(proposalAliasContent).toContain('在任何项目扫描、需求分析、创建 change 之前');
    expect(proposalAliasContent).toContain('如果 `openspec/config.yaml` 已存在，不要提示 init');
    expect(proposalContent).toContain('## 0. 项目初始化检测');
    expect(proposalContent).toContain('在任何项目扫描、需求分析、创建 change 之前');
    expect(proposalContent).toContain('如果 `openspec/config.yaml` 已存在，不要提示 init');
    expect(proposalContent).toContain('只有用户明确表示跳过');
    expect(brainstormingContent).toContain('## 0. 项目初始化检测');
    expect(brainstormingContent).toContain('只有用户明确表示跳过');
    expect(proposalContent).toContain('openflow init --tools codex');
    expect(proposalContent).toContain('生成 `openspec/config.yaml`');
    expect(initContent).toContain('项目文档和生成产物语言');
    expect(initContent).toContain('Parser-required OpenSpec headings');
    expect(proposalContent).toContain('必须询问用户是否进入可选的 grill-me 压力测试节点');
    expect(brainstormingContent).toContain('必须询问用户是否进入可选的 grill-me 压力测试节点');
    expect(proposalContent).toContain('Next Command: /openflow grill');
    expect(brainstormingContent).toContain('Next Command: /openflow grill');
    expect(grillAliasContent).toContain('name: openflow-grill');
    expect(grillAliasContent).toContain('`/openflow grill $ARGUMENTS`');
    expect(skillContent).toContain('代码、测试、实现计划状态、`openspec/changes/**/tasks.md` checkbox 状态');
    expect(skillContent).toContain('不得改写任务内容或规格要求');
    expect(buildContent).toContain('Superpowers 本身不会自动读取 `openspec/config.yaml`');
    expect(buildContent).toContain('## Project Context');
    expect(buildContent).toContain('OpenSpec `tasks.md` 是归档前置状态');
    expect(buildContent).toContain('只能反映已验证完成的任务，不能改写任务内容或规格要求');
    expect(closeContent).toContain('确认并同步实现状态');
    expect(closeContent).toContain('自动比对是否已有对应实现、测试或验证证据');
    expect(closeContent).toContain('直接将 `tasks.md` 中对应 checkbox 从 `- [ ]` 更新为 `- [x]`');
    expect(closeContent).toContain('不能为了通过归档而猜测勾选');
    expect(closeContent).toContain('归档被变更顺序阻塞');
    // workflow-status.md maintenance
    expect(skillContent).toContain('workflow-status.md');
    expect(skillContent).toContain('状态检测与 Dashboard');
    expect(proposalContent).toContain('workflow-status.md');
    expect(buildContent).toContain('workflow-status.md');
  });

  it('generates OpenCode command tree with grill and detailed translation handoff', () => {
    generateSkills({
      cwd: tmpDir,
      tools: ['opencode'],
      depStatus: {
        openspec: { installed: false },
        superpowers: { installed: false, checkedPaths: [] },
      },
    });

    const skillContent = fs.readFileSync(path.join(tmpDir, '.opencode/commands/openflow/SKILL.md'), 'utf-8');
    const initContent = fs.readFileSync(path.join(tmpDir, '.opencode/commands/openflow/init.md'), 'utf-8');
    const grillContent = fs.readFileSync(path.join(tmpDir, '.opencode/commands/openflow/grill.md'), 'utf-8');
    const proposalContent = fs.readFileSync(path.join(tmpDir, '.opencode/commands/openflow/proposal.md'), 'utf-8');
    const brainstormingContent = fs.readFileSync(path.join(tmpDir, '.opencode/commands/openflow/brainstorming.md'), 'utf-8');
    const specContent = fs.readFileSync(path.join(tmpDir, '.opencode/commands/openflow/spec.md'), 'utf-8');

    expect(skillContent).toContain('proposal | init | brainstorming | grill | spec | amend | build | close');
    expect(skillContent).toContain('OpenSpec 初始化入口门禁');
    expect(skillContent).toContain('openflow init --tools opencode');
    expect(initContent).toContain('读取用户项目的代码风格');
    expect(initContent).toContain('行业标准');
    expect(initContent).toContain('项目文档和生成产物语言');
    expect(initContent).toContain('artifacts: zh-CN');
    expect(skillContent).toContain('先询问是否进入可选 grill-me');
    expect(skillContent).toContain('proposal、brainstorming、grill、spec 或 amend');
    expect(skillContent).toContain('缺少 grill 决策 → 询问是否进入可选 grill-me');
    expect(grillContent).toContain('用户随时可以跳过，grill 是可选的辅助，不是强制门禁');
    expect(proposalContent).toContain('## 0. 项目初始化检测');
    expect(proposalContent).toContain('在任何项目扫描、需求分析、创建 change 之前');
    expect(proposalContent).toContain('如果 `openspec/config.yaml` 已存在，不要提示 init');
    expect(proposalContent).toContain('openflow init --tools opencode');
    expect(proposalContent).toContain('只有用户明确表示跳过');
    expect(proposalContent).toContain('必须询问用户是否进入可选的 grill-me 压力测试节点');
    expect(brainstormingContent).toContain('## 0. 项目初始化检测');
    expect(brainstormingContent).toContain('只有用户明确表示跳过');
    expect(brainstormingContent).toContain('必须询问用户是否进入可选的 grill-me 压力测试节点');
    expect(proposalContent).toContain('Next Command: /openflow grill');
    expect(brainstormingContent).toContain('Next Command: /openflow grill');
    expect(specContent).toContain('## Source Coverage');
    expect(specContent).toContain('## Project Context');
    expect(specContent).toContain('## Applicable OpenSpec Rules');
    expect(specContent).toContain('openspec/config.yaml');
    expect(specContent).toContain('## File Responsibility Map');
    expect(specContent).toContain('## Superpowers Handoff');
    expect(skillContent).toContain('workflow-status.md');
    expect(skillContent).toContain('状态检测与 Dashboard');
    expect(proposalContent).toContain('workflow-status.md');
    expect(specContent).toContain('workflow-status.md');
  });
});
