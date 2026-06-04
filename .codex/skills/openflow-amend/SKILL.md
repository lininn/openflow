---
name: openflow-amend
description: "OpenFlow amend: Revise requirements/specs before close. Visibility alias for openflow amend."
argument-hint: "[optional context]"
---

# openflow-amend

这是 `openflow amend` 的补全可见别名。

执行时必须按以下方式处理：

1. 将本次调用视为用户调用了 `/openflow amend $ARGUMENTS`
2. 读取同级 skills 目录中的 `openflow/SKILL.md`
3. 读取 `openflow/amend.md`
4. 严格遵守主 openflow 工作流、阶段写入边界和当前阶段文件
5. 如果 `$ARGUMENTS` 中有额外需求或上下文，将它作为 amend 阶段输入
