# Graph Report - /Users/lininn/work/openflow  (2026-06-01)

## Corpus Check
- cluster-only mode — file stats not available

## Summary
- 124 nodes · 195 edges · 9 communities
- Extraction: 99% EXTRACTED · 1% INFERRED · 0% AMBIGUOUS · INFERRED: 2 edges (avg confidence: 0.8)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `d0a32ba2`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- [[_COMMUNITY_Package Configuration & Dependencies|Package Configuration & Dependencies]]
- [[_COMMUNITY_Dependency Check & Tool Init|Dependency Check & Tool Init]]
- [[_COMMUNITY_OpenFlow Workflow Phases|OpenFlow Workflow Phases]]
- [[_COMMUNITY_Skill Generation & Templates|Skill Generation & Templates]]
- [[_COMMUNITY_TypeScript Build Config|TypeScript Build Config]]
- [[_COMMUNITY_CLI Command Registration|CLI Command Registration]]
- [[_COMMUNITY_Core Modules & Entry Points|Core Modules & Entry Points]]
- [[_COMMUNITY_OpenFlow State Schema|OpenFlow State Schema]]
- [[_COMMUNITY_Project State Schema|Project State Schema]]

## God Nodes (most connected - your core abstractions)
1. `compilerOptions` - 11 edges
2. `Spec Phase` - 9 edges
3. `generateSkills()` - 8 edges
4. `checkDependencies()` - 7 edges
5. `logger` - 6 edges
6. `dirExists()` - 6 edges
7. `Build Phase` - 6 edges
8. `State Detection & Routing` - 6 edges
9. `scripts` - 5 edges
10. `checkOpenSpecInitialized()` - 5 edges

## Surprising Connections (you probably didn't know these)
- `Skill Generator Module` --references--> `templates/SKILL.md Template`  [INFERRED]
  src/core/skill-generator.ts → templates/SKILL.md
- `refactor-arch-optimize Proposal` --references--> `CLI Entry Point`  [EXTRACTED]
  openspec/changes/refactor-arch-optimize/proposal.md → src/cli/index.ts
- `refactor-arch-optimize Proposal` --references--> `shell.ts Utility Module`  [EXTRACTED]
  openspec/changes/refactor-arch-optimize/proposal.md → src/utils/shell.ts
- `refactor-arch-optimize Proposal` --references--> `Skill Generator Module`  [EXTRACTED]
  openspec/changes/refactor-arch-optimize/proposal.md → src/core/skill-generator.ts
- `refactor-arch-optimize Spec Delta` --references--> `CLI Entry Point`  [EXTRACTED]
  openspec/changes/refactor-arch-optimize/specs/project/spec.md → src/cli/index.ts

## Import Cycles
- None detected.

## Communities (9 total, 0 thin omitted)

### Community 0 - "Package Configuration & Dependencies"
Cohesion: 0.07
Nodes (28): author, bin, openflow, dependencies, chalk, commander, inquirer, ora (+20 more)

### Community 1 - "Dependency Check & Tool Init"
Cohesion: 0.22
Nodes (17): SUPPORTED_TOOLS, DEPS, TOOL_PATHS, checkDependencies(), CheckDependencyOptions, checkOpenSpecInitialized(), getStateFileCandidates(), getSuperpowersSkillPaths() (+9 more)

### Community 2 - "OpenFlow Workflow Phases"
Cohesion: 0.23
Nodes (15): Amend Phase, Brainstorming Phase, Build Phase, Close Phase, design.md Document, OpenFlow Orchestrator, plan-ready.md Translation Layer, Proposal Phase (+7 more)

### Community 3 - "Skill Generation & Templates"
Cohesion: 0.21
Nodes (13): DepStatus, __dirname, __filename, GenerateOptions, generatePhaseAliasSkills(), generateSkills(), getInlineTemplate(), getPhaseAliasTemplate() (+5 more)

### Community 4 - "TypeScript Build Config"
Cohesion: 0.14
Nodes (13): compilerOptions, declaration, esModuleInterop, module, moduleResolution, outDir, rootDir, skipLibCheck (+5 more)

### Community 5 - "CLI Command Registration"
Cohesion: 0.25
Nodes (6): pkg, require, run(), initCommand, statusCommand, updateCommand

### Community 6 - "Core Modules & Entry Points"
Cohesion: 0.48
Nodes (7): CLI Entry Point, refactor-arch-optimize Proposal, refactor-arch-optimize Spec Delta, shell.ts Utility Module, Skill Generator Module, SKILL.md (openflow main skill), templates/SKILL.md Template

### Community 7 - "OpenFlow State Schema"
Cohesion: 0.33
Nodes (5): createdAt, openspec, openspecProjectInitialized, superpowers, tools

### Community 8 - "Project State Schema"
Cohesion: 0.33
Nodes (5): createdAt, openspec, openspecProjectInitialized, superpowers, tools

## Knowledge Gaps
- **57 isolated node(s):** `openspec`, `superpowers`, `openspecProjectInitialized`, `createdAt`, `tools` (+52 more)
  These have ≤1 connection - possible missing edges or undocumented components.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **What connects `openspec`, `superpowers`, `openspecProjectInitialized` to the rest of the system?**
  _57 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Package Configuration & Dependencies` be split into smaller, more focused modules?**
  _Cohesion score 0.06896551724137931 - nodes in this community are weakly interconnected._
- **Should `TypeScript Build Config` be split into smaller, more focused modules?**
  _Cohesion score 0.14285714285714285 - nodes in this community are weakly interconnected._