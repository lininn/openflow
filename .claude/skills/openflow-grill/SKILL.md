---
name: openflow-grill
description: "OpenFlow grill: Optional stress-test before spec. Visibility alias for openflow grill."
argument-hint: "[optional context]"
---

# openflow-grill

这是 `openflow grill` 的补全可见别名。

执行时必须按以下方式处理：

1. 将本次调用视为用户调用了 `/openflow grill $ARGUMENTS`
2. 读取同级 skills 目录中的 `openflow/SKILL.md`
3. 读取 `openflow/grill.md`
4. 严格遵守主 openflow 工作流、阶段写入边界和当前阶段文件
5. 如果 `$ARGUMENTS` 中有额外需求或上下文，将它作为 grill 阶段输入
