# DBC Service Refactor - Phase Prompts

Copy-paste these prompts to execute each phase. After completing a phase, update the progress tracker in `docs/architecture/dbc-service-refactor.md`.

---

## Phase 0: Cleanup

```
Execute Phase 0 of the DBC Service refactor from @docs/architecture/dbc-service-refactor.md

Tasks:
1. Delete these CLI command files:
   - apps/cli/commands/update-spell-data/index.ts (and directory)
   - apps/cli/commands/update-item-data/index.ts (and directory)
   - apps/cli/commands/shared/data-updater.ts

2. Update apps/cli/commands/index.ts to remove imports and exports for updateItemDataCommand and updateSpellDataCommand

3. Drop the old Supabase tables using the MCP tool:
   - DROP TABLE IF EXISTS public.spell_data CASCADE;
   - DROP TABLE IF EXISTS public.item_data CASCADE;

4. Check and update Portal files that reference spell_data/item_data:
   - apps/portal/src/lib/supabase-metadata-service.ts
   - apps/portal/src/atoms/spell-data/state.ts
   - apps/portal/src/atoms/item-data/state.ts
   - apps/portal/src/lib/spell-formatters.ts
   - Regenerate database.types.ts if needed

5. Run `pnpm build` to verify no build errors

6. Update the progress tracker in dbc-service-refactor.md - mark Phase 0 as complete
```

---

## Phase 1: DbcService Interface

```
Execute Phase 1 of the DBC Service refactor from @docs/architecture/dbc-service-refactor.md

Tasks:
1. Create directory: packages/wowlab-services/src/internal/data/dbc/

2. Create packages/wowlab-services/src/internal/data/dbc/errors.ts with:
   - DbcQueryError tagged error class
   - DbcError type alias

3. Create packages/wowlab-services/src/internal/data/dbc/DbcService.ts with:
   - DbcServiceInterface with all method signatures from the plan
   - DbcService Context.Tag

4. Create packages/wowlab-services/src/internal/data/dbc/index.ts barrel export

5. Update packages/wowlab-services/src/internal/data/index.ts to export from ./dbc

6. Run `pnpm build` to verify no build errors

7. Update the progress tracker in dbc-service-refactor.md - mark Phase 1 as complete
```

---

## Phase 2: InMemoryDbcService

```
Execute Phase 2 of the DBC Service refactor from @docs/architecture/dbc-service-refactor.md

Tasks:
1. Create packages/wowlab-services/src/internal/data/dbc/InMemoryDbcService.ts implementing:
   - All spell table methods (getSpellEffects, getSpellMisc, etc.)
   - All lookup table methods (getDifficulty, getSpellCastTimes, etc.)
   - All item table methods (getItem, getItemSparse, etc.)
   - Damage calculation support methods (getExpectedStats, etc.)
   - getDifficultyChain batch method
   - Use DbcCache internally, wrap all returns in Effect.succeed/Effect.sync

2. Export InMemoryDbcService from packages/wowlab-services/src/internal/data/dbc/index.ts

3. Run `pnpm build` to verify no build errors

4. Update the progress tracker in dbc-service-refactor.md - mark Phase 2 as complete
```

---

## Phase 3: Rewrite Extractors

```
Execute Phase 3 of the DBC Service refactor from @docs/architecture/dbc-service-refactor.md

Tasks:
1. Rewrite packages/wowlab-services/src/internal/data/transformer/extractors.ts:
   - Remove all `cache: DbcCache` parameters
   - Convert each function to return Effect.Effect<T, DbcError, DbcService>
   - Use `yield* DbcService` to access the service
   - Replace `cache.xxx.get(id)` with `yield* dbc.getXxx(id)`

2. Functions to convert (all 16):
   - extractRange
   - extractRadius
   - extractCooldown
   - extractInterrupts
   - extractEmpower
   - extractCastTime
   - extractDuration
   - extractCharges
   - extractName
   - extractDescription
   - extractPower
   - extractClassOptions
   - getEffectsForDifficulty
   - hasAoeDamageEffect
   - getVarianceForDifficulty
   - getDamage

3. Note: extractScaling and extractManaCost don't use cache, keep them as-is

4. Run `pnpm build` - expect errors in spell.ts and item.ts (fixed in Phase 4)

5. Update the progress tracker in dbc-service-refactor.md - mark Phase 3 as complete
```

---

## Phase 4: Rewrite Transformers

```
Execute Phase 4 of the DBC Service refactor from @docs/architecture/dbc-service-refactor.md

Tasks:
1. Rewrite packages/wowlab-services/src/internal/data/transformer/spell.ts:
   - Remove cache: DbcCache parameter from transformSpell
   - Change return type to Effect.Effect<SpellDataFlat, SpellInfoNotFound, DbcService>
   - Use `yield* DbcService` to access the service
   - Call extractors without cache parameter (they now return Effects)
   - Use Effect.all for parallel fetches

2. Rewrite packages/wowlab-services/src/internal/data/transformer/item.ts:
   - Remove cache: DbcCache parameter from transformItem
   - Change return type to Effect.Effect<ItemDataFlat, ItemNotFound, DbcService>
   - Same pattern as spell.ts

3. Run `pnpm build` - expect errors in call sites (fixed in Phase 5)

4. Update the progress tracker in dbc-service-refactor.md - mark Phase 4 as complete
```

---

## Phase 5: Update Call Sites

```
Execute Phase 5 of the DBC Service refactor from @docs/architecture/dbc-service-refactor.md

Tasks:
1. Find all call sites of transformSpell and transformItem:
   - apps/cli/commands/generate-spells/
   - Any other files using these functions

2. Update each call site to:
   - Import InMemoryDbcService
   - Create the layer: `const dbcLayer = InMemoryDbcService(cache)`
   - Provide the layer: `transformSpell(id).pipe(Effect.provide(dbcLayer))`

3. Update @wowlab/services/Data exports if needed

4. Run `pnpm build` to verify no build errors

5. Test CLI commands that use transformers still work

6. Update the progress tracker in dbc-service-refactor.md - mark Phase 5 as complete
```

---

## Phase 6: Create raw_dbc Schema

```
Execute Phase 6 of the DBC Service refactor from @docs/architecture/dbc-service-refactor.md

Tasks:
1. Create Supabase migration with:
   - CREATE SCHEMA IF NOT EXISTS raw_dbc
   - All DBC tables (spell_effect, spell_misc, spell_cooldowns, etc.)
   - All item tables (item, item_sparse, item_effect, etc.)
   - Lookup tables (difficulty, spell_cast_times, etc.)
   - Expected stat tables for damage calculation

2. Add indexes:
   - idx_spell_effect_spell_id ON raw_dbc.spell_effect ("SpellID")
   - idx_spell_effect_spell_difficulty ON raw_dbc.spell_effect ("SpellID", "DifficultyID")
   - Similar indexes for all tables with foreign key lookups

3. Create get_difficulty_chain function

4. Create CLI command apps/cli/commands/upload-dbc/index.ts to:
   - Load raw DBC data from CSV
   - Upload to raw_dbc schema tables
   - Replace the old update-spell-data/update-item-data commands

5. Run the upload command to populate Supabase

6. Update the progress tracker in dbc-service-refactor.md - mark Phase 6 as complete
```

---

## Phase 7: SupabaseDbcService

```
Execute Phase 7 of the DBC Service refactor from @docs/architecture/dbc-service-refactor.md

Tasks:
1. Create packages/wowlab-services/src/internal/data/dbc/SupabaseDbcService.ts:
   - Accept SupabaseClient in constructor
   - Use Layer.effect to create caches during layer construction
   - Implement all DbcServiceInterface methods
   - Use Effect.Cache for frequently accessed data (5 min TTL)
   - Call raw_dbc schema tables
   - Use supabase.rpc for getDifficultyChain

2. Export SupabaseDbcService from index.ts

3. Run `pnpm build` to verify no build errors

4. Update the progress tracker in dbc-service-refactor.md - mark Phase 7 as complete
```

---

## Phase 8: Wire Portal

```
Execute Phase 8 of the DBC Service refactor from @docs/architecture/dbc-service-refactor.md

Tasks:
1. Create apps/portal/src/lib/services/dbc-layer.ts:
   - Export createPortalDbcLayer function
   - Use SupabaseDbcService with Supabase client

2. Update Portal components that need spell/item data:
   - Replace direct Supabase queries with DbcService usage
   - Provide the layer where Effects are run

3. Regenerate database types to include raw_dbc schema

4. Test Portal functionality:
   - Spell lookups
   - Item lookups
   - Any other DBC-dependent features

5. Run `pnpm build` to verify no build errors

6. Update the progress tracker in dbc-service-refactor.md - mark Phase 8 as complete

7. Celebrate! The refactor is complete.
```

---

## After Each Phase

After completing each phase:

1. Update the progress tracker in `docs/architecture/dbc-service-refactor.md`:
   ```
   | Phase | Status | Description |
   |-------|--------|-------------|
   | X | [done] | ... |
   ```

2. Commit the changes with a descriptive message:
   ```
   git add -A && git commit -m "feat(dbc): Phase X - <description>"
   ```
