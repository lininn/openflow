import fs from 'fs';
import os from 'os';
import path from 'path';
import { fileURLToPath } from 'url';
import { fileExists } from '../utils/shell.js';
import { logger } from '../utils/logger.js';
import { SKILL_NAME, TOOL_PATHS, DEPS } from './constants.js';
import type { DepStatus } from './dependency-check.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Resolve templates dir: from dist/core/ → ../../templates/
const TEMPLATES_DIR = path.resolve(__dirname, '..', '..', 'templates');

const PHASES = [
  { name: 'proposal', description: 'Quick requirement capture' },
  { name: 'brainstorming', description: 'Deep design exploration' },
  { name: 'spec', description: 'Generate OpenSpec specs and translate to plan-ready.md' },
  { name: 'amend', description: 'Revise requirements/specs before close' },
  { name: 'build', description: 'Execute implementation' },
  { name: 'close', description: 'Verify consistency and archive' },
] as const;

const PHASE_ALIAS_TOOLS = new Set(['claude', 'codex', 'cursor']);

export interface GenerateOptions {
  cwd: string;
  tools: string[];
  depStatus: DepStatus;
  global?: boolean;
}

export function generateSkills(options: GenerateOptions): void {
  const { cwd, tools, depStatus, global = false } = options;
  const baseDir = global ? os.homedir() : cwd;

  for (const tool of tools) {
    const toolPaths = TOOL_PATHS[tool];
    if (!toolPaths) {
      logger.warn(`Unknown tool: ${tool}, skipping`);
      continue;
    }

    const skillsDir = path.join(baseDir, toolPaths.skillsDir, SKILL_NAME);
    const displayPath = global
      ? path.join('~', toolPaths.skillsDir, SKILL_NAME)
      : path.relative(cwd, skillsDir);

    logger.step(`Generating ${tool} skills to ${displayPath}/`);

    if (!fs.existsSync(skillsDir)) {
      fs.mkdirSync(skillsDir, { recursive: true });
    }

    // Generate main SKILL.md
    generateSkillFile(skillsDir, 'SKILL.md', depStatus);

    // Generate phase files
    for (const phase of PHASES) {
      generateSkillFile(skillsDir, `${phase.name}.md`, depStatus);
    }

    if (PHASE_ALIAS_TOOLS.has(tool)) {
      generatePhaseAliasSkills({
        baseDir,
        skillsDir: toolPaths.skillsDir,
        cwd,
        global,
      });
    }

    logger.success(`${tool} skills generated`);
  }
}

function generateSkillFile(skillsDir: string, filename: string, depStatus: DepStatus): void {
  const templatePath = path.join(TEMPLATES_DIR, filename);

  let content: string;

  if (fileExists(templatePath)) {
    content = fs.readFileSync(templatePath, 'utf-8');
  } else {
    // Fallback: use inline template
    content = getInlineTemplate(filename, depStatus);
  }

  // Inject runtime dependency checks into build.md
  if (filename === 'build.md') {
    content = injectRuntimeDepCheck(content, depStatus);
  }

  // Inject runtime dependency checks into spec.md for OpenSpec
  if (filename === 'spec.md') {
    content = injectSpecRuntimeCheck(content, depStatus);
  }

  const targetPath = path.join(skillsDir, filename);
  fs.writeFileSync(targetPath, content);
  logger.step(`  ${filename}`);
}

function generatePhaseAliasSkills(options: {
  baseDir: string;
  skillsDir: string;
  cwd: string;
  global: boolean;
}): void {
  const { baseDir, skillsDir, cwd, global } = options;

  for (const phase of PHASES) {
    const aliasName = `${SKILL_NAME}-${phase.name}`;
    const aliasDir = path.join(baseDir, skillsDir, aliasName);
    const displayPath = global
      ? path.join('~', skillsDir, aliasName, 'SKILL.md')
      : path.relative(cwd, path.join(aliasDir, 'SKILL.md'));

    if (!fs.existsSync(aliasDir)) {
      fs.mkdirSync(aliasDir, { recursive: true });
    }

    fs.writeFileSync(
      path.join(aliasDir, 'SKILL.md'),
      getPhaseAliasTemplate(phase.name, phase.description),
    );
    logger.step(`  ${displayPath}`);
  }
}

function getPhaseAliasTemplate(phase: string, description: string): string {
  return `---
name: ${SKILL_NAME}-${phase}
description: "OpenFlow ${phase}: ${description}. Visibility alias for ${SKILL_NAME} ${phase}."
argument-hint: "[optional context]"
---

# ${SKILL_NAME}-${phase}

这是 \`${SKILL_NAME} ${phase}\` 的补全可见别名。

执行时必须按以下方式处理：

1. 将本次调用视为用户调用了 \`/${SKILL_NAME} ${phase} $ARGUMENTS\`
2. 读取同级 skills 目录中的 \`${SKILL_NAME}/SKILL.md\`
3. 读取 \`${SKILL_NAME}/${phase}.md\`
4. 严格遵守主 openflow 工作流、阶段写入边界和当前阶段文件
5. 如果 \`$ARGUMENTS\` 中有额外需求或上下文，将它作为 ${phase} 阶段输入
`;
}

function injectRuntimeDepCheck(content: string, depStatus: DepStatus): string {
  const checkSection = `
### 0. 依赖检测

执行前检查以下依赖是否可用：

| 依赖 | 检测方式 | 不可用时 |
|------|----------|----------|
| Superpowers writing-plans | 当前工具的本地或全局 skills 目录下是否存在 \`writing-plans/SKILL.md\` | 降级为手动拆解 plan-ready.md 中的步骤，逐条执行 |
| OpenSpec CLI | \`openspec\` 命令是否可执行 | 不影响 build 阶段，但 close 阶段归档需手动 mv |

如果 Superpowers 不可用，提示用户：
> "Superpowers 未安装，build 将使用手动执行模式。安装后体验更佳：${DEPS.superpowers.installHint}"

如果 Superpowers 可用，调用其 \`writing-plans\` skill 生成详细实现计划。
`;

  // Insert after the first heading
  const lines = content.split('\n');
  const firstH2Idx = lines.findIndex((l) => l.startsWith('## '));
  if (firstH2Idx >= 0) {
    lines.splice(firstH2Idx + 1, 0, checkSection);
  } else {
    lines.unshift(checkSection);
  }
  return lines.join('\n');
}

function injectSpecRuntimeCheck(content: string, depStatus: DepStatus): string {
  const checkNote = `
> **OpenSpec 检测**：根据 proposal.md 生成 design.md + specs/ + tasks.md；如果 \`openspec\` CLI 可用，生成后运行 \`openspec validate <变更名> --strict\` 校验。
`;

  const lines = content.split('\n');
  const validateIdx = lines.findIndex((l) => l.includes('openspec validate'));
  if (validateIdx >= 0) {
    lines.splice(validateIdx, 0, checkNote);
  }
  return lines.join('\n');
}

function getInlineTemplate(filename: string, depStatus: DepStatus): string {
  const templates: Record<string, string> = {
    'SKILL.md': `---
name: openflow
description: "OpenSpec + Superpowers 工作流协调器。使用 /openflow proposal 轻量提问、/openflow brainstorming 深度设计、/openflow spec 生成规格、/openflow amend 在归档前修订需求、/openflow build 执行实现、/openflow close 验证归档。串联需求规格与工程执行，消除格式鸿沟。"
argument-hint: "proposal | brainstorming | spec | amend | build | close"
---

# openflow - 工作流协调器

根据用户调用的子命令和项目当前状态，路由到对应阶段。

## 续接与中断恢复

如果本轮没有显式 \`/openflow ...\` 子命令，但上一轮已经进入 openflow 任一阶段，并且用户是在补充范围、回答确认问题、说“继续”、修正需求、或说明新增/移除边界：

1. 默认继续上一 openflow 阶段，不把该回复当作普通编码请求
2. 如果上一阶段是 proposal、brainstorming、spec 或 amend，只能继续产出/更新 OpenSpec 文档和计划文档，不得修改任何代码或实现文件
3. 如果上一阶段是 build，但用户补充的是需求、验收条件或规格边界变更，切到 \`/openflow amend\`，不要直接改代码
4. 只有用户显式调用 \`/openflow build\`，或状态检测明确进入 build 阶段后，才允许修改代码或实现文件
5. 中断后恢复时，先重新读取当前阶段文件和 \`openspec/changes/\` 状态，再继续执行

典型场景：
- proposal 阶段整理需求后，用户补充“运营端也要做回显”。这仍是需求范围修正，必须继续 proposal 文档收敛，不能直接进入代码实现。
- brainstorming 阶段询问“是否只覆盖企业端？”后，用户回复“运营端也要做回显”。这仍是设计范围修正，必须继续 brainstorming/proposal 文档收敛，不能直接进入代码实现。

## 阶段写入边界

| 阶段 | 允许写入 | 禁止写入 |
|------|----------|----------|
| proposal | \`openspec/changes/**/proposal.md\` | 任何代码或实现文件 |
| brainstorming | \`openspec/changes/**/proposal.md\` | 任何代码或实现文件 |
| spec | \`openspec/changes/**\`、\`plan-ready.md\` | 任何代码或实现文件 |
| amend | \`openspec/changes/**\`、\`plan-ready.md\`、\`docs/superpowers/plans/*.md\` | 代码、测试、其他实现文件 |
| build | 代码、测试、实现计划状态 | 规格文档（除非另开变更） |
| close | 归档、验证记录、\`close-issues.md\` | 代码、测试、其他实现文件 |

如果用户在 proposal/brainstorming/spec/amend 阶段提出“就按这个做”“范围改成 X”“继续”等话术，不代表进入 build；必须先完成该阶段文档产物并提示下一步。

## 子命令

| 命令 | 阶段 | 说明 |
|------|------|------|
| \`/openflow proposal\` | proposal | 轻量提问，快速收敛需求 |
| \`/openflow brainstorming\` | brainstorming | 深度设计，多轮探索 |
| \`/openflow spec\` | spec | 调用 OpenSpec 生成规格 + 翻译 |
| \`/openflow amend\` | amend | build/close 前受控修改需求、规格和计划 |
| \`/openflow build\` | build | 调用 Superpowers 执行实现 |
| \`/openflow close\` | close | 验证一致性 + 归档 |

## 状态检测

当用户调用 \`/openflow\` 不带子命令，或调用某个子命令需要确认前置条件时，执行以下状态检测：

| 检查项 | 怎么查 | 结果 |
|--------|--------|------|
| 有活跃变更？ | \`openspec/changes/\` 下是否有非 archive 子目录 | 有→继续 |
| 有 plan-ready.md？ | 变更目录下是否有 \`plan-ready.md\` | 有→看实现状态 |
| 实现已开始？ | \`docs/superpowers/plans/\` 下是否有计划文件 | 有→看是否完成 |
| 实现已完成？ | 计划文件全部 checkbox 已勾选 | 是→close 阶段 |

判定结果：
- 无活跃变更 → proposal 阶段
- 有规格但无 plan-ready.md → spec 阶段（补生成翻译）
- 有 plan-ready.md 但实现未开始 → build 阶段
- 实现进行中 → 继续 build 阶段（断点恢复）
- 实现已完成 → close 阶段

## 路由

根据子命令或状态检测结果，读取对应阶段文件并执行：

1. 如果这是上一 openflow 阶段的续接回复，先按“续接与中断恢复”保持阶段
2. 如果用户在 build 中明确提出需求变更、补充 spec、修改验收条件或重新生成规格，路由到 amend
3. 如果用户指定了子命令（如 \`/openflow build\`），优先按指定阶段执行，但检查前置条件
4. 如果用户只输入 \`/openflow\`，执行状态检测，自动路由到对应阶段
5. 读取当前 openflow skill 目录下的阶段文件：\`<阶段>.md\`（与本 \`SKILL.md\` 同目录；不要依赖 Claude 专属环境变量）
6. 按阶段文件中的流程执行，并遵守阶段写入边界

### 前置条件检查

| 阶段 | 前置条件 | 不满足时提示 |
|------|----------|-------------|
| proposal | 无 | — |
| brainstorming | 无 | — |
| spec | 需要有活跃变更目录或有用户需求 | "请先用 /openflow proposal 或 /openflow brainstorming 描述需求" |
| amend | 需要有活跃变更目录，通常需要 plan-ready.md | "还没有可修订的活跃变更，请先完成 /openflow spec" |
| build | 需要存在 plan-ready.md | "请先完成 /openflow spec 生成规格和翻译" |
| close | 需要实现已完成 | "实现尚未完成，请先用 /openflow build 执行" |
`,
  };

  return templates[filename] ?? `# ${filename}\n\nTODO: implement\n`;
}
