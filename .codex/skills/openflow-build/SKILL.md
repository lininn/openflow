---
name: openflow-build
description: "OpenFlow build: Execute implementation. Visibility alias for openflow build."
argument-hint: "[optional context]"
---

# openflow-build

这是 `openflow build` 的补全可见别名。

执行时必须按以下方式处理：

1. 将本次调用视为用户调用了 `/openflow build $ARGUMENTS`
2. 读取同级 skills 目录中的 `openflow/SKILL.md`
3. 读取 `openflow/build.md`
4. 严格遵守主 openflow 工作流、阶段写入边界和当前阶段文件
5. 如果 `$ARGUMENTS` 中有额外需求或上下文，将它作为 build 阶段输入
