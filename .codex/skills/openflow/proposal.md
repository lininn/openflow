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

## 执行前门禁

执行本阶段前，必须遵守主 `openflow/SKILL.md` 的 “OpenSpec 初始化入口门禁”：如果缺少 `openspec/config.yaml`，必须先询问用户是否 init；只有用户明确跳过后才允许继续本阶段。

## 流程

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
