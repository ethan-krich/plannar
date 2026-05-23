---
name: plannar
description: Use when the user asks for a plan, design doc, proposal, or implementation breakdown. Plannar writes plans as MDX files in `.plannar/plans/` using shadcn/ui components (Tabs, Accordion, Cards) and interactive Playground previews so the output is skimmable and token-efficient instead of a wall of markdown. Covers the full workflow — explore the codebase, design with Plan agents, review, then author the MDX — plus shadcn component usage, Playground state bindings, and `.plannar` config.
---

# Plannar

Plannar plans are MDX files in `.plannar/plans/`. Use shadcn/ui components to make them skimmable instead of walls of text. The agent only ever edits files in `.plannar/plans/`.

## Creating a plan

### Phase 1 — Understand

Read the relevant code. Launch Explore agents **in parallel** sized to the uncertainty:

- **1 agent** (default): known files, targeted change, or user-provided paths.
- **2–3 agents max**: scope spans multiple subsystems, or you need to learn existing patterns before designing. Give each agent a distinct focus (e.g. one searches existing implementations, one explores related components, one investigates tests).

Then use the question tool to resolve real ambiguities up front. Quality over quantity.

### Phase 2 — Design

Launch a Plan agent to validate your understanding and consider alternatives. Skip only for true one-liners (typo, rename, single-line fix).

Use **multiple** Plan agents when the task touches several parts of the codebase, is a large refactor or architectural change, has many edge cases, or genuinely benefits from comparing approaches:

- New feature: simplicity vs performance vs maintainability
- Bug fix: root cause vs workaround vs prevention
- Refactor: minimal change vs clean architecture

In each agent prompt include: full Phase 1 context (file paths, code traces), requirements and constraints, and a request for a detailed implementation plan.

### Phase 3 — Review

Read the critical files the agents flagged to deepen your own understanding. Confirm the plans still match the user's intent. Use the question tool for anything material that's still unresolved.

### Phase 4 — Present

Write the final plan to `.plannar/plans/<kebab-case-name>.mdx`. **This is the only file you edit.**

## Writing the MDX

The point of MDX is layout. A plan that's all paragraphs has failed the format. Reach for:

- **Tabs** — compare approaches, separate "what" from "why", split frontend/backend.
- **Accordion** — long supporting detail most readers can skip.
- **Card** — summary blocks: goals, risks, affected files, checklist.
- **Playground** — interactive previews of UI being proposed.

Keep prose tight. Use lists. Put paths in `code`. Use `file.ts:42` for line references.

### Adding shadcn components

Shadcn/ui is set up in `.plannar`. Add components with the user's preferred package manager:

```sh
npx shadcn@latest add accordion
```

Full registry: https://ui.shadcn.com/r

### Playground

Use `<Playground>` to embed an interactive UI preview. Inside a Playground, the `bind` prop on any element auto-wires React state — no hooks needed.

**Syntax:**

- `bind="name"` → state starts as `undefined`
- `bind="name:value"` → explicit initial value (`count:0`, `text:'Hello'`)
- Each Playground is its own scope; duplicate bind names within one Playground error out; nested Playgrounds get independent scopes.

**Registered bindings** auto-wire value + change handlers:

| Element                                                                                | Type   | Datatype   |
| -------------------------------------------------------------------------------------- | ------ | ---------- |
| `<input>` / `<textarea>`                                                               | HTML   | `string`   |
| `<input type="checkbox">`                                                              | HTML   | `boolean`  |
| `<input type="number">`                                                                | HTML   | `number`   |
| `<select>`                                                                             | HTML   | `string`   |
| `Checkbox` / `Switch`                                                                  | shadcn | `boolean`  |
| `Slider`                                                                               | shadcn | `number[]` |
| `Select` / `Tabs` / `Accordion`                                                        | shadcn | `string`   |
| `Dialog` / `Sheet` / `Drawer` / `Popover` / `Tooltip` / `DropdownMenu` / `Collapsible` | shadcn | `boolean`  |

**Unregistered elements** (e.g. `<Button>`) still get the state variable plus a `setXxx` setter you wire manually:

```jsx
<Button bind="count:0" onClick={() => setCount(count + 1)}>
  Clicks: {count}
</Button>
```

Custom bindings can be registered by passing a `bindings` record to the plugin with entries specifying `valueProp`, `changeProp`, `extract`, and optional `inject`.

**Example — slider drives a preview:**

```jsx
<Playground>
  <Slider bind="radius:12" min={0} max={64} />
  <div style={{ borderRadius: `${radius}px` }} className="p-6 bg-blue-500 text-white text-center">
    {radius}px radius
  </div>
</Playground>
```

### Playground rules

- **Don't use shadcn components for the prototype itself.** If the plan proposes a card, write the card with HTML + Tailwind. Shadcn is for _controls_ around the prototype (slider for border radius, etc.).
- **Don't wire previews to real APIs.** A "current location" mock stays mocked.
- **Don't reuse `.plannar` shadcn components in the actual implementation** — those are plan-only.
- **Use Tailwind** for styling unless dynamic values force inline styles.

## Plannar CLI

### `plannar init`

Scaffolds `.plannar/`:

- `components.json` — shadcn/ui config (style `base-nova`, Tailwind v4)
- `config.json` — default project config
- `index.css` — shadcn theme with design tokens, also serves as style override entry point
- `package.json` — npm package (enables `npx shadcn add`)
- `tsconfig.json` — TypeScript config with `@/*` path alias
- `plans/hello-world.mdx` — sample plan demonstrating state binding

### `plannar editor`

Starts the plan editor dev server with HMR. Resolves project config and sets env vars for Vite. Accepts `--port` (default `5173`) and `--host` (default `localhost`). Deep-merges optional `viteConfig.editor` overrides from JS/TS config files.

### `plannar status`

Checks whether the editor is running and reports its port. Scans from the given port (default `5173`) across the next 10 ports, and verifies the server is the plannar editor (not a random Vite app) by checking for the `plannar-editor` meta tag. Respects `--port` / `--host` CLI args; also reads `viteConfig.editor.server` from JS/TS configs. Outputs the editor URL when found, or a "not running" message.

## Configuration

Plannar resolves config merged **local > global > defaults**. JS/TS configs load via `jiti`; JSON is parsed directly. Both sources are optional.

| Source | Path                                            |
| ------ | ----------------------------------------------- |
| Global | `~/.config/plannar/plannar.config.{js,ts,json}` |
| Local  | `./plannar.config.{js,ts,json}` (CWD)           |

### Fields

| Field           | Type      | Default                | Description                                                 |
| --------------- | --------- | ---------------------- | ----------------------------------------------------------- |
| `plannarFolder` | `string`  | `".plannar"`           | Root folder for plans, components, and config               |
| `exportsFolder` | `string`  | `".plannar/exports"`   | Output directory for exported HTML                          |
| `globalCss`     | `string?` | `".plannar/index.css"` | CSS that overrides builtin styles                           |
| `cssFilePath`   | `string?` | _none_                 | Additional CSS loaded alongside `globalCss`                 |
| `viteConfig`    | `object?` | _none_                 | Deep-merged Vite overrides: `{ editor?: {}, exports?: {} }` |

`exportsFolder` and `globalCss` derive from `plannarFolder` unless set explicitly. If `plannarFolder` is `.my-plans`, `globalCss` becomes `.my-plans/index.css`. An explicit `globalCss` is preserved regardless.

Run `plannar init` to scaffold `.plannar/` with `components.json`, `config.json`, `index.css`, `package.json`, `tsconfig.json`, and `plans/hello-world.mdx`.

### CSS overrides

Builtin styles come from `theme.css` (shadcn tokens, fonts, reset, dark mode) and `mdx.css` (headings, code blocks, tables — scoped under `.mdx-content` with `:where()` for zero specificity). Your CSS loads **after** both:

1. Builtin `mdx.css` → Builtin `theme.css` → Your `globalCss` → Your `cssFilePath`

`globalCss` is for overriding builtins (has a default, scaffolded by `init`). `cssFilePath` is supplemental (no default, must be explicit).

Override theme tokens on `:root` / `.dark`:

```css
:root {
  --primary: oklch(0.55 0.2 250);
  --radius: 0.5rem;
}
.dark {
  --background: oklch(0.15 0.02 250);
}
```

Override MDX content via `.mdx-content`:

```css
.mdx-content h1 {
  font-size: 2.5rem;
}
.mdx-content a {
  color: var(--primary);
  text-decoration: underline;
}
```

In the editor, CSS loads via `virtual:plannar-global-css` (a Vite virtual module). In exports, files are copied to a temp directory and `@import`-ed in the generated `index.css`. Both paths produce the same load order.
