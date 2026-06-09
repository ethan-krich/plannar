---
"plannar": minor
---

Added `plannar inspect` command to check the editor for Vite compilation errors via HTTP. Takes a required `--port` arg, optional `--host` and `--plan` (plan slug). Reported errors are those that block the editor from loading. Exits with code 1 if errors found.
