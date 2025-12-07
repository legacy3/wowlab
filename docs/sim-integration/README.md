# Client-Side Simulation Integration

> Simulations run in the browser. Results upload to Supabase.

## Key Principle

**ALL simulations run client-side.** The browser:

1. Loads spell data (cached in IndexedDB)
2. Boots the Effect-TS simulation runtime
3. Executes the rotation loop
4. Uploads results to Supabase

No server-side execution. No API routes for running sims. No SSE streaming.

## Phase Overview

| Phase | Description                                              | What It Creates                                  |
| ----- | -------------------------------------------------------- | ------------------------------------------------ |
| **1** | [Browser Runtime](./01-browser-runtime.md)               | `lib/simulation/` with runtime, types, rotations |
| **2** | [Spell Loading](./02-spell-loading.md)                   | Spell loader using existing dbcLayer             |
| **3** | [Computing Integration](./03-computing-integration.md)   | Job tracking with phase states in drawer         |
| **4** | [Results & Persistence](./04-results-persistence.md)     | Simulation runner, upload, UI wiring             |
| **5** | [Event Collection](./05-event-collection.md)             | Understanding CombatLogEvent → CombatData        |
| **6** | [Implementation Plan](./06-implementation-plan.md)       | Step-by-step timeline integration                |
| **7** | [Current State Analysis](./07-current-state-analysis.md) | What exists, what's broken, quick fixes          |

## How To Use These Docs

Each phase is a **self-contained prompt**. Feed one file to Claude Code and it knows exactly what to do.

```bash
# Example workflow:
1. Read 01-browser-runtime.md
2. Implement all checklist items
3. Verify build passes
4. Move to next phase
```

## What Already Exists

| Component          | Location                              | Status                   |
| ------------------ | ------------------------------------- | ------------------------ |
| Spell loading      | `lib/services/dbc-layer.ts`           | Working (data inspector) |
| Computing drawer   | `components/layout/drawer/computing/` | Working (mock data)      |
| Job atoms          | `atoms/computing/state.ts`            | Working (mock data)      |
| Standalone runtime | `apps/standalone/src/runtime/`        | Working (CLI)            |
| Rotations          | `apps/standalone/src/rotations/`      | Working (CLI)            |

## Target Architecture

```
Browser
  └─→ loadSpellsForRotation() ─→ React Query + IndexedDB cache
  └─→ createBrowserRuntime() ─→ Effect ManagedRuntime
  └─→ runSimulationLoop() ─→ Events, DPS, etc.
  └─→ uploadSimulationResult() ─→ Supabase rotation_sim_results
```

## Files To Create

```
apps/portal/src/
├── lib/simulation/
│   ├── index.ts          # Re-exports
│   ├── types.ts          # RotationDefinition, SimulationResult
│   ├── runtime.ts        # createBrowserRuntime
│   ├── loader.ts         # loadSpellsForRotation
│   ├── runner.ts         # runSimulationLoop
│   ├── upload.ts         # uploadSimulationResult
│   ├── rotation-utils.ts # tryCast, runPriorityList
│   └── rotations/
│       ├── index.ts      # Registry
│       └── beast-mastery.ts
├── atoms/simulation/
│   └── job.ts            # Simulation job atoms
└── hooks/
    └── use-simulation.ts # Full simulation hook
```

## Success Criteria

1. Click "Run Simulation" in portal
2. Computing drawer shows job with phases:
   - "Preparing spells"
   - "Booting simulation engine"
   - "Running simulation" (with progress)
   - "Uploading results"
   - "Completed"
3. Results display in UI (DPS, damage, events)
4. Result saved to Supabase
5. All runs 100% client-side
