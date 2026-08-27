<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# Rocky (architecture & workflow)

**Always start with Rocky MCP** (`user-rocky` / `devkit`). Read the handbook before coding.

## Pipeline (every task)

1. `devkit` → `list_handbook` — pick rules + agents for this repo
2. **Discovery** — read `graphify-out/GRAPH_REPORT.md`; after edits run `graphify update .`
3. **Profile** — Next.js App Router → agent `nextjs-developer.md`, rules `engineering-workflow.mdc`, `codebase-discovery.mdc`
4. **Implement** — thin `src/app/` routes; domain logic in `src/engine/`; persistence in `src/lib/`; UI in `src/components/`
5. **Gate** — `yarn lint` + `yarn build`; use `devkit` → `pre_pr_quality_gate` before PR

## This repo layout (Rocky-aligned)

```
src/
├── app/           # Next.js routes only (thin)
├── engine/        # Pure domain: types, queries, validate, phases, magic, data
├── components/    # Client UI ("use client" where needed)
└── lib/           # Infrastructure adapters (storage, id)
scripts/           # BSData extract + smoke tests
```

## Key Rocky resources

| Need | Fetch via MCP |
|------|----------------|
| Next.js patterns | `devkit://handbook/agents/nextjs-developer.md` |
| Discovery | `devkit://handbook/rules/codebase-discovery.mdc` |
| Human-readable code | `devkit://handbook/rules/human-readable-code.mdc` |
| PR gate | `devkit` → `pre_pr_quality_gate` |

Do **not** impose legacy SPA patterns (`context/`, `reducers/`, antd Form stack) — this is a Next.js client-heavy app with a pure engine layer.
