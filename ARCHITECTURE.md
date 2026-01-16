# WoWLab Architecture - Complete System Overview

This document provides a comprehensive analysis of the entire WoWLab codebase architecture, data flow, and relationship between components.

## Table of Contents

1. [System Overview](#system-overview)
2. [Rust Engine (`crates/engine`)](#rust-engine-cratesengine)
3. [Portal App (`apps/portal`)](#portal-app-appsportal)
4. [Node System (`crates/node*`)](#node-system-cratesnode)
5. [Supabase Backend](#supabase-backend)
6. [Data Flow](#data-flow)
7. [Old vs New System](#old-vs-new-system)
8. [Fake/Mock/Hardcoded Data Summary](#fakemockhardcoded-data-summary)

---

## System Overview

WoWLab is a **distributed World of Warcraft simulation system** consisting of:

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              ARCHITECTURE                                    │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│   ┌──────────────┐         ┌──────────────┐         ┌──────────────────┐   │
│   │   PORTAL     │◄───────►│   SUPABASE   │◄───────►│   RUST NODES     │   │
│   │  (Next.js)   │         │  (Database)  │         │ (Simulation)     │   │
│   └──────────────┘         └──────────────┘         └──────────────────┘   │
│         │                        │                         │                │
│         │                        │                         │                │
│         ▼                        ▼                         ▼                │
│   - Web UI                 - Game Data              - node-gui (Desktop)   │
│   - Rotation Editor        - User Data              - node-headless        │
│   - Simulation UI          - Job Queue                (Server/Docker)      │
│   - Character Import       - Edge Functions         - Engine Core          │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Components

| Component | Location | Purpose |
|-----------|----------|---------|
| **Engine** | `crates/engine` | Rust simulation engine with spec implementations |
| **Portal** | `apps/portal` | Next.js web application for users |
| **Node** | `crates/node` | Shared library for distributed nodes |
| **Node-GUI** | `crates/node-gui` | Desktop app for running simulations |
| **Node-Headless** | `crates/node-headless` | Server binary for Docker/Linux |
| **Supabase** | `supabase/functions` | Edge functions and database |

---

## Rust Engine (`crates/engine`)

### Architecture

The engine is a **production-quality discrete-event combat simulation** with a clean, layered architecture:

```
DATA FLOW:
    Game Data Sources (DBC/CSV or Supabase)
         ↓
    DataResolver (abstraction layer)
         ├─→ LocalResolver (CSV files via snapshot-parser)
         └─→ SupabaseResolver (API + 3-layer caching)
         ↓
    Tuning System (TOML overrides)
         ↓
    Spec Builders (SpellBuilder, AuraBuilder)
         ├─→ BM Hunter (full implementation)
         ├─→ MM Hunter (partial implementation)
         └─→ Future specs...
         ↓
    Handler Registry
         ↓
    Simulation Engine
         ↓
    Results (DPS, breakdown, stats)
```

### Key Files

| File | Purpose |
|------|---------|
| `src/sim/state.rs` | Core simulation state machine |
| `src/actor/player.rs` | Player entity with stats |
| `src/handler/mod.rs` | `SpecHandler` trait for polymorphic specs |
| `src/specs/hunter/bm/` | Beast Mastery implementation (full) |
| `src/specs/hunter/mm/` | Marksmanship implementation (partial) |
| `src/data/resolver.rs` | `DataResolver` trait for data loading |
| `data/tuning/*.toml` | External tuning configuration |

### Spec Handler System

Each spec implements the `SpecHandler` trait:

```rust
pub trait SpecHandler: Send + Sync {
    fn spec_id(&self) -> SpecId;
    fn init_player(&self, player: &mut Player, config: &GearConfig);
    fn get_spells(&self) -> &[SpellDef];
    fn get_auras(&self) -> &[AuraDef];
    fn handle_spell(&self, spell: SpellIdx, state: &mut SimState);
    fn handle_aura_apply(&self, aura: AuraIdx, state: &mut SimState);
    // ... more methods
}
```

**Currently implemented:**

- `BmHunter` - Full 44+ spell definitions
- `MmHunter` - Foundation (Aimed Shot, Rapid Fire, etc.)

### Spell/Aura Definitions

Spells and auras use a declarative builder pattern:

```rust
// Example from bm/spells.rs
SpellBuilder::new(KILL_COMMAND)
    .name("Kill Command")
    .cooldown(7.5)
    .cooldown_haste_scaled(true)
    .charges(1)
    .focus_cost(KILL_COMMAND_COST)
    .damage(DamageType::Physical, 1.4)  // AP coefficient
    .range(50.0)
    .build()
```

### Tuning System

External TOML files override spell values **without recompilation**:

```toml
# data/tuning/bm_hunter.toml
[spells.kill_command]
cooldown = 7.5
charges = 1
focus_cost = 30.0
ap_coefficient = 1.4

[auras.frenzy]
duration = 8.0
max_stacks = 3
```

### Internal Spell IDs (Not Fake Data)

The engine uses **internal synthetic IDs** for engine-specific mechanics:

```rust
// src/specs/hunter/bm/constants.rs
pub const PET_MELEE: SpellIdx = SpellIdx(100001);           // Pet auto-attack
pub const PET_KILL_COMMAND: SpellIdx = SpellIdx(100002);    // Pet KC damage
pub const KILL_CLEAVE: SpellIdx = SpellIdx(100003);         // KC during Beast Cleave
pub const DIRE_BEAST_ATTACK: SpellIdx = SpellIdx(100004);   // Dire Beast pet attack
```

These are **intentionally synthetic** because they represent internal damage events not in WoW's database. Real spell IDs (34026, 193455, etc.) are mapped correctly via `spell_id_to_idx()`.

### Rotation System

Rotations are **JIT compiled** for performance:

```
JSON → AST → Name Resolution → Cranelift IR → Native Code (~3ns evaluation)
```

---

## Portal App (`apps/portal`)

### Architecture

The portal is a **Next.js 16** application with:

- **React Query** for server state
- **Zustand** for client state
- **Park UI + Panda CSS** for styling
- **Supabase** for database/auth

### Data Sources

| Data Type | Source | Location |
|-----------|--------|----------|
| Game data (spells, items) | Supabase `game` schema | `src/lib/state/game.ts` |
| User rotations | Supabase `rotations` table | `src/lib/state/rotation.ts` |
| User profiles | Supabase `user_profiles` table | `src/lib/state/user.ts` |
| Simulation jobs | Browser localStorage (Zustand) | `src/lib/state/computing.ts` |
| Static content | Build-time markdown | `src/content/blog/`, `src/content/docs/` |

### Hardcoded Data in Portal

**All hardcoded data is intentional for UI/dev purposes:**

| File | What | Purpose |
|------|------|---------|
| `components/dev/shared/fixtures.ts` | Test fixtures | Dev showcase/demos |
| `components/simulate/simc-input.tsx` | SimC example | Placeholder text |
| `lib/engine/index.ts` | Condition fields (100+) | Rotation editor UI |
| `components/home/home-page.tsx` | Feature cards | Homepage content |
| `content/blog/*.md` | Blog posts (1) | Static content |
| `content/docs/*.md` | Documentation (9) | Static content |

### Key React Query Hooks

```typescript
// src/lib/state/game.ts
useSpell(id)              // Single spell by ID
useSpells(ids)            // Multiple spells
useSpellSearch(query)     // Search spells by name
useItem(id)               // Single item by ID
useItems(ids)             // Multiple items
useClasses()              // All playable classes
useSpecs()                // All specializations

// src/lib/state/rotation.ts
useLoadRotation(id)       // Fetch rotation by ID
useSaveRotation()         // Create/update rotation
```

---

## Node System (`crates/node*`)

### Architecture

The node system is a **distributed volunteer compute network**:

```
┌─────────────────────────────────────────────────────────────────┐
│                         NODE SYSTEM                              │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│   ┌─────────────────┐                                           │
│   │    node-gui     │  Desktop application (egui)               │
│   │    (Binary)     │  - Visual status/logs                     │
│   └────────┬────────┘  - Update management                      │
│            │                                                     │
│            ▼                                                     │
│   ┌─────────────────┐                                           │
│   │      node       │  Shared library                           │
│   │   (Library)     │  - API client                             │
│   │                 │  - Worker pool                            │
│   │                 │  - Realtime WebSocket                     │
│   │                 │  - Engine integration                     │
│   └────────┬────────┘                                           │
│            │                                                     │
│            ▼                                                     │
│   ┌─────────────────┐                                           │
│   │ node-headless   │  Server binary                            │
│   │    (Binary)     │  - Docker/container optimized             │
│   └─────────────────┘  - Signal handling (SIGTERM/SIGINT)       │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### Node Core (`node/src/core.rs`)

The brain implementing an event-driven state machine:

**Lifecycle States:**

1. `Registering` - Initial handshake with server
2. `Claiming { code }` - Waiting for user claim via web
3. `Running` - Fully operational, receiving work

**Key Features:**

- Pull-based work distribution (nodes request work)
- 5-minute heartbeat intervals
- Automatic reconnection with exponential backoff
- Worker pool for parallel simulations

### SimRunner (`node/src/worker/runner.rs`)

**Bridge between Node and Engine:**

```rust
pub fn run(config_json: &str, iterations: u32, base_seed: u64)
    -> Result<serde_json::Value, SimError>
```

**Flow:**

1. Parse `SimRequest` JSON
2. Map spec string → `SpecId::BeastMastery`
3. Create `Player` with stats
4. Get handler: `BmHunter::new()`
5. Run batch simulation (N iterations)
6. Return aggregated results as JSON

### Worker Pool (`node/src/worker/pool.rs`)

Thread pool bounded by CPU cores:

```rust
pub struct WorkerPool {
    max_workers: usize,              // Usually = CPU core count
    active_workers: Arc<AtomicU32>,  // Current active simulations
    completed_chunks: Arc<AtomicU64>,// Lifetime counter
    sims_completed: Arc<AtomicU64>,  // Lifetime counter
    work_tx: mpsc::Sender<WorkItem>,
    result_rx: mpsc::Receiver<WorkResult>,
}
```

---

## Supabase Backend

### Configuration

- **Database:** PostgreSQL 17, port 54322 (local)
- **API:** Port 54321 (REST auto-generated)
- **Auth:** JWT-based, 1-hour expiry

### Database Schemas

**`game` schema** (read-only game data):

- `spells`, `items`, `classes`, `specs`, `auras`
- `specs_traits`, `global_colors`, `global_strings`

**`public` schema** (application data):

- `user_profiles`, `user_settings`, `user_reserved_handles`
- `rotations`, `rotations_versions`
- `sim_configs`, `jobs`, `jobs_chunks`
- `nodes`, `nodes_permissions`
- `short_urls`, `sim_profiles`

### Edge Functions (10 total)

| Function | Auth | Purpose |
|----------|------|---------|
| `job-create` | JWT | Create simulation job, split into chunks |
| `config-upsert` | JWT | Store simulation config by hash |
| `config-fetch` | Public | Fetch config by hash (1yr cache) |
| `rotation-fetch` | Public | Fetch rotation script |
| `node-register` | Public | Register new node, return claim code |
| `node-heartbeat` | Public | Signal node is online |
| `chunk-claim` | Public | Pull batch of available work |
| `chunk-complete` | Public | Submit simulation results |
| `icons` | Public | Proxy WoWHead icons with CORS |
| `talent-atlas` | Public | Proxy WoWHead talent textures |

---

## Data Flow

### Distributed Simulation Flow

```
┌────────────────────────────────────────────────────────────────────────────┐
│                      DISTRIBUTED SIMULATION FLOW                            │
├────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  1. USER INITIATES SIMULATION                                               │
│     Portal → config-upsert → sim_configs table                              │
│           → job-create → jobs + jobs_chunks tables                          │
│                        → Realtime "work-available" broadcast                │
│                                                                             │
│  2. NODE CLAIMS WORK                                                        │
│     Node → chunk-claim → Gets batch of chunks                               │
│         → config-fetch → Gets simulation config                             │
│         → rotation-fetch → Gets rotation script                             │
│                                                                             │
│  3. NODE SIMULATES                                                          │
│     Node → WorkerPool → SimRunner → Engine                                  │
│         → Runs N iterations                                                 │
│         → Produces { meanDps, stdDps, minDps, maxDps }                      │
│                                                                             │
│  4. NODE SUBMITS RESULTS                                                    │
│     Node → chunk-complete → Updates chunk status                            │
│         → If all chunks done: Aggregate results, mark job complete          │
│                                                                             │
│  5. PORTAL RECEIVES RESULT                                                  │
│     Portal polls jobs table → Finds completed job → Displays DPS            │
│                                                                             │
└────────────────────────────────────────────────────────────────────────────┘
```

### Node Registration & Claiming

```
1. Node starts → node-register → Returns { id, claimCode: "ABC123" }
2. User sees claim code in GUI/console
3. User enters claim code in Portal → Updates nodes.userId
4. Node sends heartbeat → Now works for that user
5. Node can claim work based on permissions (public/user/shared)
```

---

## Old vs New System

### Migration Status

| Old Package | Status | Notes |
|-------------|--------|-------|
| `old/packages/wowlab-core` | **Replaced** | DBC schemas in TypeScript |
| `old/packages/wowlab-services` | **Replaced** | Effect-TS layers |
| `old/packages/wowlab-parsers` | **Moved** | Now `crates/parsers` (Rust) |
| `old/packages/wowlab-specs` | **Deprecated** | Now in engine |
| `old/packages/wowlab-gamedata` | **Deprecated** | No source files |
| `old/apps/portal` | **Replaced** | New: `apps/portal` (Next.js 16) |

### Architecture Evolution

```
OLD ARCHITECTURE (Monolithic TypeScript)
├── wowlab-core
│   └── DBC Schemas + Type definitions (150 files)
├── wowlab-services
│   ├── Effect-TS layers
│   ├── InMemoryMetadata (fallback mock)
│   └── CSV loaders for DBC files
└── wowlab-parsers
    ├── Spell description parser
    └── SimC talent string decoder

NEW ARCHITECTURE (Modular Rust + Next.js)
├── crates/engine (Rust)
│   ├── Hunter BM/MM specs
│   ├── DBC loaders (runtime)
│   └── Tuning system (TOML)
├── crates/node (Rust)
│   └── Distributed node runtime
├── crates/parsers (Rust)
│   └── SimC + spell parsing
└── apps/portal (Next.js 16)
    └── React + Supabase
```

---

## Fake/Mock/Hardcoded Data Summary

### ✅ REAL (Production Quality)

| Location | What |
|----------|------|
| `crates/engine/src/specs/hunter/bm/constants.rs` | Real WoW spell IDs (34026, 193455, etc.) |
| `crates/engine/src/specs/hunter/bm/spells.rs` | 44+ real spell definitions |
| `crates/engine/data/tuning/*.toml` | Real tuning values from WoW |
| `apps/portal/src/lib/state/*.ts` | Real Supabase queries |
| `supabase/functions/*` | Real edge functions |
| `crates/node/src/supabase/client.rs` | Real API client |

### ⚠️ INTENTIONAL HARDCODING (Not Fake)

| Location | What | Why |
|----------|------|-----|
| `engine/src/specs/hunter/bm/constants.rs` | Internal IDs (100001-100010) | Engine-internal mechanics |
| `engine/src/cli/config.rs` | Default gear stats | Reasonable defaults |
| `portal/src/components/dev/shared/fixtures.ts` | Test fixtures | Dev demos only |
| `portal/src/lib/engine/index.ts` | Condition field definitions | Rotation editor UI |
| `portal/src/content/blog/*.md` | Blog content (1 post) | Static content |

### ❌ DEPRECATED (In `old/` Directory)

| Location | What |
|----------|------|
| `old/apps/portal/src/components/rotations/visualizer/mock-data.ts` | 150+ lines mock rotation |
| `old/apps/portal/src/components/lab/preset-characters/mock-data.ts` | Preset characters |
| `old/packages/wowlab-services/src/internal/metadata/InMemoryMetadata.ts` | Fallback mock |
| `old/packages/wowlab-services/src/internal/profile/ProfileComposer.ts` | TODO on line 91 |

**The `old/` directory is completely superseded by the new Rust + Next.js architecture.**

---

## Key Architectural Patterns

1. **Trait-Based Abstraction**
   - `DataResolver` for data loading
   - `SpecHandler` for spec behavior
   - No hardcoded if/match on spec types

2. **Pull-Based Work Distribution**
   - Nodes request work based on capacity
   - Better load balancing than push-based

3. **Config Hashing**
   - Simulation configs deduplicated by SHA-256
   - Same config reused across jobs

4. **Chunk-Based Parallelism**
   - 1000 iterations per chunk
   - Enables parallel execution across nodes

5. **External Tuning**
   - TOML files override spell/aura values
   - Balance changes without recompilation

6. **JIT Compiled Rotations**
   - JSON → Cranelift → Native code
   - ~3ns evaluation per decision

---

## Summary

WoWLab is a **production-quality distributed simulation system** with:

- **Zero fake APIs** - All data flows through Supabase
- **Minimal hardcoding** - Only UI constants and intentional internal IDs
- **Clean architecture** - Trait-based abstraction, proper separation of concerns
- **Extensible design** - Adding new specs = implement `SpecHandler` + define spells
- **Distributed compute** - Volunteer node network with pull-based work distribution

The `old/` directory contains deprecated TypeScript code that has been fully replaced by the current Rust engine and Next.js portal.
