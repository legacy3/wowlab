# wowlab

## Rules

1. **User is always right.** Do not deviate from instructions. Do not "improve" or interpret. Ask if unclear.
2. **Tree before creating files.** Always run `tree` on the containing directory first. Match existing naming and structure patterns exactly. One file per domain concept.
3. **Read skills before related work.** Skills in `.claude/skills/` have required patterns. Load with `/game-data`, `/park-ui`, etc.
4. **No inferior solutions.** Never suggest or implement "quick fixes", "workarounds", or "hardcoded" alternatives to proper solutions. If something needs database work, do database work. If something needs proper architecture, do proper architecture. No shortcuts, no hacks, no "Option A vs B" bullshit.
5. **Never leave old code.** When refactoring or renaming, DELETE the old code completely. No deprecated wrappers, no backwards-compatibility shims, no "legacy exports", no commented-out old versions. If something is renamed or replaced, update ALL usages and remove the old thing entirely. If you detect yourself about to leave old code, STOP immediately, apologize, and fix it.

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

Use for docs — don't guess APIs: Context7, Supabase

## Skills

| Skill              | When                              |
| ------------------ | --------------------------------- |
| `game-data`        | Spells, items, DBC data           |
| `park-ui`          | UI components                     |
| `portal-component` | New pages/components in portal    |
| `engine-content`   | Rust engine spells/talents        |
| `profile-engine`   | Performance profiling the engine  |
| `rust-quality`     | Rust code review, clippy, testing |
| `pre-commit`       | Code hygiene before commits       |

## More Context

Each package/app has its own `CLAUDE.md` (loads on-demand)
