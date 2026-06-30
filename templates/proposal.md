---
name: openflow/proposal
description: Lightweight requirement capture — 3-5 questions to quickly converge on requirements
---

# Proposal: 轻量需求捕获

## 目标

用最少的提问，把用户脑子里的需求变成可执行的变更描述。不做深度设计，不生成代码。

## 中断续接规则

如果用户在本阶段被打断后继续回复、补充范围、回答确认问题、或修正边界，仍然停留在 proposal 阶段。继续更新 `openspec/changes/**/proposal.md`，不要因为用户说“就这样做”“继续”“范围改成 X”而写任何代码或实现文件。

典型错误：proposal 阶段确认“只改企业端？”后，用户回复“运营端也要做回显”。这只是需求范围补充，必须继续更新 proposal，不得直接修改任何代码或实现文件。

## 流程

## 0. 项目初始化检测

这是本阶段的第一步。在任何项目扫描、需求分析、创建 change 之前，必须先检查当前工作目录是否已经完成项目级 OpenSpec 初始化。不得先读取 `package.json`、不得先 `rg`/`ls` 分析项目、不得先创建 `openspec/changes/**`。

1. 检查 `openspec/config.yaml` 是否存在
2. 如果 `openspec/config.yaml` 已存在，不要提示 init，直接继续后续需求捕获
3. 如果不存在，提示当前项目尚未初始化项目上下文，并询问用户是否先执行 `/openflow init`
4. 如果用户同意，切到 `/openflow init`，通过交互和项目扫描生成 `openspec/config.yaml`，完成后再回到 proposal 阶段
5. 只有用户明确表示跳过、不初始化、暂不 init、继续但不 init 等同义意图后，才允许继续本阶段
6. 如果用户明确跳过，继续本阶段，但明确说明本次没有 `config.yaml` 项目约束；后续问题只能基于用户输入和已扫描事实，不得编造项目规则
7. 如果只存在 legacy `openspec/project.md`，提示 `/openflow init` 可以迁移并精炼为 `config.yaml`；用户跳过时只把 `project.md` 当参考

不要把全局 skill 安装视为项目已初始化。`openflow init --global` 只安装全局入口，不会也不应该替某个业务项目写入 `openspec/`。CLI 命令 `{{OPENFLOW_PROJECT_INIT_COMMAND}}` 只负责安装/生成本地 skill；工作流命令 `/openflow init` 才负责交互式项目上下文初始化。

### 1. 提出关键问题

一次性提出以下 3-5 个核心问题（根据上下文调整措辞）：

1. **做什么** — 你想实现什么功能/变更？
2. **为什么** — 解决什么问题？给谁用的？
3. **成功标准** — 怎样算做完了？验收条件是什么？
4. **边界** — 什么不在范围内？
5. **现有约束** — 有没有技术栈、兼容性、时间上的限制？

### 2. 确认需求

用户回答后，整理成一段简洁的需求描述，与用户确认：

> "我理解的需求是：[一句话概括]。具体来说：[2-3 条要点]。这样理解对吗？"

### 3. 创建 OpenSpec 变更目录

用户确认后，按 OpenSpec 目录约定创建变更。`<变更名>` 使用 kebab-case、动词开头（如 `add-user-login`）：

```bash
mkdir -p openspec/changes/<变更名>/specs
```

将确认的需求描述写入 `openspec/changes/<变更名>/proposal.md`。

如果 OpenSpec CLI 可用，可用以下命令检查当前变更列表：

```bash
openspec list
```

### 3.5 初始化 workflow-status.md

创建或更新 `openspec/changes/<变更名>/workflow-status.md`：

```markdown
# Workflow Status: <变更名>

## Summary

- Phase: capture
- Capture Mode: proposal
- Status: blocked
- Last Updated: YYYY-MM-DD
- Next Command: /openflow grill
- Next Action: Ask whether to run optional grill-me pressure testing; only move to /openflow spec after the user explicitly skips grill-me or grill completes.

## Gates

| Gate | Status | Evidence |
|------|--------|----------|
| Requirements captured | passed | proposal.md |
| Grill decision | pending | Ask user whether to run optional grill-me |
| Specs validated | pending | - |
| Plan ready | pending | - |
| Implementation complete | pending | - |
| Verification complete | pending | - |
| Archived | pending | - |

## Tasks

| ID | Task | Status | Verification | Blocked By | Notes |
|----|------|--------|--------------|------------|-------|

## Amendments

| Date | Reason | Affected Specs | Affected Tasks | Status |
|------|--------|----------------|----------------|--------|
```

如果已经能从用户需求中明确任务，填入 Tasks 表并把状态设为 `pending`。不要把猜测性任务写入状态表。

### 4. 询问是否进入可选 grill-me

proposal.md 写入后，必须询问用户是否进入可选的 grill-me 压力测试节点：

> "需求已记录。是否要先进入可选的 grill-me 压力测试？我会逐个追问隐藏假设、边界和风险；你也可以输入“跳过”，直接进入 `/openflow spec` 生成完整规格。"

- 用户选择 grill-me / 压力测试 / 继续追问 → 切到 `/openflow grill`
- 用户选择跳过 / 不需要 / 直接 spec → 提示下一步为 `/openflow spec`
- 用户继续补充细节 → 仍停留在 proposal 阶段并更新 `proposal.md`

## 注意

- 不要做技术设计，那是 spec 和 brainstorming 的事
- 不要写代码
- 本阶段只允许写 OpenSpec 需求文档，禁止修改任何代码或实现文件
- 问题要具体，不要泛泛而谈
- 如果用户的需求很大（跨多个独立子系统），建议拆分
