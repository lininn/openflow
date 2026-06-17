## ADDED Requirements
### Requirement: OpenFlow Init Phase
The generated OpenFlow workflow SHALL provide `/openflow init` as a project-context initialization phase for creating or refining `openspec/config.yaml`.

#### Scenario: User explicitly runs openflow init
- **WHEN** the user invokes `/openflow init` in a project
- **THEN** the workflow SHALL inspect existing project files when present
- **AND** it SHALL ask targeted questions about project purpose, tech stack, code style, test commands, architectural boundaries, compatibility requirements, and AI implementation rules
- **AND** it SHALL write or update `openspec/config.yaml` with concise `context:` and `rules:` entries
- **AND** it SHALL NOT modify implementation source files.

#### Scenario: Empty project initialization
- **WHEN** the user invokes `/openflow init` in a project with no meaningful source files
- **THEN** the workflow SHALL ask the user to choose or describe the intended technology stack and rules
- **AND** it SHALL offer industry-standard defaults for the selected stack
- **AND** it SHALL mark assumptions clearly in `openspec/config.yaml` so later proposal/spec/build phases do not treat guesses as discovered facts.

#### Scenario: Existing config refinement
- **WHEN** `openspec/config.yaml` already exists
- **THEN** `/openflow init` SHALL read the existing file before asking questions
- **AND** it SHALL preserve useful existing context and rules unless the user explicitly replaces them
- **AND** it SHALL refine stale, TODO, or incomplete sections.

### Requirement: Missing Context Is Optional
The generated OpenFlow workflow SHALL treat a missing `openspec/config.yaml` as an optional context setup prompt, not as a hard blocker for proposal or brainstorming.

#### Scenario: User chooses initialization from proposal
- **WHEN** the user invokes `/openflow proposal` and `openspec/config.yaml` is missing
- **THEN** the workflow SHALL explain that project context is not initialized
- **AND** it SHALL ask whether to run `/openflow init` first
- **AND** if the user agrees, it SHALL route to `/openflow init` before continuing proposal capture.

#### Scenario: User skips initialization
- **WHEN** the user invokes `/openflow proposal` and declines `/openflow init`
- **THEN** the workflow SHALL continue proposal capture
- **AND** it SHALL state that the current run has no project-specific `config.yaml` constraints
- **AND** it SHALL avoid inventing project-specific rules from generic best practices.
