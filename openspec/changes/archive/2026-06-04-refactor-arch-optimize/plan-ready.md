## 来源

- Change: `refactor-arch-optimize`
- Proposal: `openspec/changes/refactor-arch-optimize/proposal.md`
- Design: `openspec/changes/refactor-arch-optimize/design.md`
- Spec: `openspec/changes/refactor-arch-optimize/specs/project/spec.md`
- Tasks: `openspec/changes/refactor-arch-optimize/tasks.md`

## Amendments

### 2026-06-04: 创建修复任务队列

- 原因：主工作区核验确认测试、shell 安全、产物忽略、CI、lint/format、workflow-status 草稿、模板双来源、CHANGELOG 等工程质量问题需要按优先级纳入执行计划。
- 影响规格：`openspec/changes/refactor-arch-optimize/specs/project/spec.md`
- 影响任务：`openspec/changes/refactor-arch-optimize/tasks.md`
- 约束：amend 阶段只更新规格和计划文档，不修改源码。

### 2026-06-04: 修正新建 project spec 的归档 delta

- 原因：`openspec archive refactor-arch-optimize --yes` 要求新建 target spec 只能包含 `ADDED Requirements`，原 `exec() Error Handling` 写在 `MODIFIED Requirements` 下导致归档失败。
- 影响规格：`openspec/changes/refactor-arch-optimize/specs/project/spec.md`
- 影响任务：无新增实现任务；代码实现与验证结果不变。
- 约束：只修正 OpenSpec delta 形状，不改代码。

## 追加实现步骤

### Task 1: 修复 shell 工具安全与健壮性

- 目标：用 Node 原生 API 替换 `fileExists`、`dirExists`、`cmdExists` 中的 shell 拼接路径/命令检测。
- 改动文件：`src/utils/shell.ts`、相关调用方测试。
- 验证方式：`npm test -- src/utils/shell.test.ts`、`npm run build`。

### Task 2: 建立测试基线

- 目标：引入测试脚本和测试配置，至少覆盖 `shell.ts`、依赖检测和 skill 生成关键路径。
- 改动文件：`package.json`、`package-lock.json`、`vitest.config.mts`、`src/**/*.test.ts`、`tsconfig.json`。
- 验证方式：`npm test`、`npm run build`。

### Task 3: 清理 src 产物并补 ignore

- 目标：移除误生成的 `src/**/*.js` 和 `src/**/*.d.ts` 未跟踪产物，并防止其再次污染 `git status`。
- 改动文件：`.gitignore`，工作区清理现有未跟踪产物。
- 验证方式：`git status --short` 不再列出 `src` 下 `.js`/`.d.ts` 产物。

### Task 4: 增加 CI 与风格检查

- 目标：配置 GitHub Actions 执行安装、构建、测试；配置一个 lint/format 工具并提供命令。
- 改动文件：`.github/workflows/ci.yml`、`package.json`、所选工具配置文件。
- 验证方式：本地运行 CI 等价命令：`npm ci`、`npm run build`、`npm test`、风格检查命令。

### Task 5: 处理 workflow-status 草稿

- 目标：评估 `.worktrees/openflow-workflow-status` 的完整模型和测试，选择合入或清理，并记录决定。
- 改动文件：若合入则包含 `src/core/workflow-status.ts`、`src/**/*workflow-status*.test.ts`、`src/cli/status.ts`；若不合入则只更新任务/记录并清理 worktree。
- 验证方式：合入路径运行 `npm test`；清理路径运行 `git worktree list` 并确认无遗留 worktree。

### Task 6: 收尾维护项

- 目标：去除模板双来源，补 `CHANGELOG.md`，填充 `openspec/project.md`，验证各工具 skill 路径。
- 改动文件：`src/core/skill-generator.ts`、`CHANGELOG.md`、`openspec/project.md`、必要的集成测试或文档。
- 验证方式：`npm run build`、`npm test`，并手动检查生成的 skill 文件。
