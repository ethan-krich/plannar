# Plannar

> Plans your team will actually read.

Plannar turns agent-written plans into interactive MDX documents. Tabs instead of walls of text. Live previews instead of mockups.

[Docs](plannar.netlify.app/docs) · [Example](https://plannar.netlify.app/example)

## Quick start

```sh
npx plannar@latest init
plannar editor
```

Node.js 18+ required.

## What's in the box

| Package                      | Purpose                                             |
| ---------------------------- | --------------------------------------------------- |
| `@plannar/core`              | MDX compiler + state binding remark plugin + styles |
| `plannar` (CLI)              | `init` / `editor` / `status` / `export` commands    |
| `@plannar/export`            | Self-contained HTML export                          |
| `@plannar/registry-metadata` | Bind registrations for HTML + shadcn controls       |
| `@plannar/skills`            | Agent skills (Claude Code)                          |

## Links

- [Agent skills](https://github.com/ekrich/plannar/tree/main/skills/plannar/SKILL.md)
- [GitHub Issues](https://github.com/ekrich/plannar/issues)

## Contributing

```sh
pnpm install && vp run ready
```

See `AGENTS.md` and `CLAUDE.md` for project conventions.

## License

MIT
