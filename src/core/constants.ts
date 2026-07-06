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
    // Relative skill path inside a Claude Code plugin package.
    pluginSkillPath: 'skills/writing-plans/SKILL.md',
    // Claude Code plugin registry that records每个已安装插件的 installPath。
    claudePluginRegistry: '.claude/plugins/installed_plugins.json',
    // Fallback: glob root for plugin skills when the registry is unavailable.
    claudePluginCacheDir: '.claude/plugins/cache',
    installHint: '请在当前工具中安装 Superpowers writing-plans skill（Claude Code: /plugin install superpowers@claude-plugins-official）',
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
  opencode: {
    skillsDir: '.opencode/commands',
  },
};
