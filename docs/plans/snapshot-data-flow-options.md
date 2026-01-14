# Snapshot System: Architecture

## Architecture

Flat Postgres tables in Supabase. Transformation runs once (CLI sync), not at query time.

```
DBC CSVs (local data/)
    │
    ▼
snapshot-parser (Rust crate)
    │ Parse CSV → Transform → Flat structs
    ▼
CLI sync command (Rust)
    │ UPSERT via sqlx
    ▼
Supabase Postgres (flat tables)
    ├── spell_data_flat
    ├── talent_tree_flat
    ├── item_data_flat
    └── aura_data_flat
    │
    ├─→ Portal (Supabase JS client)
    ├─→ MCP Server (PostgREST API)
    └─→ Engine (DataResolver trait)
        ├─ LocalResolver: CSV → snapshot-parser (offline)
        └─ SupabaseResolver: PostgREST (online)
```

## Phases

| Phase | Focus |
|-------|-------|
| 1 | Parser: Port extraction logic to Rust |
| 2 | CLI: Sync to Postgres |
| 3 | Client: Rust PostgREST reader |
| 4 | Engine: Resolver trait + integration |
| 5 | Portal: Query flat tables |

## Phase Dependencies

```
Phase 1 (Parser) ──────────┬─────────────────────────────┐
                           │                             │
                           ▼                             │
                    Phase 2 (CLI)                        │
                           │                             │
            ┌──────────────┴──────────────┐              │
            │                             │              │
            ▼                             ▼              ▼
     Phase 3 (Client)              Phase 5 (Portal)   Phase 4 (Engine)
```

- Phase 3 and 5 can run in parallel after Phase 2
- Phase 4 can start after Phase 1 (LocalResolver doesn't need Phase 2-3)
- Phase 4's SupabaseResolver needs Phase 3

## Table Schema

```sql
CREATE TABLE spell_data_flat (
  id INTEGER PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  -- 60+ columns
  effects JSONB NOT NULL DEFAULT '[]',
  patch_version TEXT NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE talent_tree_flat (
  id SERIAL PRIMARY KEY,
  spec_id INTEGER NOT NULL UNIQUE,
  spec_name TEXT NOT NULL,
  class_id INTEGER NOT NULL,
  class_name TEXT NOT NULL,
  nodes JSONB NOT NULL,
  sub_trees JSONB NOT NULL DEFAULT '[]',
  patch_version TEXT NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE item_data_flat (
  id INTEGER PRIMARY KEY,
  name TEXT NOT NULL,
  item_level INTEGER NOT NULL,
  quality INTEGER NOT NULL,
  stats JSONB NOT NULL DEFAULT '[]',
  effects JSONB NOT NULL DEFAULT '[]',
  patch_version TEXT NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE aura_data_flat (
  spell_id INTEGER PRIMARY KEY,
  name TEXT NOT NULL,
  duration_ms INTEGER NOT NULL,
  max_stacks INTEGER NOT NULL,
  effects JSONB NOT NULL DEFAULT '[]',
  rppm_modifiers JSONB NOT NULL DEFAULT '[]',
  patch_version TEXT NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

## Query Patterns

### Portal (Supabase JS)
```typescript
const { data } = await supabase
  .from('spell_data_flat')
  .select('*')
  .eq('id', 53351)
  .single();
```

### Engine (Rust)
```rust
let resolver = LocalResolver::new("./data".into());
let spell = resolver.get_spell(53351).await?;
```
