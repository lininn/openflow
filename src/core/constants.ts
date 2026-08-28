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
    // Relative skill path inside a plugin package.
    pluginSkillPath: 'skills/writing-plans/SKILL.md',
    // Codex plugin cache containing marketplace/plugin/revision directories.
    codexPluginCacheDir: '.codex/plugins/cache',
    // Cursor marketplace cache containing marketplace/plugin/revision directories.
    cursorPluginCacheDir: '.cursor/plugins/cache',
    // Cursor's documented local plugin development directory.
    cursorPluginLocalDir: '.cursor/plugins/local/superpowers',
    // Claude Code plugin registry that records每个已安装插件的 installPath。
    claudePluginRegistry: '.claude/plugins/installed_plugins.json',
    // Fallback: glob root for plugin skills when the registry is unavailable.
    claudePluginCacheDir: '.claude/plugins/cache',
    autoInstallable: false,
  },
} as const;

const SUPERPOWERS_INSTALL_HINTS: Record<string, string> = {
  claude: 'Run `/plugin install superpowers@claude-plugins-official` in Claude Code.',
  codex: 'Open `/plugins`, install Superpowers, then start a new session.',
  cursor: 'Run `/add-plugin superpowers` in Cursor Agent chat.',
  opencode: 'Follow the OpenCode guide: https://github.com/obra/superpowers/blob/main/.opencode/INSTALL.md',
};

export function getSuperpowersInstallHint(tools: string[]): string {
  return tools
    .map((tool) => SUPERPOWERS_INSTALL_HINTS[tool] ?? `Install the Superpowers writing-plans skill for ${tool}.`)
    .join(' ');
}

export function getSuperpowersCheckHint(tool: string): string {
  const skillsDir = TOOL_PATHS[tool]?.skillsDir ?? `.${tool}/skills`;
  const localPaths = `\`./${skillsDir}/${DEPS.superpowers.checkPath}\` or \`~/${skillsDir}/${DEPS.superpowers.checkPath}\``;

  switch (tool) {
    case 'claude':
      return `${localPaths}; also check \`~/.claude/plugins/installed_plugins.json\` and \`~/.claude/plugins/cache\``;
    case 'codex':
      return `${localPaths}; also check \`~/.codex/plugins/cache/*/superpowers/*/${DEPS.superpowers.pluginSkillPath}\``;
    case 'cursor':
      return `${localPaths}; also check \`~/.cursor/plugins/cache/*/superpowers/*/${DEPS.superpowers.pluginSkillPath}\` and \`~/.cursor/plugins/local/superpowers/${DEPS.superpowers.pluginSkillPath}\``;
    case 'opencode':
      return `${localPaths}; also check \`~/.cache/opencode/packages/**/node_modules/superpowers/skills/${DEPS.superpowers.checkPath}\``;
    default:
      return localPaths;
  }
}

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
    skillsDir: '.opencode/skills',
  },
};
