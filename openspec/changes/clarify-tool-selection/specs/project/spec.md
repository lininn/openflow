## ADDED Requirements
### Requirement: Tool Selection Is Visible And Correctable
The CLI SHALL make dependency checks use an explicit, visible tool selection and SHALL allow a saved project selection to be corrected.

#### Scenario: Init checks selected tools
- **WHEN** a user runs `openflow init` with a tool selection
- **THEN** the CLI SHALL show the selected tools
- **AND** any Superpowers warning and install guidance SHALL name or target those tools.

#### Scenario: Update uses saved tools
- **WHEN** a user runs `openflow update` without a tool override
- **THEN** the CLI SHALL use the tools stored in `.openflow/state.json`
- **AND** it SHALL show the saved selection.

#### Scenario: Update corrects saved tools
- **WHEN** a user runs `openflow update --tools <tools>`
- **THEN** the CLI SHALL use the provided tools for dependency checks and skill generation
- **AND** it SHALL save the provided tools for later updates.

#### Scenario: Invalid tool selection is rejected
- **WHEN** a user provides an empty tool list or a tool that OpenFlow does not support
- **THEN** the CLI SHALL reject the selection before running dependency checks or saving state.

#### Scenario: A selected tool is missing Superpowers
- **WHEN** Superpowers is available for only some of the selected tools
- **THEN** the CLI SHALL report the tools where it is missing
- **AND** the generated build skill SHALL describe the Superpowers locations for its own target tool.
