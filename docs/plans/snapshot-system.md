# Snapshot System

Pre-computed WoW game data in Supabase Postgres flat tables.

## Architecture

```
Raw DBC CSVs (~/Source/wowlab-data)
    │
    ▼
crates/snapshot-parser (Rust)
    │ Parse CSV → Transform → Flat structs
    ▼
CLI sync command (Rust, sqlx)
    │ UPSERT to Postgres
    ▼
Supabase Postgres
    ├── spell_data_flat
    ├── talent_tree_flat
    ├── item_data_flat
    └── aura_data_flat
    │
    ├─→ Portal (Supabase JS)
    ├─→ MCP Server (supabase-client crate)
    └─→ Engine (DataResolver trait)
```

## Phases

| Phase | Focus                      | Depends On |
| ----- | -------------------------- | ---------- |
| 1     | Parser: CSV → flat types   | None       |
| 2     | CLI: sync to Postgres      | Phase 1    |
| 3     | Client: Rust PostgREST     | Phase 2    |
| 4     | Engine: DataResolver trait | Phase 1, 3 |
| 5     | Portal: React Query hooks  | Phase 2    |

## Phase Prompts

### Phase 1: Parser

```
You are building a Rust crate `crates/snapshot-parser` that parses WoW DBC CSV files and transforms them into flat data structures.

Read the spec: docs/plans/snapshot-phase-1-parser-foundation.md

Reference implementation (TypeScript to port):
- old/packages/wowlab-services/src/internal/data/transformer/extractors.ts
- old/packages/wowlab-services/src/internal/data/transformer/spell-impl.ts
- old/packages/wowlab-services/src/internal/data/transformer/talent.ts
- old/packages/wowlab-services/src/internal/data/transformer/item.ts
- old/packages/wowlab-services/src/internal/data/transformer/aura.ts
- old/packages/wowlab-core/src/internal/schemas/Spell.ts
- old/packages/wowlab-parsers/src/internal/simc/talents.ts

CSV files are in ~/Source/wowlab-data directory.

Build:
1. CSV loader with lazy loading
2. 30+ extractor functions (timing, resources, range, damage, etc.)
3. Flat output types: SpellDataFlat, TalentTreeFlat, ItemDataFlat, AuraDataFlat
4. Talent string decode (base64 WoW loadout format)
5. Tests with real CSV data

Success: `cargo test -p snapshot-parser` passes.
```

### Phase 2: CLI

```
You are building a CLI sync command in `crates/cli` that transforms CSV data and writes to Supabase Postgres.

Read the spec: docs/plans/snapshot-phase-2-cli.md

Dependencies:
- crates/snapshot-parser (from Phase 1) provides transform functions

Build:
1. `wowlab snapshot sync` command
2. sqlx for direct Postgres connection (service key)
3. UPSERT logic with ON CONFLICT
4. Progress reporting
5. Batch inserts (1000 rows)

Env vars: SUPABASE_DB_URL (postgres connection string)

Success: `wowlab snapshot sync --patch 11.2.0 --data-dir ~/Source/wowlab-data` populates all 4 tables.
```

### Phase 3: Client

```
You are building a Rust crate `crates/supabase-client` that reads from Supabase PostgREST API.

Read the spec: docs/plans/snapshot-phase-3-loaders-wasm.md

Build:
1. SupabaseClient with reqwest
2. Query methods: get_spell, get_spells, search_spells, get_talent_tree, get_item, get_aura
3. TTL-based caching (dashmap + Instant)
4. Retry logic with exponential backoff
5. Partial response types for column selection

Env vars: SUPABASE_URL, SUPABASE_ANON_KEY

Success: `cargo test -p supabase-client` passes against real Supabase.
```

### Phase 4: Engine Integration

```
You are adding a DataResolver trait to `crates/engine` that abstracts data sources.

Read the spec: docs/plans/snapshot-phase-4-engine-integration.md

Dependencies:
- crates/snapshot-parser (from Phase 1) provides types and CSV parsing
- crates/supabase-client (from Phase 3) provides API client

Build:
1. DataResolver trait with get_spell, get_talent_tree, etc.
2. LocalResolver: reads CSV via snapshot-parser (default, offline)
3. SupabaseResolver: reads via supabase-client (optional feature)
4. Talent string integration: decode loadout → resolve spells
5. Feature flag: `--features supabase` enables SupabaseResolver

Usage:
  cargo run -p engine -- sim --spec 253 --talents "..." --data-source local
  cargo run -p engine --features supabase -- sim --data-source supabase

Success: Engine runs with both LocalResolver and SupabaseResolver.
```

### Phase 5: Portal

```
You are building React Query hooks for the portal at apps/portal/ to query flat tables.

Read the spec: docs/plans/snapshot-phase-5-portal-migration.md

Build:
1. TypeScript types matching flat table schemas (src/types/flat.ts)
2. useSpell, useSpells, useSpellSearch hooks
3. useTalentTree, useClassTalentTrees hooks
4. useItem, useItemsByLevel, useItemSearch hooks
5. useAura hook

Uses existing Supabase JS client at @/lib/supabase.

Success: `pnpm build` succeeds, hooks return correct data.
```

## Reference

| Path                                              | Purpose               |
| ------------------------------------------------- | --------------------- |
| docs/plans/snapshot-phase-1-parser-foundation.md  | Parser spec           |
| docs/plans/snapshot-phase-2-cli.md                | CLI spec              |
| docs/plans/snapshot-phase-3-loaders-wasm.md       | Client spec           |
| docs/plans/snapshot-phase-4-engine-integration.md | Engine spec           |
| docs/plans/snapshot-phase-5-portal-migration.md   | Portal spec           |
| docs/plans/snapshot-data-flow-options.md          | Architecture overview |
