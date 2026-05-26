---
name: openflow-close
description: "OpenFlow close: Verify consistency and archive. Visibility alias for openflow close."
argument-hint: "[optional context]"
---

# openflow-close

这是 `openflow close` 的补全可见别名。

执行时必须按以下方式处理：

1. 将本次调用视为用户调用了 `/openflow close $ARGUMENTS`
2. 读取同级 skills 目录中的 `openflow/SKILL.md`
3. 读取 `openflow/close.md`
4. 严格遵守主 openflow 工作流、阶段写入边界和当前阶段文件
5. 如果 `$ARGUMENTS` 中有额外需求或上下文，将它作为 close 阶段输入
