# Phase 5: Simulation Setup

Goal: load AuraDataFlat for all relevant spells before the sim starts and pass it into handlers via `SimulationConfig`.

Prereqs: Phases 1-4; familiarity with existing ProfileComposer/SimDriver pipeline.

## Flow

```
ProfileComposer.compose()
  → collect spellIds from rotation actions
  → batch transformAura(spellId) for each
  → SimulationConfig { auras: Map<SpellID, AuraDataFlat>, spells, items, ... }
  → SimDriver/handlers receive config
```

## Tasks

1. **Collect aura spellIds** from rotation (CastSpell actions, etc.).
2. **Batch load aura data** with `transformAura` inside an Effect loop; skip missing spells gracefully.
3. **Extend SimulationConfig** to include `auras: Map<SpellID, AuraDataFlat>`.
4. **Pass config to handlers** (via registry context or explicit param) so state handlers can read `config.auras.get(spellId)`.

## Verification

- Profile containing a DoT spell yields an entry in `config.auras` with periodic data.
- Handlers receive `config` and successfully schedule removals/ticks using it.
- Missing DBC rows do not crash setup; they simply omit the aura entry.

End of phase sequence.
