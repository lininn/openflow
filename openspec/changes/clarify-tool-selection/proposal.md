## Why
`openflow init` defaults to Claude but reports Superpowers as missing without saying which tool it checked. `openflow update` reuses the saved tool list and gives users no way to correct it.

## What Changes
- Show the selected tools during `init` and `update`.
- Scope Superpowers warnings and install guidance to the selected tools.
- Add `openflow update --tools <tools>` and save the override for later updates.
- Reject empty or unsupported tool lists.
- Generate tool-specific Superpowers checks in build skills.

## Impact
- Affected specs: project
- Affected code: `src/cli/init.ts`, `src/cli/update.ts`, dependency guidance, tests, and command documentation
