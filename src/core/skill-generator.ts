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
  { name: 'init', description: 'Initialize project context and OpenSpec config' },
  { name: 'proposal', description: 'Quick requirement capture' },
  { name: 'brainstorming', description: 'Deep design exploration' },
  { name: 'grill', description: 'Optional stress-test before spec' },
  { name: 'spec', description: 'Generate OpenSpec specs and translate to plan-ready.md' },
  { name: 'amend', description: 'Revise requirements/specs before close' },
  { name: 'build', description: 'Execute implementation' },
  { name: 'close', description: 'Verify consistency and archive' },
] as const;

const PHASE_ALIAS_TOOLS = new Set(['claude', 'codex', 'cursor']);
const PROJECT_INIT_GUARD_ALIAS_PHASES = new Set(['init', 'proposal', 'brainstorming']);

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
    generateSkillFile(skillsDir, 'SKILL.md', depStatus, tool);

    // Generate phase files
    for (const phase of PHASES) {
      generateSkillFile(skillsDir, `${phase.name}.md`, depStatus, tool);
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

function generateSkillFile(skillsDir: string, filename: string, depStatus: DepStatus, tool: string): void {
  let content = resolveSkillTemplateContent(TEMPLATES_DIR, filename);
  content = injectToolContext(content, tool);

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

function injectToolContext(content: string, tool: string): string {
  return content.replaceAll('{{OPENFLOW_PROJECT_INIT_COMMAND}}', `openflow init --tools ${tool}`);
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
  const projectInitGuard = PROJECT_INIT_GUARD_ALIAS_PHASES.has(phase)
    ? `
5. 先执行主工作流中的项目初始化守卫：在任何项目扫描、需求分析、创建 change 之前检查 \`openspec/config.yaml\`
6. 如果 \`openspec/config.yaml\` 已存在，不要提示 init，直接继续 ${phase} 阶段
7. 如果缺失，先询问用户是否执行 \`/openflow init\`；用户跳过时继续 ${phase} 阶段并说明没有项目级 config 约束
8. 如果 \`$ARGUMENTS\` 中有额外需求或上下文，将它作为 ${phase} 阶段输入`
    : `
5. 如果 \`$ARGUMENTS\` 中有额外需求或上下文，将它作为 ${phase} 阶段输入`;

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
${projectInitGuard}
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

export function resolveSkillTemplateContent(templatesDir: string, filename: string): string {
  const templatePath = path.join(templatesDir, filename);
  if (!fileExists(templatePath)) {
    throw new Error(`Missing openflow template: ${templatePath}`);
  }
  return fs.readFileSync(templatePath, 'utf-8');
}
