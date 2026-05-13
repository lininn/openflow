---
name: openflow/spec
description: 调用 OpenSpec 生成规格文档，确认后自动翻译为 plan-ready.md
---

# Spec: 生成规格并翻译

## 目标

调用 OpenSpec 生成完整的规格文档（proposal.md, design.md, specs/, tasks.md），用户确认后自动翻译成 Superpowers 可执行的 plan-ready.md。

## 前置条件

- `openspec/changes/` 下存在活跃变更目录（由 proposal 或 brainstorming 阶段创建）
- 变更目录下至少有 `proposal.md`

## 流程

### 1. 确认活跃变更

检查 `openspec/changes/` 下是否有活跃变更（非 archive 子目录）。

如果没有，提示用户：
> "还没有活跃变更。请先用 /openflow proposal 或 /openflow brainstorming 创建需求。"

如果有多个，列出并让用户选择：
> "检测到多个活跃变更：[列表]。要对哪个生成规格？"

### 2. 调用 OpenSpec 生成规格

调用 OpenSpec 的 propose 命令（或 OPSX 工作流）生成完整规格：

```bash
openspec propose <变更名>
```

如果 OpenSpec CLI 不可用，手动根据 proposal.md 的内容生成以下文件：

- `openspec/changes/<变更名>/proposal.md` — 已存在，可补充
- `openspec/changes/<变更名>/design.md` — 技术方案
- `openspec/changes/<变更名>/specs/` — 具体规格变更（标记新增/修改/删除）
- `openspec/changes/<变更名>/tasks.md` — 实现任务清单

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

**翻译规则：**
1. 每个 OpenSpec Task 拆成 2-5 个细粒度步骤（对应 2-5 分钟工作量）
2. 每个步骤必须指明改哪个文件
3. 每个步骤必须有验证方式
4. **按执行依赖排序，不是按功能模块排序**
5. 记录来源路径，方便回溯

读取以下文件作为翻译输入：
- `openspec/changes/<变更名>/proposal.md`
- `openspec/changes/<变更名>/design.md`
- `openspec/changes/<变更名>/specs/` 目录下所有文件
- `openspec/changes/<变更名>/tasks.md`

生成 `openspec/changes/<变更名>/plan-ready.md`，格式如下：

```markdown
# 实现计划：<变更名>

## 来源
- 提案：openspec/changes/<变更名>/proposal.md
- 设计：openspec/changes/<变更名>/design.md
- 规格：openspec/changes/<变更名>/specs/
- 任务：openspec/changes/<变更名>/tasks.md

## 实现步骤

### Task 1: <任务名>
- 目标：<做什么>
- 改动文件：<哪些文件>
- 验证方式：<怎么验证>

### Task 2: ...
```

### 5. 提示下一步

> "规格已确认，plan-ready.md 已生成。接下来可以用 `/openflow build` 开始实现。"

## 关键原则

- **一条代码都不许写** — spec 阶段只产出文档
- 翻译必须在用户确认后自动生成，不需要用户手动触发
- plan-ready.md 的 ## 来源 部分必须写明路径，方便 Superpowers 执行时回溯
- 按执行依赖排序是翻译的关键步骤：先依赖后依赖方
