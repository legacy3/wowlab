# Portal Charts, Timeline & Simulation Analysis

> Analysis of current implementation state and required work to get these features running properly.

## Status: IMPLEMENTED

All integration work has been completed. The charts, timeline, and simulation features are now fully connected.

### What Was Done

1. **Created `simulationResultAtom`** (`atoms/simulation/results.ts`)
   - Central atom for simulation results
   - Derived atoms: `simDpsAtom`, `simTotalDamageAtom`, `simDurationAtom`, `simCastsAtom`
   - History tracking with `simulationHistoryAtom`

2. **Created Chart Transformers** (`atoms/charts/transformers.ts`)
   - `transformToDpsChartData()` - Aggregates damage into time windows
   - `transformToResourceChartData()` - Maps focus/mana snapshots
   - `transformToAbilityChartData()` - Groups casts by spell, sums damage
   - `transformToCooldownChartData()` - Extracts major CDs from buffs
   - `transformToDetailedChartData()` - Combines all metrics

3. **Updated Chart Atoms** (`atoms/charts/state.ts`)
   - All chart atoms now derive from `combatDataAtom`
   - Fallback to mock data when no simulation is loaded

4. **Fixed Timeline Data Flow**
   - Extracted SPELLS constants to `atoms/timeline/constants.ts`
   - `simulation-result-tabs.tsx` now sets both `combatDataAtom` and `simulationResultAtom`

5. **Redesigned Results Overview Cards**
   - `BestDpsCard` → Shows simulated DPS
   - `BaselineDpsCard` → Shows total damage
   - `AvgGainCard` → Shows encounter duration
   - `CombosAnalyzedCard` → Shows total casts
   - `CharacterEquipmentCard` → Shows ability breakdown with damage %
   - `ItemCombosCard` → Shows cooldown usage timeline

---

## Previous Analysis (Reference)

### Executive Summary (Before Implementation)

| Feature | Status | Main Blocker |
|---------|--------|--------------|
| **Timeline** | Working | Uses mock data, not connected to real sim |
| **Charts** | Working | Uses mock data, not connected to real sim |
| **Simulation** | Working | Results not integrated with UI |
| **Results Overview** | Broken | Missing atoms from Refine migration |

**Core Problem:** Everything renders and works independently, but there's no data pipeline connecting simulation results → charts/timeline display.

---

## 1. Current Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                        SIMULATION ENGINE                            │
│  src/lib/simulation/                                                │
│  ├── runner.ts (Effect-TS based loop)                               │
│  ├── runtime.ts (BrowserRuntime creation)                           │
│  └── transformers/ (event → CombatData conversion)                  │
│                              │                                      │
│                              ▼                                      │
│                     SimulationResult                                │
│                     { events[], dps, totalDamage, casts }           │
└──────────────────────────────┬──────────────────────────────────────┘
                               │
                               │ ← This connection EXISTS but is PARTIAL
                               ▼
┌──────────────────────────────────────────────────────────────────────┐
│                         DISPLAY LAYER                                │
│                                                                      │
│  ┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐  │
│  │    TIMELINE     │    │     CHARTS      │    │  RESULTS CARDS  │  │
│  │  (Konva canvas) │    │   (Recharts)    │    │   (Overview)    │  │
│  │                 │    │                 │    │                 │  │
│  │  ✅ Renders OK  │    │  ✅ Renders OK  │    │  ❌ BROKEN      │  │
│  │  ⚠️  Mock data  │    │  ⚠️  Mock data  │    │  Missing atoms  │  │
│  └────────┬────────┘    └────────┬────────┘    └────────┬────────┘  │
│           │                      │                      │           │
│           ▼                      ▼                      ▼           │
│     combatDataAtom        chart*DataAtoms         (deleted atoms)   │
│     (has transformer)     (NO transformer)        itemCombosAtom    │
│                                                   resultsCardOrder  │
└──────────────────────────────────────────────────────────────────────┘
```

---

## 2. What Needs To Be Done

### Phase 1: Connect Charts to Simulation Data

**Problem:** Charts use hardcoded mock data generators in `atoms/charts/state.ts`

**Files to modify:**
- `src/atoms/charts/state.ts` - Replace mock generators with derived atoms

**Required work:**

```typescript
// Current (MOCK):
export const dpsDataAtom = atom(() => generateDpsData())

// Needed (DERIVED from simulation):
export const dpsDataAtom = atom((get) => {
  const combatData = get(combatDataAtom)
  if (!combatData) return generateDpsData() // fallback
  return transformToDpsChartData(combatData)
})
```

**Create transformers for each chart type:**

| Chart | Source Data | Transformation Needed |
|-------|-------------|----------------------|
| DPS Chart | `combatData.damage[]` | Aggregate damage over time windows, calculate running avg |
| Resource Chart | `combatData.resources[]` | Map focus/mana snapshots to time series |
| Ability Chart | `combatData.casts[]` | Group by spellId, count casts, sum damage |
| Cooldown Chart | `combatData.casts[]` | Filter major CDs, extract timing/duration |
| Detailed Chart | All of above | Combine cumulative damage, DPS, resources |

**New file needed:** `src/atoms/charts/transformers.ts`

---

### Phase 2: Timeline Integration (Partially Done)

**Status:** `simulation-result-tabs.tsx` already calls `transformEventsWithResources()` and sets `combatDataAtom`.

**What's working:**
- `useLoadLocalJob()` hook loads job from storage
- Events are transformed to `CombatData` format
- Timeline reads from `combatDataAtom`

**What's missing:**
- No automatic loading when simulation completes
- Timeline still defaults to mock generator when no job loaded

**Files involved:**
- `src/components/simulate/simulation-result-tabs.tsx:44-60` - Contains load logic
- `src/atoms/timeline/state.ts:15-200` - Mock generator takes precedence

**Fix needed:** Conditional atom that prefers real data over mock:

```typescript
// In atoms/timeline/state.ts
export const combatDataAtom = atom<CombatData | null>(null)
export const effectiveCombatDataAtom = atom((get) => {
  return get(combatDataAtom) ?? generateCombatData() // fallback to mock
})
```

---

### Phase 3: Fix Results Overview Cards

**Status:** 7 cards are broken due to deleted atoms from Refine migration

**Broken files:**
```
src/components/simulate/
├── results-overview.tsx          # References deleted atoms
├── results-combos.tsx            # itemCombosAtom deleted
├── results-equipment.tsx         # charIdAtom issues
└── cards/
    ├── best-dps-card.tsx         # needs simulation result
    ├── baseline-dps-card.tsx     # needs simulation result
    ├── avg-gain-card.tsx         # needs simulation result
    ├── combos-analyzed-card.tsx  # needs combo results
    └── character-equipment-card.tsx # needs character data
```

**Two options:**

#### Option A: Create New Simulation-Based Atoms
Replace the Refine-dependent atoms with simulation-derived ones:

```typescript
// New atoms/simulation/results.ts
export const simulationResultAtom = atom<SimulationResult | null>(null)

export const bestDpsAtom = atom((get) => {
  const result = get(simulationResultAtom)
  return result?.dps ?? 0
})

export const totalDamageAtom = atom((get) => {
  const result = get(simulationResultAtom)
  return result?.totalDamage ?? 0
})
```

#### Option B: Complete Refine Migration
Finish the data provider integration with Supabase. This is marked as "Phase 4/5" in TODOs.

**Recommendation:** Option A for quick wins, Option B for persistence.

---

### Phase 4: End-to-End Data Flow

**Goal:** Simulation complete → Results automatically displayed

**Current flow (broken):**
1. User clicks "Simulate"
2. `useSimulation` runs simulation
3. Result stored in `computingDrawerAtom` (job tracking)
4. User manually navigates to results tab
5. ❌ Overview cards fail to load
6. ⚠️ Timeline loads mock data
7. ⚠️ Charts show mock data

**Target flow:**
1. User clicks "Simulate"
2. `useSimulation` runs simulation
3. Result stored in `simulationResultAtom`
4. `combatDataAtom` derived from result
5. Chart atoms derived from `combatDataAtom`
6. User navigates to results
7. ✅ All components read from same source

---

## 3. Dependencies & Libraries

| Category | Library | Version | Status |
|----------|---------|---------|--------|
| Charts | recharts | 3.5.1 | Working |
| Canvas | konva + react-konva | 10.0.12 / 19.2.1 | Working |
| State | jotai | 2.15.2 | Working |
| Simulation | effect | 3.19.4 | Working |
| Data | @refinedev/core | 5.0.6 | Migration incomplete |
| Export | jspdf | 3.0.4 | Working |

---

## 4. File Reference

### Charts
```
src/components/simulate/results/charts/
├── charts-content.tsx         # Dashboard wrapper with drag reorder
├── chart-card.tsx             # Card template (header/footer)
└── cards/
    ├── dps-chart.tsx          # LineChart - instantaneous + running avg DPS
    ├── resource-chart.tsx     # AreaChart - focus/mana over time
    ├── ability-chart.tsx      # BarChart - cast frequency & damage
    ├── cooldown-chart.tsx     # ScatterChart - CD timing visualization
    └── detailed-chart.tsx     # ComposedChart - multi-metric view

src/atoms/charts/state.ts      # ⚠️ Mock data generators - NEEDS REAL DATA
src/components/ui/chart.tsx    # Recharts wrapper with theme
```

### Timeline
```
src/components/simulate/results/timeline/
├── timeline.tsx               # Main Konva Stage component
├── minimap.tsx                # Overview navigation
├── tracks/
│   ├── casts-track.tsx        # Spell cast events with lanes
│   ├── buffs-track.tsx        # Player buff bars
│   ├── debuffs-track.tsx      # Enemy debuff bars
│   ├── damage-track.tsx       # Damage spike visualization
│   ├── resources-track.tsx    # Focus/mana line graph
│   ├── phases-track.tsx       # Encounter phase blocks
│   ├── grid-layer.tsx         # Background grid
│   └── x-axis.tsx             # Time ruler
└── utils/
    ├── format.ts              # Time/damage formatting
    └── ticks.ts               # Grid line calculation

src/atoms/timeline/state.ts    # Combat data atoms + mock generator
src/hooks/timeline/            # useScales, useTrackLayout, useLaneAssignment
src/hooks/canvas/              # useZoom, useDragPan, useExport
```

### Simulation
```
src/lib/simulation/
├── runner.ts                  # Main simulation loop (Effect-TS)
├── runtime.ts                 # BrowserRuntime creation
├── loader.ts                  # Spell/aura data loading
├── types.ts                   # SimulationResult, SimulationEvent
├── rotations/
│   └── beast-mastery.ts       # BM Hunter rotation
└── transformers/
    ├── index.ts               # transformEventsWithResources()
    └── handlers/              # Event type handlers

src/hooks/use-simulation.ts    # High-level simulation hook
src/atoms/simulation/job.ts    # Job tracking state
```

### Results (Broken)
```
src/components/simulate/
├── simulation-result-tabs.tsx  # Tab container (works)
├── results-overview.tsx        # ❌ Missing atoms
├── results-combos.tsx          # ❌ itemCombosAtom deleted
├── results-equipment.tsx       # ❌ Character data missing
└── cards/*.tsx                 # ❌ All need data source
```

---

## 5. Action Items Checklist

### Must Have (Core Functionality)

- [ ] **Create chart data transformers** - `src/atoms/charts/transformers.ts`
  - [ ] `transformToDpsChartData(combatData)`
  - [ ] `transformToResourceChartData(combatData)`
  - [ ] `transformToAbilityChartData(combatData)`
  - [ ] `transformToCooldownChartData(combatData)`
  - [ ] `transformToDetailedChartData(combatData)`

- [ ] **Update chart atoms** - `src/atoms/charts/state.ts`
  - [ ] Replace mock generators with derived atoms from `combatDataAtom`
  - [ ] Add fallback to mock data when no simulation loaded

- [ ] **Fix timeline data source** - `src/atoms/timeline/state.ts`
  - [ ] Make `combatDataAtom` writable (currently mock only)
  - [ ] Create `effectiveCombatDataAtom` with fallback

- [ ] **Create simulation result atoms** - `src/atoms/simulation/results.ts`
  - [ ] `simulationResultAtom`
  - [ ] `bestDpsAtom`
  - [ ] `totalDamageAtom`
  - [ ] `totalCastsAtom`

- [ ] **Fix results-overview.tsx**
  - [ ] Replace deleted atom references
  - [ ] Wire up to simulation result atoms

### Should Have (Better UX)

- [ ] **Auto-load results** - When simulation completes, automatically populate atoms
- [ ] **Loading states** - Show skeleton while simulation runs
- [ ] **Error boundaries** - Graceful failure for broken components

### Nice to Have (Polish)

- [ ] **Persist results** - Save to Supabase via Refine
- [ ] **Compare runs** - Side-by-side result comparison
- [ ] **Export results** - JSON/CSV export of simulation data

---

## 6. Quick Wins (Start Here)

1. **15 min:** Create `simulationResultAtom` and update `useSimulation` to set it on completion
2. **30 min:** Create chart transformers for DPS and Resource charts
3. **15 min:** Update `dpsDataAtom` and `resourceDataAtom` to derive from `combatDataAtom`
4. **30 min:** Fix `best-dps-card.tsx` and `baseline-dps-card.tsx` to read from new atoms

This gets 2 charts and 2 cards working with real data, proving the architecture.

---

## 7. Technical Notes

### Event Types from Simulation
```typescript
type SimulationEventType =
  | 'SPELL_CAST_START' | 'SPELL_CAST_SUCCESS' | 'SPELL_CAST_FAILED'
  | 'SPELL_DAMAGE' | 'SPELL_PERIODIC_DAMAGE'
  | 'SPELL_AURA_APPLIED' | 'SPELL_AURA_REMOVED' | 'SPELL_AURA_REFRESH'
  | 'SPELL_ENERGIZE' | 'SPELL_DRAIN'
  | 'RESOURCE_SNAPSHOT'  // Custom, emitted every 10 casts
```

### CombatData Structure (Timeline Format)
```typescript
interface CombatData {
  casts: CastEvent[]       // { spellId, name, start, end, damage? }
  buffs: BuffEvent[]       // { spellId, name, start, end, stacks }
  debuffs: BuffEvent[]
  damage: DamageEvent[]    // { time, spellId, amount, isCrit }
  resources: ResourceEvent[] // { time, current, max }
  phases: PhaseEvent[]     // { name, start, end }
}
```

### Chart Data Structures
```typescript
// DPS Chart
{ time: number, instantaneous: number, running_avg: number }[]

// Resource Chart
{ time: number, current: number, spent: number }[]

// Ability Chart
{ name: string, casts: number, damage: number, color: string }[]

// Cooldown Chart
{ time: number, name: string, duration: number }[]

// Detailed Chart
{ time: number, cumulativeDamage: number, dps: number, resource: number }[]
```

---

*Generated: 2025-12-23*
