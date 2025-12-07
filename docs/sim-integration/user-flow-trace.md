# User Flow Trace: /simulate

> Complete trace of user journey from landing on /simulate to viewing results

---

## Overview Diagram

```
┌─────────────────────────────────────────────────────────────────────────┐
│                           USER JOURNEY                                   │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  1. LAND ON /simulate                                                   │
│     └─→ QuickSimContent renders with empty state                        │
│                                                                         │
│  2. PASTE SimC EXPORT                                                   │
│     └─→ Parse character data                                            │
│     └─→ Display CharacterSummaryCard + EquipmentGrid                    │
│                                                                         │
│  3. CONFIGURE SIMULATION                                                │
│     └─→ Select Fight Profile (Patchwerk, Movement, AoE)                 │
│     └─→ Set Duration (30-900s) and Iterations (1-50000)                 │
│                                                                         │
│  4. CLICK "RUN SIMULATION"                                              │
│     └─→ POST /api/simulations                                           │
│     └─→ Server creates job, returns jobId                               │
│     └─→ Navigate to /simulate/results/[jobId]                           │
│                                                                         │
│  5. VIEW PROGRESS                                                       │
│     └─→ Connect to SSE stream                                           │
│     └─→ Display progress bar + partial stats                            │
│                                                                         │
│  6. VIEW RESULTS                                                        │
│     └─→ SSE delivers final results                                      │
│     └─→ Display Overview / Timeline / Charts tabs                       │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## Step 1: Landing on /simulate

### URL

```
https://app.wowlab.dev/simulate
```

### Component Tree

```
app/simulate/page.tsx (Server Component)
└── QuickSimContent (Client Component)
    ├── SimcPasteInput
    │   └── Textarea (empty initially)
    ├── [Hidden until paste] CharacterSummaryCard
    ├── [Hidden until paste] EquipmentGrid
    ├── FightProfileSelector
    │   └── RadioGroup: Patchwerk | Light Movement | Multi-Target
    ├── AdvancedOptions (collapsed)
    │   ├── Slider: Fight Duration (300s default)
    │   └── Slider: Iterations (1000 default)
    └── Button: "Run Simulation" (disabled until character data)
```

### State

```typescript
// Jotai atoms (from atoms/sim/config.ts)
fightDurationAtom: 300; // persisted in localStorage
iterationsAtom: 1000; // persisted in localStorage
targetTypeAtom: "patchwerk"; // persisted in localStorage

// Component state
parsedCharacter: null; // useState, populated after paste
```

---

## Step 2: Pasting SimC Export

### User Action

User pastes SimulationCraft addon export into textarea:

```
# SimC Addon Export
# VERSION: 1.0.0
hunter="Huntero"
level=80
race=dwarf
spec=beast_mastery
...
```

### Code Flow

```
SimcPasteInput.onChange(value)
└── if (value.length > 50)
    └── parseSimcExport(value)
        └── Returns: ParsedCharacter {
              name: "Huntero",
              race: "Dwarf",
              class: "Hunter",
              spec: "Beast Mastery",
              level: 80,
              itemLevel: 615,
              equipment: {
                head: { id: 123, name: "...", ilvl: 619 },
                ...
              }
            }
    └── setParsedCharacter(result)
    └── UI updates to show character + equipment
```

### Updated UI

```
QuickSimContent
├── SimcPasteInput (filled, collapsed to summary)
├── CharacterSummaryCard ← NOW VISIBLE
│   └── "Huntero" | Dwarf Hunter | Beast Mastery | 615 ilvl
├── EquipmentGrid ← NOW VISIBLE
│   ├── LeftColumn: Head, Neck, Shoulder, Back, Chest, Wrist
│   ├── CenterColumn: Character model placeholder
│   └── RightColumn: Waist, Legs, Feet, Finger1, Finger2, Trinket1, Trinket2
├── FightProfileSelector
├── AdvancedOptions
└── Button: "Run Simulation" ← NOW ENABLED
```

---

## Step 3: Configuring Simulation

### User Actions

1. Clicks "Light Movement" fight profile
2. Expands Advanced Options
3. Drags Duration slider to 180s
4. Drags Iterations slider to 5000

### State Updates

```typescript
// Jotai atoms update (auto-persisted)
targetTypeAtom: "movement";
fightDurationAtom: 180;
iterationsAtom: 5000;
```

---

## Step 4: Running Simulation

### User Action

Clicks "Run Simulation" button

### Code Flow

```
QuickSimContent.handleRunSimulation()
└── useSimulation().startSimulation({
      rotationId: "beast-mastery",  // Mapped from spec
      duration: 180,
      iterations: 5000,
      fightType: "movement",
      character: { name: "Huntero", class: "Hunter", spec: "Beast Mastery" }
    })

    └── fetch("POST /api/simulations", { body: JSON.stringify(config) })
```

### Server Processing

```
POST /api/simulations
├── Validate request with Zod schema
├── Check rate limit (10 requests/minute)
├── JobManager.create(config, userId)
│   ├── Generate jobId: "abc123xyz456"
│   ├── Save to database (simulation_jobs table)
│   ├── Store in memory Map
│   └── JobManager.execute(job) [async, non-blocking]
└── Return { jobId: "abc123xyz456", status: "queued", createdAt: "..." }
```

### Response

```json
{
  "jobId": "abc123xyz456",
  "status": "queued",
  "createdAt": "2024-01-15T10:30:00Z"
}
```

### Navigation

```typescript
// In useSimulation hook
onSuccess: (data) => {
  router.push(`/simulate/results/${data.jobId}`);
};
// User navigates to: /simulate/results/abc123xyz456
```

---

## Step 5: Viewing Progress

### URL

```
https://app.wowlab.dev/simulate/results/abc123xyz456
```

### Component Tree

```
app/simulate/results/[id]/page.tsx (Server Component)
└── SimulationResults (Client Component)
    └── useSimulationStream("abc123xyz456")
        └── EventSource("/api/simulations/abc123xyz456/stream")
```

### SSE Connection

```
GET /api/simulations/abc123xyz456/stream
Content-Type: text/event-stream

event: connected
data: {"type":"connected","jobId":"abc123xyz456"}

event: progress
data: {"type":"progress","current":100,"total":5000,"percentage":2}

event: progress
data: {"type":"progress","current":500,"total":5000,"percentage":10}

event: partial
data: {"type":"partial","stats":{"meanDps":45230,"minDps":42100,"maxDps":48500}}

event: progress
data: {"type":"progress","current":1000,"total":5000,"percentage":20}

... (continues until complete)
```

### UI During Progress

```
SimulationResults
└── SimulationProgress
    ├── Card: "Running Simulation"
    │   ├── Spinner icon
    │   ├── Progress bar: [████████░░░░░░░░░░░░] 40%
    │   └── "2,000 / 5,000 iterations"
    └── Partial Stats (after 10%)
        ├── Card: "Running Avg DPS" → 45,230
        ├── Card: "Min DPS" → 42,100
        └── Card: "Max DPS" → 48,500
```

---

## Step 6: Viewing Results

### SSE Final Event

```
event: complete
data: {
  "type": "complete",
  "stats": {
    "meanDps": 45890,
    "minDps": 41200,
    "maxDps": 51300,
    "stdDev": 2340,
    "iterations": 5000,
    "duration": 180
  },
  "timeline": {
    "casts": [...],
    "buffs": [...],
    "debuffs": [...],
    "damage": [...]
  },
  "charts": {
    "dps": [...],
    "abilities": [...],
    "resources": [...]
  }
}
```

### State Update

```typescript
// useSimulationStream state
{
  status: "complete",
  result: {
    stats: { meanDps: 45890, ... },
    timeline: { casts: [...], ... },
    charts: { dps: [...], ... }
  }
}
```

### UI After Completion

```
SimulationResults
└── SimulationResultTabs
    ├── TabsList
    │   ├── Tab: "Overview" (default)
    │   ├── Tab: "Timeline"
    │   └── Tab: "Charts"
    │
    ├── TabContent: Overview
    │   └── ResultsOverview
    │       ├── StatsCards (draggable grid)
    │       │   ├── MeanDpsCard: 45,890 DPS
    │       │   ├── MinDpsCard: 41,200 DPS
    │       │   ├── MaxDpsCard: 51,300 DPS
    │       │   ├── StdDevCard: 2,340
    │       │   ├── DurationCard: 180s
    │       │   └── IterationsCard: 5,000
    │       └── EquipmentSummary
    │
    ├── TabContent: Timeline
    │   └── TimelineContent
    │       └── Konva Stage
    │           ├── PhaseTrack (fight phases)
    │           ├── CastTrack (spell casts)
    │           ├── BuffTrack (active buffs)
    │           ├── DebuffTrack (target debuffs)
    │           ├── DamageTrack (damage events)
    │           └── ResourceTrack (focus/mana)
    │
    └── TabContent: Charts
        └── ChartsContent
            ├── DpsChart (line chart over time)
            ├── AbilityBreakdownChart (pie/bar)
            ├── ResourceUsageChart (area chart)
            └── CooldownUsageChart (timeline)
```

---

## Server-Side Execution Flow

### JobManager.execute() Detail

```
JobManager.execute(job)
│
├── Update status: "running"
├── Update database: started_at = now()
│
├── Get rotation definition
│   └── RotationRegistry.get("beast-mastery")
│       └── Returns: BeastMasteryRotation {
│             name: "Beast Mastery Hunter",
│             run: Effect<void>,
│             spellIds: [217200, 193455, 34026, ...]
│           }
│
├── Load spell data
│   └── loadSpells([217200, 193455, 34026, ...])
│       └── Query Supabase for spell DBC tables
│       └── Transform to SpellDataFlat[]
│       └── Returns: 9 spell definitions
│
├── Create simulation runtime
│   └── createSimulationRuntime({ spells, logLevel: "none" })
│       └── MetadataLayer (spell data in memory)
│       └── AppLayer (State, CombatLog, Unit services)
│       └── Returns: ManagedRuntime
│
├── Execute batch simulation
│   └── runBatch(runtime, {
│         iterations: 5000,
│         duration: 180000,  // ms
│         rotation: BeastMasteryRotation,
│         onProgress: (current, total) => notify(...)
│       })
│       │
│       ├── For each iteration (parallelized in workers):
│       │   ├── Reset game state
│       │   ├── Create player unit
│       │   ├── Register spec handlers
│       │   │
│       │   └── SIMULATION LOOP (1800 iterations @ 100ms each):
│       │       ├── Get current time from StateService
│       │       ├── Execute rotation.run(playerId)
│       │       │   └── BeastMasteryRotation.run():
│       │       │       ├── tryCast(Bestial Wrath)   → checks CD, casts if ready
│       │       │       ├── tryCast(Call of the Wild) → checks CD
│       │       │       ├── tryCast(Barbed Shot)     → checks CD + charges
│       │       │       ├── tryCast(Kill Command)    → checks CD
│       │       │       ├── tryCast(Cobra Shot)      → filler, always ready
│       │       │       └── Return after GCD consumed
│       │       │
│       │       ├── SimDriver.run(currentTime + 100)
│       │       │   └── Process event queue
│       │       │   └── Trigger handlers (damage calc, aura application)
│       │       │   └── Advance game time
│       │       │
│       │       └── Continue until currentTime >= 180000ms
│       │
│       ├── Collect results from all iterations
│       ├── Calculate aggregate stats (mean, min, max, stdDev)
│       └── Return BatchResult
│
├── Transform results
│   └── transformResults(batchResult)
│       └── Returns: { stats, timeline, charts }
│
├── Save to database
│   └── SimulationRepository.saveResult(...)
│       └── INSERT INTO rotation_sim_results ...
│       └── Returns: resultId
│
├── Link job to result
│   └── UPDATE simulation_jobs SET result_id = ..., status = 'completed'
│
└── Notify subscribers
    └── JobManager.notify(jobId, { type: "complete", stats, timeline, charts })
        └── SSE stream sends final event
        └── Client receives and updates UI
```

---

## Data Flow Summary

```
┌─────────────────────────────────────────────────────────────────────────┐
│                          DATA FLOW                                       │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  CLIENT                      │  SERVER                                  │
│  ────────────────────────────│──────────────────────────────────────── │
│                              │                                          │
│  [Jotai Atoms]               │  [JobManager]                            │
│  ├─ fightDurationAtom        │  ├─ In-memory job Map                    │
│  ├─ iterationsAtom           │  ├─ Subscriber registry                  │
│  └─ targetTypeAtom           │  └─ Execution orchestration              │
│         │                    │         │                                │
│         ▼                    │         ▼                                │
│  [POST /api/simulations]────────► [Create Job]                          │
│         │                    │         │                                │
│         │                    │         ▼                                │
│  [Navigate to results]       │  [JobManager.execute()]                  │
│         │                    │         │                                │
│         ▼                    │         ▼                                │
│  [EventSource SSE] ◄─────────── [SSE Stream]                            │
│         │                    │         │                                │
│         │                    │         ▼                                │
│  [useSimulationStream]       │  [SimulationRuntime]                     │
│  ├─ progress                 │  ├─ SpellLoader                          │
│  ├─ partialStats             │  ├─ RotationRegistry                     │
│  └─ result                   │  └─ Effect execution                     │
│         │                    │         │                                │
│         ▼                    │         ▼                                │
│  [SimulationResultTabs]      │  [Database]                              │
│  ├─ Overview                 │  ├─ simulation_jobs                      │
│  ├─ Timeline                 │  └─ rotation_sim_results                 │
│  └─ Charts                   │                                          │
│                              │                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## File References

### Client-Side

| File                                             | Purpose                        |
| ------------------------------------------------ | ------------------------------ |
| `app/simulate/page.tsx`                          | Server component wrapper       |
| `components/simulate/quick-sim-content.tsx`      | Main form and state management |
| `components/simulate/simulation-results.tsx`     | Results display orchestrator   |
| `components/simulate/simulation-progress.tsx`    | Progress bar and partial stats |
| `components/simulate/simulation-result-tabs.tsx` | Tab container for results      |
| `hooks/simulation/use-simulation.ts`             | Start simulation mutation      |
| `hooks/simulation/use-simulation-stream.ts`      | SSE stream hook                |
| `atoms/sim/config.ts`                            | Configuration atoms            |
| `atoms/timeline/state.ts`                        | Timeline data atoms            |
| `atoms/charts/state.ts`                          | Chart data atoms               |

### Server-Side

| File                                       | Purpose                      |
| ------------------------------------------ | ---------------------------- |
| `app/api/simulations/route.ts`             | Create/list simulations      |
| `app/api/simulations/[id]/route.ts`        | Get/cancel simulation        |
| `app/api/simulations/[id]/stream/route.ts` | SSE progress stream          |
| `lib/simulation/job-manager.ts`            | Job lifecycle management     |
| `lib/simulation/result-transformer.ts`     | Convert results to UI format |
| `lib/simulation/repository.ts`             | Database operations          |

### Shared Package

| File                                                          | Purpose                |
| ------------------------------------------------------------- | ---------------------- |
| `packages/wowlab-sim-engine/src/runtime/SimulationRuntime.ts` | Effect runtime factory |
| `packages/wowlab-sim-engine/src/execution/runSimulation.ts`   | Single sim execution   |
| `packages/wowlab-sim-engine/src/execution/runBatch.ts`        | Batch execution        |
| `packages/wowlab-sim-engine/src/rotations/beast-mastery.ts`   | BM Hunter APL          |

---

## Related Documents

- [Phase 0: Current State Analysis](./00-current-state.md)
- [Phase 1: Runtime Extraction](./01-runtime-extraction.md)
- [Phase 2: API Layer](./02-api-layer.md)
- [Phase 3: Portal Wiring](./03-portal-wiring.md)
- [Phase 4: Streaming & Progress](./04-streaming-progress.md)
- [Phase 5: Persistence & Polish](./05-persistence-polish.md)
