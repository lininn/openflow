# Graphify：给 AI 编码助手装上「项目导航仪」

> 一行命令，让 Claude Code 秒懂你的整个代码库

## 痛点：AI 助手在大项目中也会「迷路」

你有没有遇到过这种情况——

用 Claude Code 问一个架构问题，它上来就 `grep` 全库、逐文件读取，Token 烧得飞起，最后还是答非所问。

根本原因：AI 助手缺少对项目的**全局结构认知**。它看到的只是一个个孤立的文件，而非有机联系的代码社区。

**Graphify** 就是来解决这个问题的。

## 什么是 Graphify？

Graphify 是一个开源（MIT）AI 编码助手 skill，由 Safi Shamsi 开发，灵感来自 Andrej Karpathy 提出的「LLM Wiki」理念。

核心功能：**把你的代码库编译成一张可查询的知识图谱**，让 AI 助手以图谱遍历替代原始文件搜索。

- GitHub：[safishamsi/graphify](https://github.com/safishamsi/graphify)（40k+ Stars）
- 官网：[graphify.net](https://graphify.net/)
- Token 消耗降低最高 **71.5 倍**

## 核心原理：双轨提取

Graphify 采用「确定性 + 概率性」双轨策略：

| 轨道 | 技术 | 处理对象 | 特点 |
|------|------|----------|------|
| 确定性路径 | Tree-sitter AST 解析 | 代码文件（25+ 语言） | 本地运行，零 Token 消耗，置信度 1.0 |
| 概率性路径 | LLM 语义提取 | 非结构化数据（PDF、图片、视频等） | 理解语义关系，边标记为 INFERRED |

## 七级处理流水线

```
检测 → 提取 → 构建 → 聚类 → 分析 → 报告 → 导出
```

1. **检测**：识别文件类型，分类处理策略
2. **提取**：AST 解析代码结构 + LLM 提取非代码语义
3. **构建**：基于 NetworkX 构建知识图谱
4. **聚类**：Leiden 算法做社区检测，发现代码模块边界
5. **分析**：计算中心性、桥接节点等图指标
6. **报告**：生成 `GRAPH_REPORT.md`、Obsidian 兼容 wiki
7. **导出**：交互式 `graph.html` 可视化

## 实战安装：3 步搞定

### 第 1 步：安装 Python 包

```bash
# 推荐 uv
uv tool install graphifyy

# 或 pipx
pipx install graphifyy

# 或 pip
pip install graphifyy
```

> **注意**：PyPI 包名是 `graphifyy`（三个 y），不是 `graphify`。

### 第 2 步：注册到 AI 编码助手

```bash
# Claude Code（自动检测）
graphify install

# 其他平台
graphify install --platform codex
graphify install --platform opencode
graphify install --platform cursor
graphify install --platform gemini
```

### 第 3 步：构建知识图谱

**方式 A：在 AI 助手中使用 skill**

```
/graphify .              # 构建图谱
/graphify update .       # 增量更新
/graphify query "认证流程" # 语义查询
/graphify path "Auth" "DB" # 查找路径
```

**方式 B：命令行独立使用**

```bash
graphify .               # 构建图谱
graphify update .        # 增量更新（零 Token 成本）
graphify . --wiki        # 同时生成 wiki
```

### 关于 LLM 后端

Graphify 语义提取需要 LLM 后端，支持以下方式：

| 后端 | 环境变量 | 说明 |
|------|----------|------|
| claude-cli | 无需 API Key | 使用已安装的 Claude Code CLI（推荐！）|
| gemini | `GEMINI_API_KEY` | Google Gemini |
| openai | `OPENAI_API_KEY` | OpenAI GPT |
| deepseek | `DEEPSEEK_API_KEY` | DeepSeek |
| ollama | 本地运行 | 本地 Ollama |

**最佳实践**：如果你已经安装了 Claude Code，直接用 `--backend=claude-cli`：

```bash
graphify . --backend=claude-cli
```

零额外配置，零额外费用！

## 输出产物

构建完成后，`graphify-out/` 目录包含：

| 文件 | 说明 |
|------|------|
| `graph.json` | 知识图谱核心数据（机器可读） |
| `GRAPH_REPORT.md` | 人类可读的图谱报告 |
| `wiki/index.md` | Obsidian 兼容 wiki 索引 |
| `graph.html` | 交互式图谱可视化（浏览器打开） |

### GRAPH_REPORT.md 示例

```
## Summary
- 124 nodes · 195 edges · 9 communities
- Extraction: 99% EXTRACTED · 1% INFERRED
- Token cost: 0 input · 0 output (纯代码项目)

## God Nodes (最核心的抽象)
1. compilerOptions - 11 edges
2. Spec Phase - 9 edges
3. generateSkills() - 8 edges

## Surprising Connections (你可能不知道的关联)
- Skill Generator → SKILL.md Template [INFERRED]
- refactor Proposal → CLI Entry Point [EXTRACTED]
```

## 实战效果

以 openflow 项目为例（15 个代码文件 + 59 个文档）：

```
$ graphify . --backend=claude-cli

[graphify extract] scanning /Users/lininn/work/openflow
[graphify extract] found 15 code, 59 docs, 0 papers, 2 images
[graphify extract] AST extraction on 15 code files...
[graphify extract] semantic extraction on 61 files via claude-cli...
[graphify extract] chunk 1/1 done
[graphify] Deduplicated 5 node(s) (1 exact, 4 fuzzy).
[graphify extract] wrote graphify-out/graph.json: 124 nodes, 195 edges, 9 communities
[graphify extract] tokens: 83,530 in / 5,543 out, est. cost: $0.0000
```

9 个社区被自动发现：
- Package Configuration & Dependencies
- Dependency Check & Tool Init
- OpenFlow Workflow Phases
- Skill Generation & Templates
- TypeScript Build Config
- CLI Command Registration
- Core Modules & Entry Points
- OpenFlow State Schema
- Project State Schema

查询示例：

```bash
$ graphify query "OpenFlow workflow phases"

Traversal: BFS depth=2 | Start: ['PHASES', 'openflow'] | 27 nodes found
# 直接返回相关节点和边，无需重新读取原始文件
```

## 典型使用场景

1. **大型代码库理解**：新加入项目，先建图谱再问问题
2. **跨模块影响分析**：`graphify path "A" "B"` 看依赖链
3. **Code Review**：先读 `GRAPH_REPORT.md` 了解全局结构
4. **企业遗留系统**：存量代码图谱化，给 AI 注入结构化理解
5. **团队共享**：将 `graphify-out/` 提交到 git，团队无需重新扫描

## 增量更新：代码变了不用重建

```bash
# 只更新变化的代码文件，零 Token 成本
graphify update .

# 强制重建（大规模重构后）
graphify update . --force
```

## 与 code-review-graph 的互补

| 维度 | Graphify | code-review-graph |
|------|----------|-------------------|
| 核心 | 多模态知识图谱 + 社区检测 | SQLite AST 图 + blast radius |
| 适用 | 全局架构理解、语义查询 | 代码审查、变更影响分析 |
| 存储 | JSON + Markdown + HTML | SQLite |
| LLM | 非代码文件需 LLM | 无（纯 Tree-sitter）|

两者互补使用效果最佳。

## 常见问题

**Q：需要联网吗？**
A：纯代码项目完全离线。非代码文件（PDF、图片等）的语义提取需要 LLM。

**Q：支持哪些语言？**
A：Tree-sitter 支持 25+ 语言：Python、TypeScript、JavaScript、Go、Rust、Java、C/C++、Ruby、C#、Kotlin、Scala、PHP 等。

**Q：需要 Neo4j 吗？**
A：不需要。全部本地运行，基于 NetworkX + JSON。

**Q：/graphify 是在终端还是 AI 助手里执行？**
A：`/graphify` 在 AI 助手对话框里输入。终端请用 `graphify` 或 `python -m graphify`。

## 总结

Graphify 的核心价值：

1. **一次构建，多次查询**——把昂贵的代码分析做在前面
2. **Token 省 71 倍**——图谱遍历 vs 原始文件搜索
3. **零额外成本**——Claude Code 用户直接用 `--backend=claude-cli`
4. **增量更新**——代码变了不用重建
5. **全本地**——数据不出本机，不需要数据库服务器

一行命令，让你的 AI 编码助手从「逐文件搜索」进化为「图谱驱动的结构化导航」。

---

*Graphify v0.8.27 | MIT License | [GitHub](https://github.com/safishamsi/graphify) | [官网](https://graphify.net/)*
