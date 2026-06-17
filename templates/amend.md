---
name: openflow/amend
description: Revise active OpenSpec requirements during build, regenerate plan-ready.md, and append implementation tasks without archiving the change
---

# Amend: 需求变更修订

## 目标

在 active change 已经进入 spec/build 后，发现需求遗漏或规格需要改变时，受控修改 OpenSpec 文档和执行计划，然后回到 `/openflow build` 继续实现。

## 适用场景

- build 过程中发现原需求漏了一个功能、边界或验收条件
- 用户明确说“修改需求”“补充 spec”“重新生成规格”“需求变更”
- close 前发现规格本身不完整，而不是代码没有按现有规格实现

不适用：
- 只是代码没有实现现有 spec → 继续 `/openflow build`
- 变更已经 close/archive → 开新的 `/openflow proposal` 或 `/openflow brainstorming`
- 只是文案、注释或实现细节调整，且不改变行为 → 继续当前实现阶段

## 前置条件

- `openspec/changes/<变更名>/` 下存在 active change
- 至少存在 `proposal.md`
- 通常应已存在 `plan-ready.md`；如果没有，优先回到 `/openflow spec`

如果没有 active change，提示：
> "还没有活跃变更。请先用 /openflow proposal 或 /openflow brainstorming 创建需求。"

如果变更已归档，提示：
> "该变更已经归档。归档后的需求调整应开启新的 /openflow proposal。"

## 流程

### 1. 确认当前变更

检查 `openspec/changes/` 下的 active change。

如果有多个，列出并让用户选择：
> "检测到多个活跃变更：[列表]。要修订哪个变更？"

读取当前变更的文档：
- `proposal.md`
- `design.md`（如果存在）
- `specs/**/spec.md`
- `tasks.md`（如果存在）
- `plan-ready.md`（如果存在）
- `docs/superpowers/plans/` 下对应实现计划（如果存在）

### 2. 判断是 amend 还是 build

先判断用户描述属于哪类：

| 情况 | 处理 |
|------|------|
| 现有 spec 已覆盖，只是代码未完成 | 回到 `/openflow build` |
| 新增/修改行为、验收条件、边界、非目标 | 继续 amend |
| 技术方案受影响 | 修改 `design.md` 并追加任务 |
| 不确定是否改变需求 | 问 1 个澄清问题 |

### 3. 修改 OpenSpec 文档

按影响范围更新：

- `proposal.md`：追加 `## Amendments`，记录本次需求变更的日期、原因和摘要
- `design.md`：仅当技术方案或约束变化时修改
- `specs/<capability>/spec.md`：使用 `ADDED`、`MODIFIED`、`REMOVED` 或 `RENAMED Requirements` 表达 delta
- `tasks.md`：追加新任务；不要重写或删除已完成任务

要求：
- 每个新增或修改的 requirement 必须至少有一个 `#### Scenario:`
- `MODIFIED Requirements` 必须包含完整的新 requirement 文本，不只写差异片段
- 已完成任务保留原 checkbox 状态

### 4. 校验 OpenSpec

如果 OpenSpec CLI 可用，运行：

```bash
openspec validate <变更名> --strict
```

校验失败时，修正文档后重新校验。

### 5. 重新生成 plan-ready.md

根据修订后的 OpenSpec 文档更新 `plan-ready.md`。

规则：
- 保留并刷新原 `## 来源`，其中必须包含 `openspec/config.yaml` 和 `openspec/specs/`
- 重新读取 `openspec/config.yaml`，同步更新 `## Project Context` 与 `## Applicable OpenSpec Rules`；Superpowers 不会自动读取 config.yaml，必须通过 plan-ready 继续传递
- 追加 `## Amendments`，记录本次修订来源和影响
- 更新 `## Source Coverage`，确保新增/修改/删除的 requirement、scenario、tasks.md 条目都有对应 slice
- 更新 `## File Responsibility Map`，标明新增或受影响的代码、测试、文档文件责任
- 保留已完成 implementation slice 的历史上下文
- 追加或调整新的 implementation slice，按执行依赖排序
- 不删除已经完成或正在执行的 slice，除非用户明确要求废弃并说明迁移方式
- 更新 `## Verification Plan` 和 `## Blockers / Clarifications`

建议追加格式：

```markdown
## Amendments

### YYYY-MM-DD: <简短标题>
- 原因：<为什么需要改>
- 影响规格：<spec 路径>
- 影响任务：<tasks.md 条目>

## Source Coverage 更新
| OpenSpec 来源 | 验收点 | 对应 implementation slice |
|---------------|--------|---------------------------|
| <新增/修改来源> | <验收行为> | Slice N |

## File Responsibility Map 更新
| 文件 | 操作 | 责任 | 相关 slice |
|------|------|------|------------|
| `src/...` | create/modify | <该文件负责什么> | Slice N |

## 追加 Implementation Slices

### Slice N: <可交付切片名>
- 来源：<OpenSpec task / requirement / scenario 路径>
- 目标：<做什么，以及为什么>
- 依赖：<必须先完成的 slice；没有则写“无”>
- 改动文件：
  - Modify: `path/to/file`
  - Test: `path/to/test`
- TDD 计划：
  1. <先新增/修改的失败测试>
  2. <最小实现路径>
  3. <重构或边界补充>
- 验证命令：
  - `<command>` — <预期结果>
- 完成标准：
  - <可观察验收标准>
- 风险/回滚：
  - <风险和如何撤回>
```

更新后做一次自检：
- 新旧 Source Coverage 是否仍覆盖全部 OpenSpec requirement、scenario 和 tasks.md 条目
- 是否存在 TBD/TODO/模糊实现步骤
- 新增 slice 是否包含文件、测试、验证命令和完成标准

### 5.5 更新 workflow-status.md

修订完成后，更新 `openspec/changes/<变更名>/workflow-status.md`：

- Phase 保持不变（通常是 `build` 或回到 `spec`）
- Status: 如果 amend 增加了新任务 → `in_progress`（需要回到 build 完成新任务）
- Status: 如果 amend 只修改了规格但不影响已实现功能 → 保持原状态
- Gates: 不要降级已 passed 的 gate，除非对应的文件确实被删除或失效
- Tasks: 追加新任务行（来自 amend 新增的 tasks.md 条目），状态设为 `pending`
- Amendments: 追加本次修订记录
- Next Command: `/openflow build`
- Next Action: 按修订后的 plan-ready.md 继续实现

**示例 Amendments 追加**：

```markdown
## Amendments

| Date | Reason | Affected Specs | Affected Tasks | Status |
|------|--------|----------------|----------------|--------|
| YYYY-MM-DD | <amend 原因> | specs/<capability>/spec.md | T3, T4 | in_progress |
```

### 6. 同步详细实现计划

如果 `docs/superpowers/plans/YYYY-MM-DD-<变更名>.md` 已存在：
- 已勾选任务不动
- 未完成任务可按新需求调整
- 追加新 task，保留 checkbox
- 同步 `Project Context` / `Applicable OpenSpec Rules` 到详细实现计划，避免后续 executing-plans 脱离项目规范
- 记录本次 amend 来源路径

如果详细实现计划还不存在：
- 不创建代码实现计划，提示下一步用 `/openflow build`

### 7. 提示下一步

> "需求变更已写入 OpenSpec，plan-ready.md 已更新。接下来继续 `/openflow build`。"

## 关键原则

- amend 阶段只允许修改规格、任务、plan-ready.md 和实现计划文档，不直接修改代码
- amend 是 close/archive 前的受控需求变更入口，不用于修代码
- 不把 build 中的自然语言补充直接当作实现指令；只要改变需求或验收条件，先 amend
- 已归档变更不可 amend，必须开启新 change
