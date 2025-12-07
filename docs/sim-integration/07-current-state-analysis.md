# Current State Analysis

> Quick reference of what exists and what's missing.

## Runner Event Collection

**File**: `apps/portal/src/lib/simulation/runner.ts`

### Current Filter (line 23-27)

```typescript
const EVENT_STREAM_FILTER = [
  "SPELL_CAST_SUCCESS",
  "SPELL_DAMAGE",
  "SPELL_AURA_APPLIED",
] as const;
```

### Missing Events

| Event                     | Why Needed           |
| ------------------------- | -------------------- |
| `SPELL_AURA_REMOVED`      | Know when buffs end  |
| `SPELL_AURA_REFRESH`      | Track buff refreshes |
| `SPELL_AURA_APPLIED_DOSE` | Buff stacks          |
| `SPELL_PERIODIC_DAMAGE`   | DoT damage           |
| `SPELL_ENERGIZE`          | Resource gains       |
| `SPELL_CAST_START`        | Cast bars            |

### Recommended Filter

```typescript
const EVENT_STREAM_FILTER = [
  // Casts
  "SPELL_CAST_START",
  "SPELL_CAST_SUCCESS",

  // Damage
  "SPELL_DAMAGE",
  "SPELL_PERIODIC_DAMAGE",

  // Auras
  "SPELL_AURA_APPLIED",
  "SPELL_AURA_REMOVED",
  "SPELL_AURA_REFRESH",
  "SPELL_AURA_APPLIED_DOSE",
  "SPELL_AURA_REMOVED_DOSE",

  // Resources
  "SPELL_ENERGIZE",
] as const;
```

## Event Structure

Events use `_tag` discriminator, NOT `type`:

```typescript
// Correct
if (event._tag === "SPELL_DAMAGE") { ... }

// Wrong (current code does this)
if (event.type === "damage") { ... }
```

### SPELL_DAMAGE Fields

```typescript
{
  _tag: "SPELL_DAMAGE",
  timestamp: 1234,           // number (ms or seconds depending on context)
  spellId: 34026,
  spellName: "Kill Command",
  amount: 50000,
  school: 1,                 // 1=Physical
  critical: true,
  destName: "Target Dummy",
  destGUID: "...",
  sourceGUID: "...",
  sourceName: "Player",
}
```

### SPELL_AURA_APPLIED Fields

```typescript
{
  _tag: "SPELL_AURA_APPLIED",
  timestamp: 1234,
  spellId: 19574,
  spellName: "Bestial Wrath",
  auraType: "BUFF",          // or "DEBUFF"
  destName: "Player",
  destGUID: "...",
}
```

## Timeline Expectation

The timeline reads from `combatDataAtom`:

```typescript
// atoms/timeline/state.ts line 621
export const combatDataAtom = atom<CombatData>(generateCombatData());
```

Currently initialized with **mock data**. Needs to be set with real sim data.

## Current Transformation (Broken)

**File**: `components/simulate/simulation-result-tabs.tsx`

```typescript
// This doesn't work - events have _tag not type
if (evt.type === "cast") { ... }
```

Should be:

```typescript
if (evt._tag === "SPELL_CAST_SUCCESS") { ... }
```

## Quick Fix Checklist

1. [ ] Update `EVENT_STREAM_FILTER` in runner.ts
2. [ ] Fix transformation to use `_tag` not `type`
3. [ ] Convert timestamps: `timestamp / 1000` for seconds
4. [ ] Pair aura applied/removed events
5. [ ] Add fallback for unknown spells in SPELLS map

## File Locations

| What            | Where                                                            |
| --------------- | ---------------------------------------------------------------- |
| Runner          | `apps/portal/src/lib/simulation/runner.ts`                       |
| Transform       | `apps/portal/src/components/simulate/simulation-result-tabs.tsx` |
| Timeline atoms  | `apps/portal/src/atoms/timeline/state.ts`                        |
| CombatLog types | `packages/wowlab-core/src/internal/schemas/combat-log/`          |
| Spell info      | `atoms/timeline/state.ts` → `SPELLS` constant                    |
