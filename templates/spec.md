---
name: openflow/spec
description: Call OpenSpec to generate specs, auto-translate to plan-ready.md after user confirmation
---

# Spec: 生成规格并翻译

## 目标

调用 OpenSpec 生成完整的规格文档（proposal.md, design.md, specs/, tasks.md），用户确认后自动翻译成 Superpowers 可执行的 plan-ready.md。

## 中断续接规则

如果用户在本阶段被打断后继续回复、补充范围、要求调整规格、或确认规格摘要，仍然停留在 spec 阶段。只更新 `openspec/changes/**` 与 `plan-ready.md`，不要修改任何代码或实现文件。

## 前置条件

- `openspec/changes/` 下存在活跃变更目录（由 proposal 或 brainstorming 阶段创建）
- 变更目录下至少有 `proposal.md`

> 进入 spec 前必须先处理可选 grill-me 决策：如果当前对话或 proposal.md 没有明确显示用户已经选择 grill-me、跳过、不需要或直接 spec，先询问用户是否进入可选的 grill-me 压力测试；用户选择 grill-me / 压力测试 / 继续追问时切到 `/openflow grill`，用户选择跳过 / 不需要 / 直接 spec 后才继续本阶段。

## 流程

### 1. 确认活跃变更

检查 `openspec/changes/` 下是否有活跃变更（非 archive 子目录）。

如果没有，提示用户：
> "还没有活跃变更。请先用 /openflow proposal 或 /openflow brainstorming 创建需求。"

如果有多个，列出并让用户选择：
> "检测到多个活跃变更：[列表]。要对哪个生成规格？"

### 2. 生成 OpenSpec 规格文件

根据 proposal.md 的内容生成或补齐以下文件：

- `openspec/changes/<变更名>/proposal.md` — 已存在，可补充
- `openspec/changes/<变更名>/design.md` — 技术方案
- `openspec/changes/<变更名>/specs/` — 具体规格变更（标记新增/修改/删除）
- `openspec/changes/<变更名>/tasks.md` — 实现任务清单

如果 OpenSpec CLI 可用，生成后运行校验：

```bash
openspec validate <变更名> --strict
```

如果校验失败，根据错误修正上述文件后重新校验。

### 3. 与用户确认规格

展示规格摘要，逐项确认：

> "以下是规格摘要：
> - **提案**：[proposal.md 核心内容]
> - **设计**：[design.md 核心决策]
> - **任务**：[tasks.md 任务列表]
>
> 有需要调整的地方吗？"

用户确认后才进入翻译步骤。

### 4. 自动生成 plan-ready.md（翻译层）

用户确认后，自动将 OpenSpec 四文件翻译为 Superpowers 可执行的格式。

`plan-ready.md` 是交给 Superpowers `writing-plans` 的 planning brief，不是泛泛的任务摘要。它必须足够具体，使 build 阶段可以在不重新解释需求的情况下生成详细实现计划。

**上下文桥接规则：**
- OpenSpec 当前官方项目上下文入口是 `openspec/config.yaml` 的 `context:` 与 `rules:`，不是 legacy `openspec/project.md`
- 翻译前必须读取 `openspec/config.yaml`；如果存在 `openspec/project.md`，只把它当作迁移参考，并提示用户把有用内容迁移进 `config.yaml`
- `plan-ready.md` 必须显式包含 `## Project Context` 与 `## Applicable OpenSpec Rules`，把 OpenSpec 注入给规划阶段的项目规则继续传递给 Superpowers
- `plan-ready.md` 必须遵循 Superpowers `writing-plans` 的输入预期：计划应让“没有项目上下文的执行者”也能按 TDD、精确文件路径、验证命令和无占位符规则继续展开

**翻译规则：**
1. 覆盖 OpenSpec 的每个 requirement、scenario 和 task；不得只转写 tasks.md 标题
2. 将每个 OpenSpec Task 拆成可独立交付的 implementation slices；每个 slice 后续应能被 `writing-plans` 展开为 2-5 分钟步骤
3. 每个 slice 必须指明改动文件、测试文件、验证命令、依赖前置、完成标准
4. 明确 TDD 期望：先写/更新哪些失败测试，再实现，再运行哪些验证
5. **按执行依赖排序，不是按功能模块排序**
6. 记录来源路径和 OpenSpec task/requirement/scenario 映射，方便回溯
7. 如有不确定项，写入 `## Blockers / Clarifications`，不得隐藏为模糊实现步骤

读取以下文件作为翻译输入：
- `openspec/config.yaml` — 项目上下文、schema 和 artifact rules；必须写入 plan-ready 的 Project Context / Applicable OpenSpec Rules
- `openspec/specs/` — 当前系统行为真相；用于避免新规格与已归档能力冲突
- `openspec/changes/<变更名>/proposal.md`
- `openspec/changes/<变更名>/design.md`
- `openspec/changes/<变更名>/specs/` 目录下所有文件
- `openspec/changes/<变更名>/tasks.md`

生成 `openspec/changes/<变更名>/plan-ready.md`，格式如下：

```markdown
# 实现计划：<变更名>

## 来源
- 项目配置：openspec/config.yaml
- 当前规格：openspec/specs/
- 提案：openspec/changes/<变更名>/proposal.md
- 设计：openspec/changes/<变更名>/design.md
- 规格：openspec/changes/<变更名>/specs/
- 任务：openspec/changes/<变更名>/tasks.md

## Project Context
<从 openspec/config.yaml 的 context: 提炼。若 context 仍是 TODO/空白，写明“缺少项目上下文”，并在 Blockers / Clarifications 中要求补齐。不要改用通用最佳实践冒充项目规范。>

## Applicable OpenSpec Rules
<从 openspec/config.yaml 的 rules: 提炼与 specs/design/tasks 相关的规则。若没有规则，写“无显式规则”。>

## Goal
<一句话说明本次实现完成后的用户/系统可见结果>

## Non-Goals
- <明确不做的范围，避免 build 阶段扩张>

## Source Coverage
| OpenSpec 来源 | 验收点 | 对应 implementation slice |
|---------------|--------|---------------------------|
| `specs/<capability>/spec.md` / Requirement + Scenario | <验收行为> | Slice 1 |
| `tasks.md` / Task 1.1 | <任务目标> | Slice 1, Slice 2 |

## File Responsibility Map
| 文件 | 操作 | 责任 | 相关 slice |
|------|------|------|------------|
| `src/...` | create/modify | <该文件负责什么> | Slice 1 |
| `test/...` | create/modify | <验证什么行为> | Slice 1 |

## Implementation Slices

### Slice 1: <可交付切片名>
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
  - `npm test -- ...` — <预期通过什么>
  - `npm run build` — <预期结果>
- 完成标准：
  - <可观察验收标准>
- 风险/回滚：
  - <风险和如何撤回>

### Slice 2: ...

## Verification Plan
- 单元/集成验证：<命令和覆盖点>
- 类型/构建验证：<命令>
- 手动验证：<如需要，写具体步骤；不需要则写“无”>

## Blockers / Clarifications
- <若无，写“无”>

## Superpowers Handoff
- `writing-plans` 必须基于本文件生成 `docs/superpowers/plans/YYYY-MM-DD-<变更名>.md`
- 详细实现计划必须把本文件的 `## Project Context` 与 `## Applicable OpenSpec Rules` 复制/压缩到 plan header 或专门的 Project Rules 章节，使后续 `executing-plans` 不需要重新读取 OpenSpec 也能遵守项目规范
- 详细实现计划必须使用 Superpowers plan header：Goal、Architecture、Tech Stack，并包含文件结构、2-5 分钟 checkbox 步骤、RED-GREEN-REFACTOR 测试节奏、精确验证命令和 Self-Review
- 详细实现计划不得出现 TBD/TODO/“适当处理”/“类似上一步”等占位话术
- 详细实现计划必须使用 checkbox，并把每个 slice 展开为 2-5 分钟步骤
- 详细实现计划不得省略 Source Coverage 中的任何验收点
```

生成后做一次自检：
- Source Coverage 是否覆盖所有 requirement、scenario、tasks.md 条目
- 是否仍有 TBD/TODO/“适当处理”等占位话术
- 每个 slice 是否都有文件、测试、验证命令和完成标准
- build 阶段是否可以不重新理解需求，仅按 handoff 展开详细计划

### 4.5 更新 workflow-status.md

更新 `openspec/changes/<变更名>/workflow-status.md`，反映 spec 阶段完成：

- Phase: `spec`
- Capture Mode: `none`（已脱离捕获阶段）
- Status: `ready_for_next_phase`
- Gates 更新：
  - `Requirements captured` → `passed`（已有 proposal.md）
  - `Specs validated` → `passed`（spec 文件已生成并通过校验）
  - `Plan ready` → `passed`（plan-ready.md 已生成）
- Tasks: 从 `tasks.md` 同步任务列表到 workflow-status.md，状态设为 `pending`
- Next Command: `/openflow build`
- Next Action: 执行实现计划

示例：

```markdown
# Workflow Status: <变更名>

## Summary

- Phase: spec
- Capture Mode: none
- Status: ready_for_next_phase
- Last Updated: YYYY-MM-DD
- Next Command: /openflow build
- Next Action: Execute implementation plan.

## Gates

| Gate | Status | Evidence |
|------|--------|----------|
| Requirements captured | passed | proposal.md |
| Specs validated | passed | specs/*, tasks.md |
| Plan ready | passed | plan-ready.md |
| Implementation complete | pending | - |
| Verification complete | pending | - |
| Archived | pending | - |

## Tasks

| ID | Task | Status | Verification | Blocked By | Notes |
|----|------|--------|--------------|------------|-------|
| T1 | <task from tasks.md> | pending | - | - | - |

## Amendments

| Date | Reason | Affected Specs | Affected Tasks | Status |
|------|--------|----------------|----------------|--------|
```

### 5. 提示下一步

> "规格已确认，plan-ready.md 已生成。接下来可以用 `/openflow build` 开始实现。"

## 关键原则

- **一条代码都不许写** — spec 阶段只产出文档
- 本阶段只允许写 `openspec/changes/**` 与 `plan-ready.md`，禁止修改任何代码或实现文件
- 翻译必须在用户确认后自动生成，不需要用户手动触发
- plan-ready.md 的 ## 来源 部分必须写明路径，方便 Superpowers 执行时回溯
- plan-ready.md 必须包含 Source Coverage 和 File Responsibility Map；缺少这些内容视为未完成翻译
- 按执行依赖排序是翻译的关键步骤：先依赖后依赖方
