# Implementation Plan: Events → Timeline

> Step-by-step plan to get simulation events displaying on the timeline.

## Current State

| Component          | Status     | Notes                                       |
| ------------------ | ---------- | ------------------------------------------- |
| Simulation runner  | ✅ Working | Executes rotation, emits events             |
| Event collection   | ⚠️ Partial | Collects events but wrong format            |
| Event transformer  | ❌ Missing | Need to convert CombatLogEvent → CombatData |
| Timeline component | ✅ Working | Renders from combatDataAtom                 |
| Local job storage  | ✅ Working | Jobs stored in jobsAtom with results        |

## The Problem

```
CombatLogEvent[]          →  ???  →          CombatData
(from simulation)                            (for timeline)

{                                            {
  _tag: "SPELL_DAMAGE",                        type: "damage",
  timestamp: 1234,        // MS                timestamp: 1.234,  // SEC
  spellId: 34026,                              spellId: 34026,
  amount: 50000,                               amount: 50000,
  critical: true,                              isCrit: true,
  destName: "Target",                          target: "Target",
}                                            }
```

## Implementation Tasks

### Task 1: Check Current Event Output

First, understand what events the runner actually produces.

**File**: `apps/portal/src/lib/simulation/runner.ts`

```typescript
// Add debug logging
console.log("Events collected:", events.length);
console.log("Event types:", [...new Set(events.map((e) => e._tag))]);
console.log("Sample event:", events[0]);
```

### Task 2: Create Event Transformer

**File**: `apps/portal/src/lib/simulation/transform-events.ts`

```typescript
import type { CombatData } from "@/atoms/timeline";

// Import the actual CombatLogEvent type from the simulation
type SimEvent = {
  _tag: string;
  timestamp: number;
  spellId?: number;
  spellName?: string;
  amount?: number;
  critical?: boolean;
  destName?: string;
  destGUID?: string;
  auraType?: string;
  // ... other fields
};

export function transformSimEvents(
  events: SimEvent[],
  durationMs: number,
): CombatData {
  // Implementation from 05-event-collection.md
}
```

### Task 3: Update SimulationJob Type

**File**: `apps/portal/src/atoms/computing/state.ts`

The current result type stores raw events. Keep it but ensure typing:

```typescript
export interface SimulationJob {
  // ... existing fields
  result: {
    dps: number;
    totalDamage: number;
    durationMs: number;
    events: unknown[]; // CombatLogEvent[] - kept as unknown for storage
    casts: number;
  } | null;
}
```

### Task 4: Update Results Page Integration

**File**: `apps/portal/src/components/simulate/simulation-result-tabs.tsx`

Replace naive transformation with proper transformer:

```typescript
import { transformSimEvents } from "@/lib/simulation/transform-events";

function useLoadLocalJob() {
  // ...existing code...

  useEffect(() => {
    if (!job?.result?.events) return;

    const combatData = transformSimEvents(
      job.result.events as SimEvent[],
      job.result.durationMs,
    );

    setCombatData(combatData);
    setBounds({ min: 0, max: job.result.durationMs / 1000 });
  }, [job, setCombatData, setBounds]);
}
```

### Task 5: Add Missing Spell Info

**File**: `apps/portal/src/atoms/timeline/state.ts`

The `SPELLS` constant needs entries for all spells used:

```typescript
export const SPELLS: Record<number, SpellInfo> = {
  // Existing spells...
  // Add any missing BM Hunter spells
  // Check runner output for spellIds not in this list
};
```

### Task 6: Resource Tracking

**Option A**: Emit resource snapshots from runner

**File**: `apps/portal/src/lib/simulation/runner.ts`

```typescript
// After each rotation tick, snapshot resources
const playerState = yield * stateService.getUnit(playerId);
events.push({
  _tag: "RESOURCE_SNAPSHOT",
  timestamp: currentTime,
  focus: playerState.power.get("FOCUS")?.current ?? 0,
  maxFocus: playerState.power.get("FOCUS")?.max ?? 120,
});
```

**Option B**: Calculate from events in transformer (see doc 05)

## File Changes Summary

| File                                             | Change                            |
| ------------------------------------------------ | --------------------------------- |
| `lib/simulation/transform-events.ts`             | **NEW** - Event transformer       |
| `lib/simulation/runner.ts`                       | Add resource snapshots (optional) |
| `atoms/timeline/state.ts`                        | Add missing spell info            |
| `components/simulate/simulation-result-tabs.tsx` | Use transformer                   |

## Verification Steps

1. Run a simulation
2. Open computing drawer → click "View Results"
3. Check timeline shows:
   - [ ] Cast track with spell icons
   - [ ] Damage track with bars
   - [ ] Buff track with duration bars
   - [ ] Resource track with focus line
4. Verify data matches simulation output

## Known Issues to Handle

### Issue 1: Missing Spell Info

If a spell isn't in `SPELLS`, the timeline shows nothing.

**Solution**: Add fallback for unknown spells:

```typescript
export function getSpell(spellId: number): SpellInfo {
  return (
    SPELLS[spellId] ?? {
      id: spellId,
      name: `Spell ${spellId}`,
      icon: "inv_misc_questionmark",
      school: "physical",
      color: "#888888",
    }
  );
}
```

### Issue 2: Aura Pairing

`SPELL_AURA_APPLIED` and `SPELL_AURA_REMOVED` need to be paired.

**Solution**: Track active auras in a Map, close on removal or fight end.

### Issue 3: Periodic Damage

DoTs tick multiple times - each tick is a separate damage event.

**Solution**: Keep all ticks, timeline aggregates by time bucket anyway.

### Issue 4: Pet Damage

Pet abilities have different source (pet GUID, not player).

**Solution**: Filter by `sourceGUID` to separate player/pet damage if needed.

## Stretch Goals

- [ ] Cast duration (track CAST_START → CAST_SUCCESS)
- [ ] Buff stacks visualization
- [ ] Pet damage separate track
- [ ] Phase markers from encounter events
- [ ] Cooldown usage overlay

## Estimated Effort

| Task                         | Time          |
| ---------------------------- | ------------- |
| Task 1: Debug current output | 15 min        |
| Task 2: Create transformer   | 1-2 hours     |
| Task 3: Update types         | 15 min        |
| Task 4: Wire up results page | 30 min        |
| Task 5: Add spell info       | 30 min        |
| Task 6: Resource tracking    | 1 hour        |
| **Total**                    | **3-4 hours** |

## Next: Start Implementation

1. Run `pnpm dev` in portal
2. Run a simulation, check console for event output
3. Create transformer based on actual event structure
4. Wire it up and iterate
