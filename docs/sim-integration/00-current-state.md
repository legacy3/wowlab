# Phase 0: Current State Analysis

> Understanding what we have before we integrate

## Overview

This document describes the current architecture of both `apps/standalone` and `apps/portal`, and identifies the gaps that need to be bridged for integration.

---

## apps/standalone: The Simulation Engine

### Purpose

A standalone Node.js CLI tool for running WoW combat simulations with support for:

- Local single/batch simulation execution
- Distributed computing via RPC daemon
- Worker thread pooling for high-throughput (100k+ sims)

### Entry Points

```
src/index.ts                     # CLI entry (@effect/cli)
├── commands/run/index.ts        # Main simulation execution
└── commands/daemon/index.ts     # RPC server mode
```

### Simulation Flow

```
1. CLI args → Parse rotation name, duration, iterations, workers
2. loadSpells() → Query Supabase for spell DBC data (cached 5min)
3. createRotationRuntime() → Build Effect runtime with all services
4. runSimulation() → Execute simulation loop:
   ├── registerSpec(Hunter.BeastMastery)
   ├── createRotationPlayer()
   ├── LOOP until duration:
   │   ├── rotation.run(playerId) → Execute APL priority list
   │   └── simDriver.run(currentTime + 100ms) → Advance time
   └── return { casts, duration, simId }
```

### Key Files

| File                               | Purpose                                  |
| ---------------------------------- | ---------------------------------------- |
| `src/commands/run/index.ts`        | Main simulation logic (270 lines)        |
| `src/runtime/RotationRuntime.ts`   | Creates Effect runtime with all services |
| `src/rotations/beast-mastery.ts`   | Beast Mastery Hunter APL                 |
| `src/workers/simulation-worker.ts` | Worker thread executor                   |
| `src/data/spell-loader.ts`         | Supabase spell data loading (600+ lines) |

### Worker Architecture

```
Main Thread
├── WorkerPool (N workers, default: CPU count - 1)
│   └── Per worker:
│       ├── Init: Load rotation + spells once
│       └── Loop: Execute batches of 100 sims each
├── Wave-based batching (10 batches per worker per wave)
└── Aggregated results collection
```

### Rotation Definition Interface

```typescript
interface RotationDefinition {
  name: string;
  run: (playerId: UnitID) => Effect<void>;
  spellIds: number[];
}
```

### Current Output

- Single sim: Detailed timeline with cast events
- Batch sims: Aggregated stats (avgCasts, throughput, elapsed time)

---

## apps/portal: The User Interface

### Purpose

Next.js 16 web application providing:

- Rotation browsing, editing, and management
- Simulation configuration and results visualization
- User profiles and settings

### Tech Stack

- **Framework:** Next.js 16 (App Router), React 19
- **State:** Jotai (atoms) + Refine (data provider)
- **UI:** shadcn/ui, TailwindCSS 4
- **Viz:** Konva (timeline), Recharts (charts)
- **Backend:** Supabase (auth, database)

### /simulate Route Structure

```
/simulate                        # Quick sim page
├── page.tsx                     # Renders <QuickSimContent />
└── results/[id]/page.tsx        # Results with tabs

Components:
├── quick-sim-content.tsx        # Main entry, state management
├── simulation-result-tabs.tsx   # Overview, Timeline, Charts tabs
├── results-overview.tsx         # Draggable stats cards
├── results/timeline/            # Konva-based timeline viz
└── results/charts/              # Recharts analytics
```

### Current User Flow (MOCK DATA)

```
1. User lands on /simulate
2. Paste SimulationCraft export in textarea
3. When content > 50 chars, "parses" to MOCK_PARSED_DATA
4. Display character summary + equipment grid
5. Select Fight Profile (Patchwerk, Movement, Multi-Target)
6. Configure: Duration (30-900s), Iterations (100-50k)
7. Click "Run Simulation" → Navigate to /simulate/results/[id]
8. Results displayed using MOCK timeline/chart data
```

### Jotai Atoms

```typescript
// Config atoms (atoms/sim/config.ts)
fightDurationAtom: number (default: 300)
iterationsAtom: number (default: 1000)
targetTypeAtom: "patchwerk" | "movement" | "aoe"

// Timeline atoms (atoms/timeline/state.ts)
CastEvent, BuffEvent, DamageEvent, ResourceEvent, PhaseMarker
Track visibility, spell selection/hover

// Charts atoms (atoms/charts/state.ts)
DPS data points, resource tracking, ability stats
Cooldown events, detailed breakdown
```

### Monorepo Dependencies

```json
"@wowlab/core": "workspace:*",
"@wowlab/services": "workspace:*"
```

---

## Shared Packages

### @wowlab/core

Core domain types using Immutable.js:

- `Entities.Unit` - Player/NPC with spells, auras, power
- `Entities.GameState` - Central state (units, projectiles, time)
- `Entities.Spell` - Cooldowns, cast times, resource costs
- `Schemas.CombatLog` - Event types (SpellCastSuccess, SpellDamage, etc.)

### @wowlab/services

Effect-TS services:

- `StateService` - Manages immutable game state
- `CombatLogService` - Event emission and handlers
- `UnitService` - Unit CRUD operations
- `UnitAccessor` / `SpellAccessor` - Read access with validation

### @wowlab/rotation

Rotation context and actions:

- `RotationContext` - Aggregates spell + control actions
- `SpellActions` - `canCast()`, `cast()` with validation
- `ControlActions` - `wait()`, `waitUntil()` for time control

### @wowlab/specs

Spec definitions:

- Hunter.BeastMastery (implemented)
- Handler factories and registration utilities

### @wowlab/runtime

Application layer assembly:

- `createAppLayer()` - Composes all services into Effect Layer

---

## Gap Analysis

| Area                 | Standalone          | Portal                | Gap                        |
| -------------------- | ------------------- | --------------------- | -------------------------- |
| Simulation execution | Full implementation | Mock data only        | Need API integration       |
| Spell data loading   | Supabase queries    | None                  | Need data access           |
| Worker management    | Worker threads      | None                  | Need server-side execution |
| Results format       | Console output      | Timeline/Charts atoms | Need format transformation |
| Real-time progress   | None                | Has UI components     | Need streaming connection  |
| Persistence          | None                | Refine + Supabase     | Need to connect            |

---

## Integration Requirements

### Must Have

1. Server-side simulation execution (Effect runtime in API routes)
2. Spell data loading from Supabase
3. Results transformation to portal's timeline/chart format
4. Job management (start, status, cancel)

### Should Have

1. Streaming progress updates (SSE or WebSocket)
2. Results persistence to Supabase
3. Worker thread pooling for batch simulations

### Nice to Have

1. Distributed execution via RPC daemon
2. Simulation history and comparison
3. Real-time DPS preview during sim

---

## Data Flow Target Architecture

```
Portal UI                         Server (Next.js)
─────────────────────────────────────────────────────────────────────

User Input
  └─→ Jotai atoms
      └─→ POST /api/simulations
          └─→ SimulationRuntime
              ├─→ loadSpells() from Supabase
              ├─→ Effect.runFork() → Background fiber
              └─→ Return { jobId }

Progress Updates
  ←── GET /api/simulations/[id]/stream (SSE)
      ←── SimDriver progress events

Final Results
  ←── GET /api/simulations/[id]
      ←── Transformed timeline + chart data
      └─→ Save to Supabase (rotation_sim_results)
```

---

## Next Steps

→ [Phase 1: Runtime Extraction](./01-runtime-extraction.md)
