# WoWLab Aura System Implementation

This directory contains the implementation plan for a proper aura/buff system in WoWLab, based on analysis of SimulationCraft's approach.

## Document Structure

| Phase | Document                                 | Description                                           |
| ----- | ---------------------------------------- | ----------------------------------------------------- |
| 0     | `00-overview.md`                         | This file - overview and context                      |
| 1     | `01-reference-simc-behaviors.md`         | SimC aura behaviors reference (read-only)             |
| 2     | `02-reference-spell-data.md`             | Spell data sources and attribute bitmasks (read-only) |
| 3     | `03-phase1-data-structures.md`           | Implement core data structures                        |
| 4     | `04-phase2-aura-definition-service.md`   | Implement spell data loading                          |
| 5     | `05-phase3-scheduler-and-generations.md` | Implement generation-based scheduling                 |
| 6     | `06-phase4-handler-integration.md`       | Integrate with existing handlers                      |
| 7     | `07-phase5-periodic-ticks.md`            | Implement periodic tick scheduling                    |

## The Core Problem

WoWLab emits native CLEU events (SPELL_AURA_APPLIED, SPELL_AURA_REMOVED, etc.) and uses a TinyQueue priority queue that **doesn't support cancellation**.

When we apply an aura:

1. We schedule `SPELL_AURA_REMOVED` at `currentTime + duration`
2. If `SPELL_AURA_REFRESH` happens before expiry, the old removal is still queued
3. We need to "cancel" the old removal without actually removing it from the queue

## The Solution: Generation-Based Validity Checking

Instead of cancelling events, we check if they're still valid when they fire:

```
SPELL_AURA_APPLIED:
  schedule.removalGeneration++
  schedule.removalAt = currentTime + duration
  emitAt(duration, { ...SPELL_AURA_REMOVED, generation: schedule.removalGeneration })

SPELL_AURA_REFRESH:
  schedule.removalGeneration++  // Invalidates old scheduled removal
  newDuration = calculateRefreshDuration(...)
  emitAt(newDuration, { ...SPELL_AURA_REMOVED, generation: schedule.removalGeneration })

SPELL_AURA_REMOVED handler:
  if (event.generation !== schedule.removalGeneration) return  // Stale, ignore
  // Actually remove the aura
```

## Key Constraints

1. **Must emit proper CLEU events** - No custom event types
2. **Must use Effect-TS patterns** - No async/await
3. **Must use spell data from database** - Not hardcoded durations
4. **Must handle all refresh behaviors** - Pandemic, extend, tick carryover, etc.
5. **Must be deterministic** - Same inputs = same outputs

## Current Architecture

- `packages/wowlab-services/src/internal/combat-log/EventQueue.ts` - TinyQueue wrapper
- `packages/wowlab-services/src/internal/combat-log/Emitter.ts` - Event emission
- `packages/wowlab-services/src/internal/combat-log/handlers/aura.ts` - Current aura handlers
- `packages/wowlab-core/src/internal/entities/Unit.ts` - Unit with auras collection
- `packages/wowlab-core/src/internal/entities/Aura.ts` - Aura entity

## Dependencies

- Effect-TS for all logic
- Immutable.js for state
- TinyQueue for event scheduling
- MCP server for spell data access
