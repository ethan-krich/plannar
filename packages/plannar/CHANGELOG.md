# plannar

## 1.1.0

### Minor Changes

- e2d5117: Added `plannar inspect` command to check the editor for Vite compilation errors via HTTP. Takes a required `--port` arg, optional `--host` and `--plan` (plan slug). Reported errors are those that block the editor from loading. Exits with code 1 if errors found.
- edfe035: Added `install-skills` command for installing plannar agent skills into `.agents` or `.claude` directories from the git remote.
- 384f7fc: `plannar status` now reports whether the running editor belongs to the current project or a different one by comparing the embedded `plannar-root` meta tag against the resolved plannar folder.

### Patch Changes

- 011d917: Refactored plannar SKILL.md into a lean workflow with separate reference files (mdx.md, jsx.md, cli.md, structure.md, config.md) for token efficiency.
- 2f87f40: Replace Vite startup output with a stylized ASCII art banner showing localhost and network IP URLs. Vite errors and warnings are suppressed and the terminal is cleared on startup.
