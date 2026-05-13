---
name: openflow/close
description: Verify implementation consistency and archive
---

# Close: 验证归档

## 目标

验证代码实现与设计文档一致，确认规格变更全部体现，然后归档。

## 前置条件

- `docs/superpowers/plans/` 下的实现计划全部 checkbox 已勾选
- `openspec/changes/<变更名>/plan-ready.md` 存在

## 流程

### 1. 确认实现状态

检查 `docs/superpowers/plans/` 下对应的计划文件，确认所有 checkbox 已勾选。

如果有未完成的 task：
> "还有 N 个任务未完成。请先用 /openflow build 完成实现。"

### 2. 验证设计一致性

读取 `openspec/changes/<变更名>/design.md`，逐项检查代码实现：

- design.md 中的技术决策是否在代码中体现？
- 标记的架构选择是否与代码结构一致？

对每一项，给出判定：✅ 一致 / ❌ 不一致（附具体差异）

### 3. 验证规格完整性

读取 `openspec/changes/<变更名>/specs/` 目录，检查每个规格变更：

- 标记为"新增"的功能是否已实现？
- 标记为"修改"的行为是否已更新？
- 标记为"删除"的旧逻辑是否已移除？

对每一项，给出判定：✅ 已体现 / ❌ 未体现（附具体缺失）

### 4. 处理不一致

如果发现不一致：
- **不在 close 阶段改代码**
- 将不一致项记录到 `openspec/changes/<变更名>/close-issues.md`
- 提示用户：
  > "发现 N 处不一致，已记录到 close-issues.md。是否需要开启新的变更来修复？"

### 5. 归档

全部一致（或用户接受不一致项）后，执行归档：

```bash
openspec archive <变更名>
```

如果 OpenSpec CLI 不可用，手动归档：

```bash
mkdir -p openspec/changes/archive
mv openspec/changes/<变更名> openspec/changes/archive/$(date +%Y-%m-%d)-<变更名>/
```

归档后确认：
- 规格增量已合并到主规格库（如适用）
- 变更记录已移到 archive 目录

### 6. 完成提示

> "变更 '<变更名>' 已验证并归档。可以开始下一个变更了。"

## 关键原则

- close 阶段不做代码修改，只做验证和归档
- 不一致先记录，不现场修复
- 防止边写代码边改需求的恶性循环
