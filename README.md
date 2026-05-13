# @lininn/openflow

[中文文档](./README.zh-CN.md)

OpenSpec + Superpowers workflow orchestrator — bridging requirements specs and engineering execution, eliminating the format gap.

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

`init` will automatically:
1. Detect and guide OpenSpec CLI installation
2. Detect Superpowers and show install instructions
3. Check if OpenSpec is initialized in the project
4. Generate openflow skills to `.claude/skills/openflow/`

Supported tools: `claude`, `codex`, `cursor` (comma-separated, e.g. `--tools claude,codex`)

### Check status

```bash
openflow status
```

Shows dependency installation status and active changes in the project.

### Update skills

```bash
openflow update
```

Re-generates project skills after upgrading the npm package.

## Workflow Commands

| Command | Phase | Description |
|---------|-------|-------------|
| `/openflow proposal` | proposal | Lightweight capture — 3-5 questions to converge on requirements |
| `/openflow brainstorming` | brainstorming | Deep design — multi-round tradeoff exploration |
| `/openflow spec` | spec | Call OpenSpec to generate specs + auto-translate to plan-ready.md |
| `/openflow build` | build | Call Superpowers to execute implementation |
| `/openflow close` | close | Verify consistency + archive |

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
| **Init time** | Detect OpenSpec → auto-install; Detect Superpowers → show install hint | Non-blocking, skills still generated |
| **Runtime** | Dependency check injected into SKILL.md | Build phase falls back to manual step-by-step execution |

## Architecture

```
User Requirements
   │
   ├── Quick ──→ /openflow proposal ──┐
   │           3-5 questions          │
   │                                  ├─→ proposal.md
   └── Deep ───→ /openflow brainstorming ─┘ (openspec/changes/<name>/)
               Multi-round exploration
                                     │
                          ┌──────────▼───────────┐
                          │  /openflow spec        │
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
                          ┌──────────▼───────────┐
                          │  /openflow build       │
                          │  Superpowers execution │
                          │  TDD + checkpoint      │
                          └──────────┬───────────┘
                                     │
                          ┌──────────▼───────────┐
                          │  /openflow close       │
                          │  Verify + archive      │
                          └──────────────────────┘
```

## License

MIT
