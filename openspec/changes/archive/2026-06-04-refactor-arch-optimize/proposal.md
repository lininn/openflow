## Why

@lininn/openflow 当前版本 (0.3.1) 的源码存在多项架构与设计问题：版本号不一致、shell 调用冗余、无测试覆盖、模板维护成本高、部分路径配置可疑。这些问题在项目增长到 9 个源文件、7 个模板文件后，维护成本和出错风险显著上升。本次变更聚焦于修复架构缺陷、补齐短板、降低后续维护成本。

## What Changes

### P1 — 严重问题（建议立即修复）

1. **版本号不一致** — `src/cli/index.ts` 写死 `'0.1.9'`，但 `package.json` 已经是 `0.3.1`。每次发版必须手动同步，极易忘记。
2. **Shell 工具函数用 execSync 执行文件系统操作** — `fileExists()` 和 `dirExists()` 通过 `test -f`/`test -d` 判断文件存在，应改用 `fs.existsSync()`。shell 命令有注入风险且慢一个数量级。
3. **`exec()` 吞掉所有错误** — shell.ts 的 `exec()` 函数在命令失败时返回空字符串，调用方无法区分"命令正常返回空"和"命令执行失败"。`tryAutoInstall` 在安装失败后仍然返回 true（当 execSync 抛出异常时走 catch 返回 false，但这里用的是 execSync + stdio:'inherit' 模式，实际上没问题——检查确认逻辑正确，但模式不一致）。
4. **无任何测试** — 0 测试文件、0 测试依赖。对于一个生成文件、执行 shell 命令的 CLI 工具，这是高风险。

### P2 — 架构改进（建议短期优化）

5. **模板与 inline fallback 双重维护** — `skill-generator.ts` 中从 `templates/` 目录读取模板，但 `SKILL.md` 的完整内容（90+ 行）同时以内联字符串硬编码在 `getInlineTemplate()` 中作为 fallback。更新模板时容易只改文件忘记改代码，或反之。
6. **`cmdExists()` 实现脆弱** — 用 `which ${cmd}` 并通过异常判断存在性，且未对 cmd 参数做任何转义。应改用 `fs.access()` 或 `which` npm 包。
7. **Logger 能力单一** — 缺少日志级别（debug/info/warn/error）、缺少 `--json` 结构化输出模式，为将来的 CI 集成或机器消费增加了改造成本。

### P3 — 长期优化

8. **无 CI/CD** — 没有 GitHub Actions、自动化 lint/test/publish 流程。
9. **`openspec/project.md` 是空模板** — init 后从未填充，保持全占位符状态。
10. **codex 工具路径存疑** — Codex CLI 的 skill 路径是否真的是 `.codex/skills/` 需要实际验证。

## Impact

- **Affected specs**: 本次变更不涉及 OpenSpec capabilities，而是项目自身的源码质量改进
- **Affected code**:
  - `src/utils/shell.ts` — 重构文件系统操作
  - `src/cli/index.ts` — 修复版本号
  - `src/core/skill-generator.ts` — 消除模板双重维护
  - 新增测试基础设施
- **Breaking**: 无。全是内部重构，对外接口不变。

## Amendments

| Date | Reason | Summary |
|------|--------|---------|
| 2026-06-04 | 基于主工作区核验结果创建修复任务 | 将已确认问题拆成 P0/P1/P2/P3 修复队列：测试缺失、`shell.ts` shell 拼接风险、`src` 编译产物未被 ignore、CI 缺失、linter/formatter 缺失、workflow-status worktree 草稿待评估、模板双来源和 CHANGELOG 缺失。修正原分析中“`src` 产物已被 git 跟踪”的表述为“未跟踪产物未被 `.gitignore` 覆盖”。 |
