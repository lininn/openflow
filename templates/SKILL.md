---
name: openflow
description: "OpenSpec + Superpowers 工作流协调器。使用 /openflow proposal 轻量提问、/openflow brainstorming 深度设计、/openflow spec 生成规格、/openflow build 执行实现、/openflow close 验证归档。串联需求规格与工程执行，消除格式鸿沟。"
---

# openflow: 工作流协调器

根据用户调用的子命令和项目当前状态，路由到对应阶段。

## 子命令

| 命令 | 阶段 | 说明 |
|------|------|------|
| `/openflow proposal` | proposal | 轻量提问，快速收敛需求 |
| `/openflow brainstorming` | brainstorming | 深度设计，多轮探索 |
| `/openflow spec` | spec | 调用 OpenSpec 生成规格 + 翻译 |
| `/openflow build` | build | 调用 Superpowers 执行实现 |
| `/openflow close` | close | 验证一致性 + 归档 |

## 状态检测

当用户调用 `/openflow` 不带子命令，或调用某个子命令需要确认前置条件时，执行以下状态检测：

| 检查项 | 怎么查 | 结果 |
|--------|--------|------|
| 有活跃变更？ | `openspec/changes/` 下是否有非 archive 子目录 | 有→继续 |
| 有 plan-ready.md？ | 变更目录下是否有 `plan-ready.md` | 有→看实现状态 |
| 实现已开始？ | `docs/superpowers/plans/` 下是否有计划文件 | 有→看是否完成 |
| 实现已完成？ | 计划文件全部 checkbox 已勾选 | 是→close 阶段 |

判定结果：
- 无活跃变更 → proposal 阶段
- 有规格但无 plan-ready.md → spec 阶段（补生成翻译）
- 有 plan-ready.md 但实现未开始 → build 阶段
- 实现进行中 → 继续 build 阶段（断点恢复）
- 实现已完成 → close 阶段

## 路由

根据子命令或状态检测结果，读取对应阶段文件并执行：

1. 如果用户指定了子命令（如 `/openflow build`），优先按指定阶段执行，但检查前置条件
2. 如果用户只输入 `/openflow`，执行状态检测，自动路由到对应阶段
3. 读取阶段文件：`${CLAUDE_SKILL_DIR}/<阶段>.md`
4. 按阶段文件中的流程执行

### 前置条件检查

| 阶段 | 前置条件 | 不满足时提示 |
|------|----------|-------------|
| proposal | 无 | — |
| brainstorming | 无 | — |
| spec | 需要有活跃变更目录或有用户需求 | "请先用 /openflow proposal 或 /openflow brainstorming 描述需求" |
| build | 需要存在 plan-ready.md | "请先完成 /openflow spec 生成规格和翻译" |
| close | 需要实现已完成 | "实现尚未完成，请先用 /openflow build 执行" |
