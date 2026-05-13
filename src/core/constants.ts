export const PKG_NAME = '@lininn/openflow';
export const PKG_BIN = 'openflow';
export const SKILL_NAME = 'openflow';
export const COMMAND_PREFIX = '/openflow';

export const DEPS = {
  openspec: {
    name: 'OpenSpec',
    cliCmd: 'openspec',
    npmPkg: '@fission-ai/openspec',
    installHint: 'npm install -g @fission-ai/openspec@latest',
    autoInstallable: true,
  },
  superpowers: {
    name: 'Superpowers',
    checkPath: 'writing-plans/SKILL.md',
    installHint: '请在 Claude Code 中执行: /plugin install superpowers@claude-plugins-official',
    autoInstallable: false,
  },
} as const;

export const TOOL_PATHS: Record<string, { skillsDir: string; commandsDir?: string }> = {
  claude: {
    skillsDir: '.claude/skills',
    commandsDir: '.claude/commands',
  },
  codex: {
    skillsDir: '.codex/skills',
  },
  cursor: {
    skillsDir: '.cursor/skills',
  },
};
