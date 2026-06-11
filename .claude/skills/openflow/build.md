---
name: openflow/build
description: Call Superpowers to execute implementation, supports checkpoint recovery
---

# Build: Superpowers 执行

## 目标

### 0. 依赖检测

执行前检查以下依赖是否可用：

| 依赖 | 检测方式 | 不可用时 |
|------|----------|----------|
| Superpowers writing-plans | 当前工具的本地或全局 skills 目录下是否存在 `writing-plans/SKILL.md` | 降级为手动拆解 plan-ready.md 中的步骤，逐条执行 |
| OpenSpec CLI | `openspec` 命令是否可执行 | 不影响 build 阶段，但 close 阶段归档需手动 mv |

如果 Superpowers 不可用，提示用户：
> "Superpowers 未安装，build 将使用手动执行模式。安装后体验更佳：请在当前工具中安装 Superpowers writing-plans skill（Claude Code: /plugin install superpowers@claude-plugins-official）"

如果 Superpowers 可用，调用其 `writing-plans` skill 生成详细实现计划。


读取 plan-ready.md，调用 Superpowers 的 writing-plans 生成详细实现计划，然后按 TDD 铁律执行。

## 中断续接规则

如果用户在 build 阶段被打断后继续回复、说“继续”、或补充实现细节，保持 build 阶段并从实现计划/checkbox 状态恢复。不要回到 proposal、brainstorming 或 spec。

如果用户明确要求修改需求、补充 spec、改变验收条件、改变功能边界或重新生成规格，停止实现并切到 `/openflow amend`。amend 完成后再回到 `/openflow build`。

## 前置条件

- `openspec/changes/<变更名>/plan-ready.md` 存在

如果不满足，提示：
> "还没生成 plan-ready.md。请先完成 /openflow spec。"

## 流程

### 1. 检测状态

检查以下文件确定当前状态：

| 检查 | 怎么查 | 结果 |
|------|--------|------|
| 有活跃变更？ | `openspec/changes/` 下非 archive 子目录 | 找到变更名 |
| 有 plan-ready.md？ | 变更目录下是否存在 | 不存在→提示先 spec |
| 实现已开始？ | `docs/superpowers/plans/` 下是否有对应计划文件 | 已开始→断点恢复 |

如果有多个活跃变更，列出并让用户选择。

### 2. 断点恢复（如适用）

如果检测到已有计划文件，检查其中 checkbox 状态：

- 全部勾选 → 提示实现已完成，建议 /openflow close
- 部分勾选 → 从未完成的 task 继续执行
- 无勾选 → 从头开始

### 3. 生成详细实现计划

调用 Superpowers 的 `writing-plans` skill，以 `plan-ready.md` 为输入，生成符合 Superpowers 格式的详细实现计划。

每个步骤：
- 2-5 分钟工作量
- 包含代码、文件路径、验证命令
- 使用 checkbox 语法 `- [ ]` 跟踪

将实现计划保存到：
```
docs/superpowers/plans/YYYY-MM-DD-<变更名>.md
```

### 4. 执行实现

按照 Superpowers 的执行流程：

1. **TDD 铁律**：先写失败测试，再写实现代码
2. **每个 task 一个 commit**
3. 多任务可派子代理并行（参见 subagent-driven-development skill）
4. 编译/测试不通过不让提交

### 5. 执行完成

所有 Superpowers 实现计划 task 完成后：

1. 重新读取 `openspec/changes/<变更名>/tasks.md`。
2. 对照已完成的实现计划、实际代码和验证结果，确认每个 OpenSpec task 都已经完成。
3. 将已完成的 OpenSpec task 从 `- [ ]` 更新为 `- [x]`。
4. 如果有 OpenSpec task 无法确认完成，不要勾选；记录缺口并继续执行对应实现或验证。

OpenSpec `tasks.md` 是归档前置状态，不能只完成 `docs/superpowers/plans/` 而保持 OpenSpec task 未勾选。

全部完成并同步后，提示用户：

> "所有实现任务已完成。接下来可以用 /openflow close 验证一致性并归档。"

## 关键原则

- **不允许在 build 阶段修改规格文档** — 发现需求遗漏或规格错误时切到 `/openflow amend`
- build 阶段可以更新 `openspec/changes/<变更名>/tasks.md` 的 checkbox 状态，但只能反映已验证完成的任务，不能改写任务内容或规格要求
- build 是唯一默认允许修改代码或实现文件的阶段；如果上一阶段不是 build，不要因为用户确认范围而自动写代码
- plan-ready.md 是锁定的设计决策，Superpowers 按计划展开执行，不重新理解需求
- 断点恢复依赖文件系统状态，不依赖 AI 的会话记忆
