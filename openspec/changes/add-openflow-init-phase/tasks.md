## 1. Specification
- [x] 1.1 Add OpenSpec requirement for `/openflow init` phase behavior.
- [x] 1.2 Validate the change with `openspec validate add-openflow-init-phase --strict`.

## 2. Implementation
- [x] 2.1 Add `init` to generated OpenFlow phases and aliases.
- [x] 2.2 Add `templates/init.md` with interactive project context discovery, empty-project fallback, and write boundary rules.
- [x] 2.3 Update `templates/SKILL.md` routing, command list, phase boundaries, and optional missing-context prompt.
- [x] 2.4 Update proposal/bootstrap instructions so missing `openspec/config.yaml` asks whether to run `/openflow init` and allows skip.
- [x] 2.5 Update tests to cover generated init phase, init alias, and optional guard wording.

## 3. Verification
- [x] 3.1 Run focused template/generator tests.
- [x] 3.2 Run `openspec validate add-openflow-init-phase --strict`.
- [x] 3.3 Run `npm run check`.
