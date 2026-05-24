# Plannar

> Plans your team will actually read.

Plannar turns agent-written plans into interactive MDX documents. Tabs instead of walls of text. Live previews instead of mockups.

[Docs](https://github.com/ekrich/plannar/tree/main/apps/site) · [Example](https://github.com/ekrich/plannar/tree/main/apps/site)

## Quick start

```sh
npx plannar init
plannar editor
```

## What's in the box

| Package                      | Purpose                                             |
| ---------------------------- | --------------------------------------------------- |
| `@plannar/core`              | MDX compiler + state binding remark plugin + styles |
| `plannar` (CLI)              | `init` / `editor` / `status` / `export` commands    |
| `@plannar/export`            | Self-contained HTML export                          |
| `@plannar/registry-metadata` | Bind registrations for HTML + shadcn controls       |
| `@plannar/skills`            | Agent skills (Claude Code)                          |

## Links

- [Agent skills](https://github.com/ekrich/plannar/tree/main/packages/skills/skills/plannar)
- [GitHub Issues](https://github.com/ekrich/plannar/issues)

## Contributing

```sh
pnpm install && vp run ready
```

See `AGENTS.md` and `CLAUDE.md` for project conventions.

## License

MIT
