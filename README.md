# @lininn/openflow

OpenSpec + Superpowers 工作流协调器，串联需求规格与工程执行，消除格式鸿沟。

## 安装

```bash
npm install -g @lininn/openflow
```

## 使用

### 初始化项目

```bash
cd your-project
openflow init --tools claude
```

`init` 会自动：
1. 检测并引导安装 OpenSpec CLI
2. 检测 Superpowers 并提示安装方式
3. 检测项目 OpenSpec 初始化状态
4. 生成 openflow skills 到项目 `.claude/skills/openflow/`

支持的工具：`claude`、`codex`、`cursor`（逗号分隔，如 `--tools claude,codex`）

### 查看状态

```bash
openflow status
```

显示依赖安装状态和项目中的活跃变更。

### 更新 skills

```bash
openflow update
```

升级 npm 包后运行，重新生成项目内的 skills 文件。

## 工作流命令

| 命令 | 阶段 | 说明 |
|------|------|------|
| `/openflow proposal` | proposal | 轻量提问，3-5 问快速收敛需求 |
| `/openflow brainstorming` | brainstorming | 深度设计，多轮方案探索 |
| `/openflow spec` | spec | 调用 OpenSpec 生成规格 + 自动翻译 |
| `/openflow build` | build | 调用 Superpowers 执行实现 |
| `/openflow close` | close | 验证一致性 + 归档 |

## 依赖策略

```
Best with: OpenSpec + Superpowers
Works without them: yes, with manual-file fallback
```

| 依赖 | 安装方式 | 缺失时降级 |
|------|----------|-----------|
| OpenSpec | `npm install -g @fission-ai/openspec@latest` | 手动创建 `openspec/changes/` 目录和文件 |
| Superpowers | `/plugin install superpowers@claude-plugins-official` | build 阶段手动拆解 plan-ready.md 步骤执行 |

## 架构

```
用户需求
   │
   ├── 轻量 ──→ /openflow proposal ──┐
   │          3-5问快速收敛          │
   │                                 ├─→ proposal.md
   └── 深度 ──→ /openflow brainstorming ─┘ (openspec/changes/<name>/)
               多轮方案探索
                                     │
                          ┌──────────▼───────────┐
                          │  /openflow spec        │
                          │  OpenSpec 生成规格      │
                          └──────────┬───────────┘
                                     │
                          ┌──────────▼───────────┐
                          │   翻译层 (核心)        │
                          │  需求视角 → 工程视角    │
                          └──────────┬───────────┘
                                     │
                                plan-ready.md
                                     │
                          ┌──────────▼───────────┐
                          │  /openflow build       │
                          │  Superpowers 执行      │
                          │  TDD 铁律 + 断点恢复   │
                          └──────────┬───────────┘
                                     │
                          ┌──────────▼───────────┐
                          │  /openflow close       │
                          │  验证一致性 + 归档      │
                          └──────────────────────┘
```

## License

MIT
