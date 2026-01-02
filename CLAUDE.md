# wowlab

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

Simulation engine is written in Rust (in `crates/engine/`). Build and test:

```bash
cd crates/engine
cargo build --release    # Release build (optimized)
cargo test               # Run tests
./target/release/engine --help  # CLI usage
```

WASM build for web integration:

```bash
cd crates/engine
wasm-pack build --target web --out-dir ../../packages/wowlab-engine/wasm
```

Additional crates:
- `crates/node-core/` - Distributed simulation node logic
- `crates/node/` - Node binary with UI
- `crates/node-headless/` - Headless node binary

## MCP Servers

Use for docs — don't guess APIs: Context7, Effect Docs, shadcn, Supabase

## More Context

- Each package/app has its own `CLAUDE.md` (loads on-demand)
- Skills in `.claude/skills/` for code patterns
