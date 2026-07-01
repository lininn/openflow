---
name: openflow/init
description: Interactive project-context setup for openspec/config.yaml
---

# Init: 项目上下文初始化

## 目标

通过代码扫描和用户交互，初始化或精炼当前项目的 `openspec/config.yaml`。本阶段重点是读取用户项目的代码风格、架构边界、测试方式和实现限制，让后续 `/openflow proposal`、`/openflow spec`、`/openflow build` 有项目级约束可用。

## 写入边界

允许写入：
- `openspec/config.yaml`
- `.openflow/state.json`（仅在需要记录工具初始化状态时）

禁止写入：
- 任何代码、测试、构建配置或业务实现文件
- `openspec/changes/**` 变更目录
- `plan-ready.md` 或 `docs/superpowers/plans/**`

## 流程

### 1. 检查现状

先读取并汇总：
- `package.json`、锁文件、构建配置、测试配置
- 常见项目入口和目录结构，如 `src/`、`app/`、`pages/`、`components/`、`server/`、`tests/`
- 已有规范文件，如 `README*`、`CONTRIBUTING*`、`AGENTS.md`、`.editorconfig`、lint/format 配置
- 已有 `openspec/config.yaml` 或 legacy `openspec/project.md`
- 项目文档和生成产物语言：优先判断 README/docs/OpenSpec 文档的主要语言，不要只按当前对话语言判断

如果项目有源码，基于事实总结项目类型、技术栈、代码风格、测试命令和边界。不要凭通用经验替代实际扫描结果。

语言偏好判断：
- 如果项目文档明显以中文为主，后续 proposal、tasks、plan-ready、workflow-status、节点说明和面向用户摘要应使用中文，写入 `language.artifacts: zh-CN`，`detection: inferred`
- 如果项目文档明显以英文为主，写入 `language.artifacts: en-US`，`detection: inferred`
- 如果无法判断，必须在 init 阶段问用户一次，并把选择写入 `language.artifacts`，`detection: user-confirmed`
- 如果没有项目偏好且用户也未提供，才默认 `en-US`，`detection: defaulted`
- Parser-required OpenSpec headings、CLI commands、code identifiers、protocol keywords 必须保持其要求的原始形式，不随生成产物语言翻译

### 2. 空项目分支

如果当前目录没有足以判断技术栈和代码风格的源码或配置，说明这是空项目或近似空项目，然后询问用户选择技术栈和规则。

给出行业标准选项供用户选择或改写：

1. **TypeScript CLI / Node.js** — strict TypeScript、ESM、Commander/Node 原生 API、Vitest、`npm run lint && npm run build && npm test`
2. **React / Next.js Web App** — TypeScript、App Router 或明确路由约定、组件分层、无障碍基础、Vitest/Playwright 按风险选择
3. **Vue / Vite Web App** — TypeScript、组合式 API、组件和 composable 分层、Vitest、构建前 typecheck
4. **Python Service** — typed Python、pytest、ruff、清晰 service/domain 边界、配置和密钥隔离
5. **Other / 自定义** — 用户描述技术栈、测试命令、代码风格和限制

空项目默认不要写“已发现”的事实；把未验证内容标记为用户选择或推荐默认。

### 3. 交互问题

根据扫描结果或空项目选择，最多一次提出 4-6 个高价值问题：

1. 项目目标和主要用户是谁？
2. 技术栈、运行时和包管理器是否确认？
3. 必须遵守的代码风格、目录边界、架构模式是什么？
4. 常用验证命令是什么？例如 lint、typecheck、test、build、e2e。
5. AI 实现限制是什么？例如不要新增依赖、不要改 API、不要碰某些目录、需要兼容的浏览器/Node 版本。
6. 如果项目文档语言无法判断，生成计划、节点和面向用户摘要应使用中文还是英文？
7. 是否有安全、性能、合规、发布流程等硬约束？

已有事实不要重复询问；只问无法从仓库判断、且会影响后续实现质量的问题。

### 4. 写入 config.yaml

将结果写入 `openspec/config.yaml`。推荐结构：

```yaml
schema: spec-driven
language:
  artifacts: zh-CN
  detection: inferred
  appliesTo:
    - proposal
    - tasks
    - plan-ready
    - workflow-status
    - human-facing summaries
context: |
  Purpose:
    ...
  Tech Stack:
    ...
  Architecture:
    ...
  Code Style:
    ...
  Testing:
    ...
  Constraints:
    ...
rules:
  specs:
    - ...
  design:
    - ...
  tasks:
    - ...
  implementation:
    - ...
  artifacts:
    - Follow language.artifacts for human-facing OpenFlow outputs.
    - Parser-required OpenSpec headings, CLI commands, code identifiers, and protocol keywords must remain in their required original form.
```

要求：
- `language.artifacts` 是后续所有 OpenFlow 人类可读产物的默认语言；计划、任务节点、workflow-status、摘要必须遵守
- `language.detection` 必须说明来源：`inferred`、`user-confirmed` 或 `defaulted`
- `context:` 简洁、具体、可执行，不写空泛口号
- `rules:` 使用短句，明确后续 AI 必须遵守的限制
- 如果来自扫描，写成事实；如果来自用户选择，写成约定；如果是行业标准默认，标记为 recommended default
- 保留已有有价值内容，删除 TODO 占位和明显过期的泛化文本
- 如果存在 `openspec/project.md`，只作为迁移参考；不要继续把它当权威入口

### 5. 完成提示

完成后总结：
- 已写入或更新的关键上下文
- 仍然缺失、建议用户以后补充的项目规则
- 下一步建议：`/openflow proposal` 或 `/openflow brainstorming`

## 注意

- 本阶段不创建 OpenSpec change，不写 proposal、spec、tasks
- 不要修改业务代码
- 不要为用户编造项目规则
- 对空项目可以给行业标准建议，但必须区分“用户确认的规则”和“推荐默认”
