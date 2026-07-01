# @lininn/openflow

[中文文档](./README.zh-CN.md)

OpenSpec + Superpowers workflow orchestrator for agentic development.

OpenFlow gives AI coding tools one spec-driven path from project context to requirements, implementation, verification, and archive. It initializes reusable skills for Claude Code, Codex, Cursor, and OpenCode; keeps OpenSpec change state visible; and translates requirements artifacts into executable Superpowers handoffs.

## Installation

```bash
npm install -g @lininn/openflow
```

## Usage

### Initialize a project

```bash
cd your-project
openflow init --tools claude
```

CLI `init` will automatically:
1. Detect and guide OpenSpec CLI installation
2. Detect Superpowers and show install instructions
3. Check if OpenSpec is initialized in the project
4. Create or refine the OpenSpec project context scaffold in `openspec/config.yaml`
5. Generate openflow skills to the selected tools' local skill directories, such as `.claude/skills/openflow/`, `.codex/skills/openflow/`, `.cursor/skills/openflow/`, or `.opencode/commands/openflow/`

Supported tools: `claude`, `codex`, `cursor`, `opencode` (comma-separated, e.g. `--tools claude,codex`)

### Install skills globally

```bash
openflow init --tools claude -g
openflow init --tools claude,codex,cursor,opencode --global
```

With `-g` / `--global`, `openflow` installs skills under the selected tools' home directories:

| Tool | Global skill path |
|------|-------------------|
| `claude` | `~/.claude/skills/openflow/` |
| `codex` | `~/.codex/skills/openflow/` |
| `cursor` | `~/.cursor/skills/openflow/` |
| `opencode` | `~/.opencode/commands/openflow/` |

Global install only writes reusable skills. Project context is still initialized per repository with local `openflow init` or through the AI workflow command `/openflow init`.

### Check status

```bash
openflow status
```

Shows dependency installation status and active changes in the project.

Status now renders an OpenFlow dashboard for each active OpenSpec change:

- current phase and capture mode
- source of truth, either `workflow-status.md` or inferred from files
- phase gates such as requirements captured, specs validated, plan ready, implementation complete, verification complete, and archived
- task counts, blockers, conflicts, and the recommended next command

### Update skills

```bash
openflow update
```

Re-generates project skills after upgrading the npm package.

## Workflow Commands

Canonical usage is `/openflow <phase>`. For Claude Code, Codex, and Cursor,
`openflow` also generates visible phase aliases such as `/openflow-spec` or
`$openflow-spec` so typing `openflow` in the command/skill picker surfaces the
available phases. OpenCode keeps its native command-tree form under
`/openflow/spec`, `/openflow/build`, and so on.

| Command | Phase | Description |
|---------|-------|-------------|
| `/openflow init` | init | Capture project introduction, rules, and implementation constraints |
| `/openflow proposal` | proposal | Lightweight capture — 3-5 questions to converge on requirements |
| `/openflow brainstorming` | brainstorming | Deep design — multi-round tradeoff exploration |
| `/openflow grill` | grill | Optional stress-test — challenge proposal assumptions before spec |
| `/openflow spec` | spec | Call OpenSpec to generate specs + auto-translate to plan-ready.md |
| `/openflow amend` | amend | Revise requirements/specs before close and update plan-ready.md |
| `/openflow build` | build | Call Superpowers to execute implementation |
| `/openflow close` | close | Verify consistency + archive |

`/openflow init` is the project-context phase. It scans the repository, captures the project's purpose, coding rules, architectural boundaries, and implementation constraints, then writes them to `openspec/config.yaml` so future proposal, spec, and build work has project-specific guidance.

`/openflow grill` is optional: skip it when the proposal is already clear, or use it to challenge hidden assumptions before committing to specs. The spec phase treats `plan-ready.md` as a detailed Superpowers handoff, not a task summary: it must preserve source coverage, file responsibilities, implementation slices, TDD expectations, validation commands, and blockers.

Each workflow phase maintains `openspec/changes/<change-id>/workflow-status.md`. Bare `/openflow` and phase commands read that status first, fall back to file-based inference when it is missing, and warn when status claims conflict with actual artifacts.

## Dependency Strategy

```
Best with: OpenSpec + Superpowers
Works without them: yes, with manual-file fallback
```

| Dependency | Install | Fallback when missing |
|------------|---------|----------------------|
| OpenSpec | `npm install -g @fission-ai/openspec@latest` | Manually create `openspec/changes/` directories and files |
| Superpowers | `/plugin install superpowers@claude-plugins-official` | Manually break down plan-ready.md steps in build phase |

### Dual-layer dependency check

| Layer | Mechanism | When missing |
|-------|-----------|-------------|
| **Init time** | Detect OpenSpec CLI from `PATH`; detect project OpenSpec in `./openspec/`; scaffold `openspec/config.yaml`; detect Superpowers in the selected tools' local/global skill dirs | Non-blocking, skills still generated |
| **Runtime** | Dependency check injected into SKILL.md | Build phase falls back to manual step-by-step execution |

## Architecture

> Detailed diagrams: [Architecture (SVG)](./openflow-architecture.svg) | [Architecture (PNG)](./openflow-architecture.png) | [Workflow (SVG)](./openflow-workflow.svg) | [Workflow (PNG)](./openflow-workflow.png)

![OpenFlow workflow](./openflow-workflow.svg)

```
User Requirements
   │
   ├── Project context ──→ /openflow init ──→ openspec/config.yaml
   │
   ├── Quick ──→ /openflow proposal ──┐
   │           3-5 questions          │
   │                                  ├─→ proposal.md
   └── Deep ───→ /openflow brainstorming ─┘ (openspec/changes/<name>/)
               Multi-round exploration
                                     │
                          ┌──────────▼───────────┐
                          │  /openflow grill      │
                          │  Optional stress-test │
                          └──────────┬───────────┘
                                     │
                          ┌──────────▼───────────┐
                          │  /openflow spec         │
                          │  OpenSpec generates     │
                          └──────────┬───────────┘
                                     │
                          ┌──────────▼───────────┐
                          │   Translation Layer    │
                          │  Requirements → Eng    │
                          └──────────┬───────────┘
                                     │
                                plan-ready.md
                                     │
                             workflow-status.md
                        phase gates, tasks, blockers
                                     │
                          ┌──────────▼───────────┐
                          │  /openflow build       │
                          │  Superpowers execution │
                          │  TDD + checkpoint      │
                          └──────────┬───────────┘
                                     │
                          ┌──────────▼───────────┐
                          │  /openflow amend       │
                          │  Requirement revision  │
                          │  (only when needed)    │
                          └──────────┬───────────┘
                                     │
                          ┌──────────▼───────────┐
                          │  /openflow close       │
                          │  Verify + archive      │
                          └──────────────────────┘
```

## Sponsored by

🚀 **[GLM-5.2 — Free to use!](https://maas.xfyun.cn/packageSubscription?inviteCode=MAAS-E4248A94)** — Experience the latest GLM-5.2 model on iFlytek MaaS platform. Click to start using it now.

## Acknowledgments

openflow orchestrates two open-source projects:

| Project | Repository | License | Usage |
|---------|-----------|---------|-------|
| [OpenSpec](https://github.com/Fission-AI/OpenSpec) | `@fission-ai/openspec` | MIT | Generates structured spec files (proposal.md, design.md, specs/, tasks.md). openflow calls its CLI and reads its output format. |
| [Superpowers](https://github.com/obra/superpowers) | `superpowers` plugin | MIT | Provides `writing-plans` skill for detailed implementation planning. openflow delegates build-phase execution to its workflow. |

openflow is a **standalone orchestrator** — it does not bundle, fork, or embed code from either project. Dependencies are detected at init/runtime, with manual fallback when either is not installed.

## License

MIT
