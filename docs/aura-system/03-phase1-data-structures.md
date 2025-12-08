# Phase 1: Data Structures

Goal: define the flat aura config and runtime aura shape, matching the Event Queue–driven timing model from `docs/wowlab/00-data-flow.md`.

Prereqs: 00-overview.md, 02-reference-spell-data.md

## Architecture

- `AuraDataFlat` (static config) lives in wowlab-core, mirrors SpellDataFlat/ItemDataFlat.
- Runtime `Aura` entity lives in `GameState` and stores CLEU-visible fields only (no timing).

## Tasks

1. **Create AuraDataFlat schema** in `packages/wowlab-core/src/internal/schemas/Aura.ts`:
   - Fields: `spellId`, `baseDurationMs`, `maxDurationMs`, `maxStacks`, `periodicType|null`, `tickPeriodMs`, `refreshBehavior`, `durationHasted`, `hastedTicks`, `pandemicRefresh`, `rollingPeriodic`, `tickMayCrit`, `tickOnApplication`.
   - Keep `AuraSchema` minimal: `casterUnitId`, `spellId`, `stacks`.

2. **Add spell attribute constants** in `packages/wowlab-core/src/internal/constants/SpellAttributes.ts` for the attributes listed in 02-reference-spell-data.md, plus `hasSpellAttribute()` helper.

3. **Export** the new types/constants from wowlab-core indexes so downstream phases can import them.

## Verification

Run `pnpm build` after adding schemas/exports.

Next: Phase 2 (04-phase2-transformer.md).
