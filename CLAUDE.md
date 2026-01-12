# wowlab

## Rules

1. **User is always right.** Do not deviate from instructions. Do not "improve" or interpret. Ask if unclear.
2. **Tree before creating files.** Always run `tree` on the containing directory first. Match existing naming and structure patterns exactly. One file per domain concept.
3. **Read skills before related work.** Skills in `.claude/skills/` have required patterns. Load with `/game-data`, `/park-ui`, etc.

## Commands

```bash
pnpm build        # Build all (always use this)
pnpm dev          # Dev mode
pnpm test         # Run tests
pnpm lint         # Lint
pnpm cli <cmd>    # CLI tools
```

Never use `pnpm --filter` or `pnpm typecheck`.

## Rust Engine

```bash
cd crates/engine
cargo build --release
cargo test
```

WASM: `wasm-pack build --target web --out-dir ../../packages/wowlab-engine/wasm`

## MCP Servers

Use for docs — don't guess APIs: Context7, Effect Docs, shadcn, Supabase

## Skills

| Skill | When |
|-------|------|
| `game-data` | Spells, items, DBC data |
| `park-ui` | UI components |
| `engine-content` | Rust engine spells/talents |
| `effect-service` | Effect-TS services |

## More Context

Each package/app has its own `CLAUDE.md` (loads on-demand)
