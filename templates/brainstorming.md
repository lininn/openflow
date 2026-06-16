---
name: openflow/brainstorming
description: Deep design — multi-round exploration to confirm architecture and approach
---

# Brainstorming: 深度设计

## 目标

通过多轮对话，深入探索需求、方案取舍和架构决策。产出比 proposal 更完整的需求描述和设计方向。

## 中断续接规则

如果用户在本阶段被打断后继续回复、补充范围、回答确认问题、或修正边界，仍然停留在 brainstorming 阶段。继续收敛设计并更新 `openspec/changes/**/proposal.md`，不要因为用户明确了范围就直接进入实现或修改任何代码。

典型错误：在确认“只改企业端？”后，用户回复“运营端也要做回显”，这只是范围修正，必须继续记录需求和方案，不得直接修改任何代码或实现文件。

## 流程

### 1. 理解背景

先快速检查项目上下文：
- 最近的相关 git 提交
- 现有代码结构
- 相关文档

### 2. 逐个提问

一次只问一个问题，逐步深入。问题类型：

- **目的** — "这个功能的核心用户场景是什么？"
- **取舍** — "A 方案更简单但扩展性差，B 方案更灵活但复杂。你倾向哪个？"
- **边界** — "如果 X 情况发生，期望的行为是什么？"
- **优先级** — "这几个需求里，哪个最重要？"

### 3. 提出 2-3 种方案

基于讨论，提出 2-3 种实现方案，附上取舍分析。推荐一种并说明理由。

### 4. 确认设计

用户选定方案后，整理设计要点并与用户确认：

> "确认的设计方向：[方案名]。核心决策：[2-3 条]。这样对吗？"

### 5. 创建 OpenSpec 变更目录

用户确认后，按 OpenSpec 目录约定创建变更。`<变更名>` 使用 kebab-case、动词开头（如 `add-user-login`）：

```bash
mkdir -p openspec/changes/<变更名>/specs
```

将确认的需求描述和设计方向写入 `openspec/changes/<变更名>/proposal.md`。

如果 OpenSpec CLI 可用，可用以下命令检查当前变更列表：

```bash
openspec list
```

### 5.5 初始化 workflow-status.md

创建或更新 `openspec/changes/<变更名>/workflow-status.md`：

```markdown
# Workflow Status: <变更名>

## Summary

- Phase: capture
- Capture Mode: brainstorming
- Status: ready_for_next_phase
- Last Updated: YYYY-MM-DD
- Next Command: /openflow spec
- Next Action: Generate OpenSpec specs, tasks, and plan-ready.md.

## Gates

| Gate | Status | Evidence |
|------|--------|----------|
| Requirements captured | passed | proposal.md |
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

如果已经能从设计讨论中明确任务，填入 Tasks 表并把状态设为 `pending`。不要把猜测性任务写入状态表。

### 6. 询问是否进入可选 grill-me

proposal.md 写入后，必须询问用户是否进入可选的 grill-me 压力测试节点：

> "需求和设计方向已记录。是否要先进入可选的 grill-me 压力测试？我会逐个追问隐藏假设、边界和风险；你也可以输入“跳过”，直接进入 `/openflow spec` 生成完整规格。"

- 用户选择 grill-me / 压力测试 / 继续追问 → 切到 `/openflow grill`
- 用户选择跳过 / 不需要 / 直接 spec → 提示下一步为 `/openflow spec`
- 用户继续补充细节 → 仍停留在 brainstorming 阶段并更新 `proposal.md`

## 注意

- 不要写代码
- 本阶段只允许写 OpenSpec 需求/设计方向文档，禁止修改任何代码或实现文件
- 不要跳过取舍讨论直接给答案
- 如果项目很大，建议先拆分成独立的子项目
- 允许用户改变方向，不要过早锁定
