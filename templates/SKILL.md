---
name: openflow
description: "OpenSpec + Superpowers workflow orchestrator. Use /openflow init for project context setup, /openflow proposal for quick capture, /openflow brainstorming for deep design, /openflow grill to stress-test the proposal, /openflow spec to generate specs + translate, /openflow amend to revise requirements before close, /openflow build to execute, /openflow close to verify and archive. Bridges requirements specs and engineering execution."
argument-hint: "proposal | init | brainstorming | grill | spec | amend | build | close"
---

# openflow - 工作流协调器

根据用户调用的子命令和项目当前状态，路由到对应阶段。

## `/openflow init`

`/openflow init` 是项目上下文初始化阶段。它负责读取当前项目、询问技术栈和规则、生成 `openspec/config.yaml`，并把行业标准默认值和用户确认规则区分开来。

空项目时，优先问清楚：
- 想做什么类型的项目
- 计划使用的技术栈、运行时、包管理器
- 必须遵守的代码风格、测试命令、目录边界
- 是否有兼容性、安全、性能、发布约束

如果当前目录已有源码，先基于事实扫描再提问，避免重复询问已知信息。

## OpenSpec 初始化入口门禁

本门禁只适用于 `proposal` 和 `brainstorming` 两个入口阶段。执行 `/openflow proposal`、`/openflow brainstorming`，或裸 `/openflow` 经状态检测判定要进入 `proposal` / `brainstorming` 阶段时，必须先检查项目级 OpenSpec 上下文：

1. 在任何项目扫描、需求分析、创建 change 之前，先检查 `openspec/config.yaml` 是否存在
2. 如果 `openspec/config.yaml` 已存在，不要提示 init，直接继续 `proposal` 或 `brainstorming` 阶段
3. Missing `openspec/config.yaml` 是上下文缺失，不是硬阻断，但必须先询问用户是否执行 `/openflow init`
4. 用户同意时，切到 `/openflow init`，通过交互和代码扫描生成或完善 `openspec/config.yaml`，完成后回到原入口阶段
5. 只有用户明确表示跳过、不初始化、暂不 init、继续但不 init 等同义意图后，才允许继续 `proposal` 或 `brainstorming` 阶段
6. 用户明确跳过时，必须说明本次没有 `config.yaml` 项目约束，不得把通用最佳实践冒充项目规则
7. 如果只存在 legacy `openspec/project.md`，提示可以通过 `/openflow init` 迁移和精炼到 `config.yaml`；用户跳过时只把 `project.md` 当参考，不当作当前权威入口
8. `grill`、`spec`、`amend`、`build`、`close` 阶段不得触发本初始化询问；如果前置入口阶段已经由用户明确跳过 init，后续阶段沿用该结果继续执行

全局安装只负责把可复用 skills 写入用户目录，不代表当前业务项目已经初始化。CLI 级 `{{OPENFLOW_PROJECT_INIT_COMMAND}}` 负责安装/生成本地 skill；AI 工作流级 `/openflow init` 负责交互式生成项目上下文。

## 续接与中断恢复

如果本轮没有显式 `/openflow ...` 子命令，但上一轮已经进入 openflow 任一阶段，并且用户是在补充范围、回答确认问题、说“继续”、修正需求、或说明新增/移除边界：

1. 默认继续上一 openflow 阶段，不把该回复当作普通编码请求
2. 如果上一阶段是 init、proposal、brainstorming、grill、spec 或 amend，只能继续产出/更新项目上下文、OpenSpec 文档和计划文档，不得修改任何代码或实现文件
3. 如果上一阶段是 build，但用户补充的是需求、验收条件或规格边界变更，切到 `/openflow amend`，不要直接改代码
4. 只有用户显式调用 `/openflow build`，或状态检测明确进入 build 阶段后，才允许修改代码或实现文件
5. 中断后恢复时，先重新读取当前阶段文件和 `openspec/changes/` 状态，再继续执行

典型场景：
- init 阶段询问技术栈和规则后，用户回复“用 React + Vite，必须跑 typecheck”。这仍是项目上下文补充，必须继续更新 `openspec/config.yaml`，不能直接进入代码实现。
- proposal 阶段整理需求后，用户补充“运营端也要做回显”。这仍是需求范围修正，必须继续 proposal 文档收敛，不能直接进入代码实现。
- brainstorming 阶段询问“是否只覆盖企业端？”后，用户回复“运营端也要做回显”。这仍是设计范围修正，必须继续 brainstorming/proposal 文档收敛，不能直接进入代码实现。

## 阶段写入边界

| 阶段 | 允许写入 | 禁止写入 |
|------|----------|----------|
| init | `openspec/config.yaml`、`.openflow/state.json`（如需记录工具状态） | 任何代码或实现文件；不得创建 change |
| proposal | `openspec/changes/**/proposal.md` | 任何代码或实现文件 |
| brainstorming | `openspec/changes/**/proposal.md` | 任何代码或实现文件 |
| grill | `openspec/changes/**/proposal.md` | 任何代码或实现文件 |
| spec | `openspec/changes/**`、`plan-ready.md` | 任何代码或实现文件 |
| amend | `openspec/changes/**`、`plan-ready.md`、`docs/superpowers/plans/*.md` | 代码、测试、其他实现文件 |
| build | 代码、测试、实现计划状态、`openspec/changes/**/tasks.md` checkbox 状态 | 规格文档（除非另开变更）；不得改写任务内容或规格要求 |
| close | 归档、验证记录、`close-issues.md`、`openspec/changes/**/tasks.md` checkbox 状态 | 代码、测试、其他实现文件；不得改写任务内容或规格要求 |

如果用户在 init/proposal/brainstorming/grill/spec/amend 阶段提出“就按这个做”、“范围改成 X”、“继续”等话术，不代表进入 build；必须先完成该阶段文档产物并提示下一步。

## 子命令

| 命令 | 阶段 | 说明 |
|------|------|------|
| `/openflow init` | init | 初始化或精炼 `openspec/config.yaml` 项目上下文和规则 |
| `/openflow proposal` | proposal | 轻量提问，快速收敛需求 |
| `/openflow brainstorming` | brainstorming | 深度设计，多轮探索 |
| `/openflow grill` | grill | 可选压力测试，反向追问决策点 |
| `/openflow spec` | spec | 调用 OpenSpec 生成规格 + 翻译 |
| `/openflow amend` | amend | build/close 前受控修改需求、规格和计划 |
| `/openflow build` | build | 调用 Superpowers 执行实现 |
| `/openflow close` | close | 验证一致性 + 归档 |

## 状态检测与 Dashboard

当用户调用 `/openflow` 不带子命令，或调用某个子命令需要确认前置条件时，先读取当前 active change 的 `workflow-status.md`。如果文件不存在，基于文件系统推断状态，并明确标记为 inferred。

状态源优先级：

1. `openspec/changes/<change-id>/workflow-status.md` — 流程导航状态
2. 文件系统扫描 — 校验状态是否真实存在
3. 会话记忆 — 只能用于续接，不可作为事实来源

Dashboard 必须显示：

- 当前 active change
- 状态来源：`workflow-status.md` 或 `inferred from files`
- Phase：`capture | spec | build | close | archived`
- Capture Mode：`proposal | brainstorming | none`
- Overall Status：`pending | in_progress | blocked | ready_for_next_phase | completed`
- Gates：需求、规格、计划、实现、验证、归档
- Tasks：按 `pending/in_progress/blocked/implemented/verified/done/failed/superseded` 统计
- Conflicts：状态文件和实际文件不一致时必须列出
- Next Command / Next Action

如果只有一个 active change，直接展示该 change 的 dashboard。如果有多个 active changes，先列出所有 dashboard，然后询问用户要操作哪一个。

### 缺失 workflow-status.md 的处理

如果 active change 没有 `workflow-status.md`：

| 文件状态 | 推断 Phase | 推断 Status | Next |
|----------|------------|-------------|------|
| 有 `proposal.md`，无 `plan-ready.md`，且无 grill 决策记录 | capture | blocked | 询问是否进入可选 grill-me |
| 有 `proposal.md`，无 `plan-ready.md`，且已明确跳过 grill-me 或 grill 已完成 | capture | ready_for_next_phase | `/openflow spec` |
| 有 `plan-ready.md`，无实现计划 | spec | ready_for_next_phase | `/openflow build` |
| 有实现计划且 checkbox 未完成 | build | in_progress | `/openflow build` |
| 有实现计划且 checkbox 全完成 | build | ready_for_next_phase | `/openflow close` |

推断 dashboard 必须写明 `Source: inferred from files`，不得伪装成权威状态。

### 冲突处理

如果 `workflow-status.md` 与文件系统冲突，必须显示冲突并推荐修复动作，不得静默覆盖。

示例：

```text
Warning: workflow-status.md says Plan ready = passed, but plan-ready.md is missing.
Recommended fix: run /openflow spec to regenerate plan-ready.md or amend the status.
```

判定结果：
- 无 active change → 提示从 `/openflow proposal` 或 `/openflow brainstorming` 开始
- Phase = capture 且 blocked，缺少 grill 决策 → 询问是否进入可选 grill-me；用户选择跳过 / 不需要 / 直接 spec 后，更新状态为 ready_for_next_phase 并推荐 `/openflow spec`
- Phase = capture 且 ready_for_next_phase → 推荐 `/openflow spec`
- Phase = spec 且 ready_for_next_phase → 推荐 `/openflow build`
- Phase = build 且 in_progress → 继续 `/openflow build`
- Phase = build 且 ready_for_next_phase → 推荐 `/openflow close`
- Phase = close 且 blocked → 推荐 `/openflow amend`
- Phase = archived 且 completed → 提示变更已完成，可以开始新 change

## 路由

根据子命令或状态检测结果，读取对应阶段文件并执行：

1. 如果这是上一 openflow 阶段的续接回复，先按“续接与中断恢复”保持阶段
2. 如果用户在 build 中明确提出需求变更、补充 spec、修改验收条件或重新生成规格，路由到 amend
3. 如果用户指定了子命令（如 `/openflow build`），优先按指定阶段执行，但检查前置条件
4. 如果用户只输入 `/openflow`，执行状态检测；若命中“有活跃变更且无 plan-ready.md”，先询问是否进入可选 grill-me，不得直接加载 spec
5. 读取当前 openflow skill 目录下的阶段文件：`<阶段>.md`（与本 `SKILL.md` 同目录；不要依赖 Claude 专属环境变量）
6. 按阶段文件中的流程执行，并遵守阶段写入边界

### 前置条件检查

| 阶段 | 前置条件 | 不满足时提示 |
|------|----------|-------------|
| init | 无；可用于空项目或已有项目 | — |
| proposal | 无；缺少 `openspec/config.yaml` 时询问用户是否执行 `/openflow init`，跳过则继续 | "当前项目尚未初始化项目上下文。是否先执行 /openflow init？也可以跳过并继续无项目约束的需求捕获。" |
| brainstorming | 无；缺少 `openspec/config.yaml` 时询问用户是否执行 `/openflow init`，跳过则继续 | "当前项目尚未初始化项目上下文。是否先执行 /openflow init？也可以跳过并继续无项目约束的设计探索。" |
| grill | 需要有活跃变更目录且有 proposal.md | "请先用 /openflow proposal 或 /openflow brainstorming 创建需求" |
| spec | 需要有活跃变更目录或有用户需求 | "请先用 /openflow proposal 或 /openflow brainstorming 描述需求" |
| amend | 需要有活跃变更目录，通常需要 plan-ready.md | "还没有可修订的活跃变更，请先完成 /openflow spec" |
| build | 需要存在 plan-ready.md | "请先完成 /openflow spec 生成规格和翻译" |
| close | 需要实现已完成 | "实现尚未完成，请先用 /openflow build 执行" |
