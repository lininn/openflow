## 1. 严重问题修复

- [x] 1.1 修复版本号不一致：从 `package.json` 读取版本，或统一为单一来源
- [x] 1.2 重构 shell.ts：`fileExists`/`dirExists` 改用 `fs.existsSync`，消除 shell 注入风险
- [x] 1.3 `cmdExists()` 改用 `fs.access()` 或 `which` 包，避免 shell 执行
- [x] 1.4 添加测试基础设施（vitest/jest），为核心功能编写单元测试
- [x] 1.5 为 `shell.ts` 补回归测试，覆盖文件存在、目录存在、路径含空格/特殊字符、命令存在检测
- [x] 1.6 清理主工作区 `src/**/*.js` 与 `src/**/*.d.ts` 未跟踪产物，并补 `.gitignore` 防止再次出现

## 2. 架构改进

- [x] 2.1 消除模板双重维护：移除 `getInlineTemplate()` 中的 SKILL.md 硬编码，统一从文件读取
- [x] 2.2 Logger 增加 debug 级别和 `--json` 模式
- [x] 2.3 配置 GitHub Actions CI：`npm ci`、`npm run build`、`npm test`
- [x] 2.4 配置单一 lint/format 工具，并把检查命令接入文档或 CI
- [x] 2.5 评估 `.worktrees/openflow-workflow-status` 草稿：合入完整 workflow-status 模型与测试，或清理 worktree 并记录不合入原因

## 3. 长期优化

- [x] 3.1 补充 `CHANGELOG.md`，记录当前版本以来的用户可见变化
- [x] 3.2 填充 `openspec/project.md` 为项目真实配置
- [x] 3.3 验证各工具的 skill 路径正确性，补充集成测试
