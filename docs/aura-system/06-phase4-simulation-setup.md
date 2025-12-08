# Phase 4: Simulation Setup

## Goal

Integrate aura data loading into simulation initialization, ensuring all required `AuraDataFlat` is available before the simulation runs.

## Prerequisites

- Phase 1-3 complete
- Understanding of existing simulation setup flow

## Architecture

```
ProfileComposer.compose()
    ↓
Collect spell IDs from rotation actions
    ↓
Batch load: transformAura(spellId) for each
    ↓
SimulationConfig { auras: Map<SpellID, AuraDataFlat> }
    ↓
Pass config to SimDriver
```

## Tasks

### 1. Collect Aura Spell IDs from Rotation

During profile composition, extract all spell IDs that may apply auras:

```typescript
const collectAuraSpellIds = (rotation: Rotation): Set<number> => {
  const spellIds = new Set<number>();

  for (const action of rotation.actions) {
    if (action._tag === "CastSpell") {
      spellIds.add(action.spellId);
    }
  }

  return spellIds;
};
```

### 2. Batch Load Aura Data

```typescript
const loadAuraData = (
  spellIds: Set<number>,
): Effect.Effect<
  Map<Branded.SpellID, Aura.AuraDataFlat>,
  DbcError,
  DbcService | ExtractorService
> =>
  Effect.gen(function* () {
    const auras = new Map<Branded.SpellID, Aura.AuraDataFlat>();

    for (const spellId of spellIds) {
      const result = yield* transformAura(spellId).pipe(
        Effect.catchAll(() => Effect.succeed(null)),
      );

      if (result) {
        auras.set(result.spellId, result);
      }
    }

    return auras;
  });
```

### 3. Add to SimulationConfig

```typescript
interface SimulationConfig {
  readonly auras: Map<Branded.SpellID, Aura.AuraDataFlat>;
  readonly spells: Map<Branded.SpellID, Spell.SpellDataFlat>;
  readonly items: Map<Branded.ItemID, Item.ItemDataFlat>;
  // ...
}
```

### 4. Update ProfileComposer

```typescript
export const compose = (profile: Profile) =>
  Effect.gen(function* () {
    const spellIds = collectAuraSpellIds(profile.rotation);
    const auras = yield* loadAuraData(spellIds);

    return {
      auras,
      // ... other config
    };
  });
```

### 5. Pass Config to Handlers

The `SimDriver` passes `SimulationConfig` to handlers via the registry or direct injection:

```typescript
// Option A: Include in handler context
const handleEvent = (event: CombatLogEvent, config: SimulationConfig) => {
  switch (event._tag) {
    case "SPELL_AURA_APPLIED":
      return applyAura(event, emitter, config);
    // ...
  }
};

// Option B: Include in Effect context
const SimulationConfigService = Context.Tag<SimulationConfig>();
```

## Verification

1. Load a profile with DoT spells
2. Verify `config.auras` contains entries for each spell
3. Run simulation, verify handlers receive aura data
4. Check periodic ticks fire correctly

## Complete Flow

```
1. User creates Profile with Rotation
2. ProfileComposer.compose() extracts spell IDs
3. transformAura() called for each spell
4. AuraDataFlat stored in SimulationConfig.auras
5. SimDriver starts, passes config to handlers
6. Handler reads aura data from config.auras.get(spellId)
7. Handler updates GameState.units[].auras
8. Handler schedules removal/tick events
9. Events fire, handlers check stale via expiresAt
```

## Notes

- Aura data is immutable after loading
- Missing aura data falls back to sensible defaults (0 duration = permanent)
- The transformer only runs once per spell during setup
