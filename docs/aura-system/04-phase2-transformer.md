# Phase 2: Aura Transformer

Goal: build `transformAura(spellId)` to produce `AuraDataFlat` from DBC tables, matching the mapping in 02-reference-spell-data.md.

Prereqs: Phase 1 complete; understand existing transformer pattern in `packages/wowlab-services/src/internal/data/transformer/`.

## Data Path

```
spellId → DbcService (spell_misc, spell_duration, spell_effect, spell_aura_options)
       → ExtractorService helpers
       → AuraDataFlat
```

## Field Mapping (authoritative)

| AuraDataFlat      | Source                                |
| ----------------- | ------------------------------------- |
| spellId           | input                                 |
| baseDurationMs    | spell_duration.Duration (via misc)    |
| maxDurationMs     | spell_duration.MaxDuration            |
| maxStacks         | spell_aura_options.CumulativeAura (0→1)|
| tickPeriodMs      | spell_effect.EffectAuraPeriod (periodic only) |
| periodicType      | spell_effect.EffectAura mapped to type |
| refreshBehavior   | derived: `pandemic` if pandemic flag or periodic, else `duration` |
| durationHasted    | Attributes_8 bit 17 (273)             |
| hastedTicks       | Attributes_5 bit 13 (173)             |
| pandemicRefresh   | Attributes_13 bit 20 (436)            |
| rollingPeriodic   | Attributes_10 bit 14 (334)            |
| tickMayCrit       | Attributes_8 bit 9 (265)              |
| tickOnApplication | Attributes_5 bit 9 (169)              |

## Tasks

1) **Extractor additions** (`extractors.ts`):
   - `extractAuraFlags(misc)` returning the flag booleans above.
   - `extractPeriodicInfo(effects)` returning `{ periodicType | null, tickPeriodMs }` using periodic EffectAura set {3,53,64,8,20,23,24}.

2) **determineRefreshBehavior** helper: pandemic flag or any periodic tickPeriodMs>0 ⇒ `pandemic`; else `duration`.

3) **transformAura(spellId)** (`aura.ts`):
   - Validate spell exists (SpellInfoNotFound on miss).
   - Fetch misc, effects, auraOptions, duration via extractors.
   - Build `AuraDataFlat` with default maxStacks=1 when 0 and default durations 0 when missing.

4) **Export** from transformer index.

## Verification

- Unit-test with a periodic spell: expect periodicType set, pandemic refreshBehavior.
- Non-periodic buff: periodicType null, refreshBehavior `duration`.

Next: Phase 3 (05-phase3-handler-integration.md).
