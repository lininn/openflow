## Context

@lininn/openflow 是一个跨工具工作流编排 CLI，目前 9 个源文件 + 7 个模板文件。随着功能增长，早期的快速实现导致了一些架构债务。

## Goals

- 消除高危架构缺陷（版本漂移、shell 注入风险、零测试覆盖）
- 降低模板维护双重负担
- 建立自动化质量保障基线

## Non-Goals

- 不改变 CLI 对外行为
- 不重写整体架构
- 不改动工作流阶段定义

## Decisions

### Decision 1: 版本取自 package.json，而非 CLI 硬编码

**方案**: 在 `src/cli/index.ts` 中动态 import `package.json` 的 version 字段

**替代方案**: 保留硬编码但加 CI 检查。否决，因为动态读取是业界标准做法（tsdx、vite 等均采用），且 CI 检查容易被 bypass。

### Decision 2: 文件系统操作改用 fs 模块

**方案**: `fileExists` → `fs.existsSync()`，`dirExists` → `fs.existsSync()` + `fs.lstatSync().isDirectory()`, `cmdExists` → 无 shell 依赖

**替代方案**: 继续用 shell 但加转义。否决，因为 fs 调用更快、更安全、跨平台一致。

### Decision 3: 测试框架用 vitest

**方案**: vitest（零配置 TypeScript 支持，与现有 tsc 构建不冲突）

**替代方案**: jest（需要 ts-jest/babel 配置）。vitest 更轻量且与现有工具链兼容。

### Decision 4: 模板只从文件系统读取

**方案**: 完全移除 `getInlineTemplate()` 中的 SKILL.md 硬编码，改为在模板文件缺失时报错

**替代方案**: 保持双重维护。否决，已经证明容易不一致且没有人记得同时更新两处。

## Risks / Trade-offs

- 移除 inline fallback 后，如果 templates/ 目录在打包时丢失（npm publish 配置有误），生成会失败。但当前 `package.json` 已包含 `templates/` 在 `files` 字段中，风险可控。
- 引入 vitest 会增加约 15MB devDependencies，但不会影响运行时。

## Migration Plan

1. 逐一修复 P1 问题（版本号 → shell → cmdExists），每项独立验证
2. 引入 vitest + 为 shell.ts 写测试
3. 处理 P2 模板去重
4. P3 长期优化作为收尾
