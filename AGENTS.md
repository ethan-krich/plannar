# Plannar

Plannar helps agents write plans users want to read while being token-efficient. The `core` package renders these plans as MDX; the `editor` app is the preview environment.

> **Note for agents:** if anything in this file is wrong or out of date as you work, fix it and flag the change to the user for approval.
>
> The same applies to `skills/plannar/SKILL.md` — it documents the plannar skill's workflow, MDX authoring rules, Playground bindings, CLI commands, and config. Whenever you change code that affects any of those (new/renamed CLI command or flag, new config field, changed bind syntax or registered binding table, new `<Playground>` capability, altered plan-file conventions), update `SKILL.md` in the same change and flag it for the user. The skill drifts fast otherwise.

The same also applies to `apps/site/content/docs/` — the documentation site for Plannar. Whenever you change code that affects what the docs cover (new/renamed CLI commands or flags, new config fields, changed bind syntax, new components, altered workflows), update the corresponding docs pages and flag it for the user.

## Project structure

Monorepo with packages and apps.

**packages/**

- `core` — Renders MDX plans. Owns the custom `remarkStateBind` plugin which provides automatic state binding via a `bind` prop. Ships document styles so consumers don't restyle.

- `export` — Generates self-contained HTML from plans. Exports `exportPlan()` with `ExportOptions`.
- `plannar` — CLI package. Handles config loading, `init`/`editor`/`export` commands.

**apps/**

- `editor` — Live preview for `core`. Compiles MDX to a JS string and renders it.

### Common entry points

- Adding or modifying remark plugins → `packages/core/src/plugins/`
- Document styling → `packages/core/src/styles/`
- How MDX is compiled in preview → `apps/editor/src/`
- Config schema and resolution → `packages/plannar/src/config.ts`

## Tooling

This project uses **Vite+** (`vp` CLI) — a toolchain wrapping Vite, Rolldown, Vitest, tsdown, Oxlint, Oxfmt, and Vite Task. Run `vp help` for commands and `vp <cmd> --help` for specifics. Docs: `node_modules/vite-plus/docs` or https://viteplus.dev/guide/. Vite+ ≠ Vite — invoke Vite via `vp dev` / `vp build`.

## Conventions

- `function` keyword for React components; arrow functions for everything else
- Prefer `type` over `interface`
- **Tailwind v4** for all styling — config lives in `@theme` inside the global CSS file. There is no `tailwind.config.js`; do not create one.
- Tests live **per package**, colocated as `*.test.ts(x)` next to the source they cover
- Always add tests for new package functionality

## Don't

- Add dependencies without asking
- Disable lint or type rules to make `vp check` pass — fix the underlying issue
- Hand-edit anything under `node_modules/`
- Restyle documents at the app layer; styling belongs in `core`

## Config system

Plannar resolves configuration from two sources (merged with local > global > defaults):

| Source | Path                                            |
| ------ | ----------------------------------------------- |
| Global | `~/.config/plannar/plannar.config.{js,ts,json}` |
| Local  | `./plannar.config.{js,ts,json}` (CWD)           |

Config fields (`PlannarConfig` type in `packages/plannar/src/config.ts`):

- `plannarFolder` — default `".plannar"`
- `exportsFolder` — default `".plannar/exports"` (resolved from `plannarFolder`)
- `globalCss` — path to CSS file overriding builtin styles, default `".plannar/index.css"`
- `cssFilePath` — additional CSS file to load alongside
- `viteConfig` — `{ editor?, exports? }` overrides deep-merged into Vite configs (JS/TS configs only)

JS/TS configs are loaded with `jiti`. JSON configs are parsed directly.

### How config flows

1. CLI commands (`editor`, `export`) call `resolveConfig(cwd)` from `packages/plannar/src/config.ts`
2. Editor: config values are set as env vars (`PLANNAR_FOLDER`, `PLANNAR_GLOBAL_CSS`, etc.) consumed by Vite configs
3. Export: config is passed as `ExportOptions` to `exportPlan()`
4. `viteConfig.editor` / `viteConfig.exports` are deep-merged into the respective Vite configurations
5. CSS overrides: a `virtual:plannar-global-css` Vite plugin resolves to the user's CSS file, loading it after builtin styles so it takes priority

## Version control

- Conventional commits (`feat:`, `fix:`, `chore:`, `refactor:`, `docs:`, `test:`)
- Commit each logical change locally
- **Push only when the user asks**, or batch pushes at end of session. Never push directly to `main`.

## Review checklist (before declaring a task done)

- [ ] `vp install` after pulling
- [ ] `vp check` — format, lint, type check
- [ ] `vp test` — all packages pass
- [ ] Look for `vite.config.ts` tasks or `package.json` scripts that should also run via `vp run <script>`
- [ ] UI changes verified with the Playwright MCP
- [ ] If you learned something an agent should know, update this file and tell the user
