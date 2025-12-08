# Phase 2: Aura Transformer and Service

## Goal

Create a transformer that extracts `AuraDataFlat` from DBC tables, following the existing `transformSpell` / `transformItem` pattern.

## Prerequisites

- Phase 1 complete (`AuraDataFlat` schema and constants exist)
- Understand the existing transformer pattern in `packages/wowlab-services/src/internal/data/transformer/`

## Architecture

Following the established pattern:

```
transformAura(spellId)
    ↓
DbcService (spell_misc, spell_duration, spell_effect, spell_aura_options)
    ↓
AuraDataFlat
    ↓
MetadataService cache (optional, for batch loading)
```

## DBC Table Mapping

| AuraDataFlat Field  | Source Table         | Source Column(s)                    |
| ------------------- | -------------------- | ----------------------------------- |
| `spellId`           | input                | -                                   |
| `baseDurationMs`    | `spell_duration`     | `Duration` (via misc.DurationIndex) |
| `maxDurationMs`     | `spell_duration`     | `MaxDuration`                       |
| `maxStacks`         | `spell_aura_options` | `CumulativeAura` (default 1)        |
| `tickPeriodMs`      | `spell_effect`       | `EffectAuraPeriod` (where periodic) |
| `periodicType`      | `spell_effect`       | `EffectAura` (mapped to type)       |
| `refreshBehavior`   | derived              | from attributes + periodic status   |
| `pandemicRefresh`   | `spell_misc`         | `Attributes_13` bit 20 (attr 436)   |
| `hastedTicks`       | `spell_misc`         | `Attributes_5` bit 13 (attr 173)    |
| `tickOnApplication` | `spell_misc`         | `Attributes_5` bit 9 (attr 169)     |
| `durationHasted`    | `spell_misc`         | `Attributes_8` bit 17 (attr 273)    |
| `rollingPeriodic`   | `spell_misc`         | `Attributes_10` bit 14 (attr 334)   |
| `tickMayCrit`       | `spell_misc`         | `Attributes_8` bit 9 (attr 265)     |

## Tasks

### 1. Add Aura Extractor Functions

**File:** `packages/wowlab-services/src/internal/data/transformer/extractors.ts`

Add to the existing ExtractorService:

```typescript
import {
  SX_REFRESH_EXTENDS_DURATION,
  SX_DOT_HASTED,
  SX_TICK_ON_APPLICATION,
  SX_DURATION_HASTED,
  SX_ROLLING_PERIODIC,
  SX_TICK_MAY_CRIT,
  hasSpellAttribute,
} from "@wowlab/core/constants/SpellAttributes";

// Aura type constants
const PERIODIC_DAMAGE_AURAS = [3, 53, 64]; // A_PERIODIC_DAMAGE, A_PERIODIC_LEECH, A_PERIODIC_MANA_LEECH
const PERIODIC_HEAL_AURAS = [8, 20]; // A_PERIODIC_HEAL, A_PERIODIC_HEAL_PCT
const PERIODIC_TRIGGER_AURAS = [23]; // A_PERIODIC_TRIGGER_SPELL
const PERIODIC_ENERGIZE_AURAS = [24]; // A_PERIODIC_ENERGIZE

const ALL_PERIODIC_AURAS = [
  ...PERIODIC_DAMAGE_AURAS,
  ...PERIODIC_HEAL_AURAS,
  ...PERIODIC_TRIGGER_AURAS,
  ...PERIODIC_ENERGIZE_AURAS,
];

// Add to ExtractorService interface:
extractAuraFlags: (
  misc: Option.Option<SpellMiscRow>,
) => Effect.Effect<{
  pandemicRefresh: boolean;
  hastedTicks: boolean;
  tickOnApplication: boolean;
  durationHasted: boolean;
  rollingPeriodic: boolean;
  tickMayCrit: boolean;
}, never, never>;

extractPeriodicInfo: (
  effects: readonly SpellEffectRow[],
) => Effect.Effect<{
  tickPeriodMs: number;
  periodicType: "damage" | "heal" | "trigger" | "energize" | null;
}, never, never>;

// Implementation:
extractAuraFlags: (misc) =>
  Effect.succeed(
    pipe(
      misc,
      Option.map((m) => {
        const attrs: Record<string, number> = {};
        for (let i = 0; i <= 15; i++) {
          attrs[`Attributes_${i}`] = (m as any)[`Attributes_${i}`] ?? 0;
        }
        return {
          pandemicRefresh: hasSpellAttribute(attrs, SX_REFRESH_EXTENDS_DURATION),
          hastedTicks: hasSpellAttribute(attrs, SX_DOT_HASTED),
          tickOnApplication: hasSpellAttribute(attrs, SX_TICK_ON_APPLICATION),
          durationHasted: hasSpellAttribute(attrs, SX_DURATION_HASTED),
          rollingPeriodic: hasSpellAttribute(attrs, SX_ROLLING_PERIODIC),
          tickMayCrit: hasSpellAttribute(attrs, SX_TICK_MAY_CRIT),
        };
      }),
      Option.getOrElse(() => ({
        pandemicRefresh: false,
        hastedTicks: false,
        tickOnApplication: false,
        durationHasted: false,
        rollingPeriodic: false,
        tickMayCrit: false,
      })),
    ),
  ),

extractPeriodicInfo: (effects) =>
  Effect.succeed(() => {
    const periodicEffect = effects.find((e) =>
      ALL_PERIODIC_AURAS.includes(e.EffectAura),
    );

    if (!periodicEffect) {
      return { tickPeriodMs: 0, periodicType: null };
    }

    let periodicType: "damage" | "heal" | "trigger" | "energize" | null = null;
    if (PERIODIC_DAMAGE_AURAS.includes(periodicEffect.EffectAura)) {
      periodicType = "damage";
    } else if (PERIODIC_HEAL_AURAS.includes(periodicEffect.EffectAura)) {
      periodicType = "heal";
    } else if (PERIODIC_TRIGGER_AURAS.includes(periodicEffect.EffectAura)) {
      periodicType = "trigger";
    } else if (PERIODIC_ENERGIZE_AURAS.includes(periodicEffect.EffectAura)) {
      periodicType = "energize";
    }

    return {
      tickPeriodMs: periodicEffect.EffectAuraPeriod,
      periodicType,
    };
  }),
```

### 2. Create Aura Transformer

**File:** `packages/wowlab-services/src/internal/data/transformer/aura.ts`

```typescript
import { DbcError } from "@wowlab/core/Errors";
import * as Errors from "@wowlab/core/Errors";
import { Aura, Branded } from "@wowlab/core/Schemas";
import * as Effect from "effect/Effect";
import { pipe } from "effect/Function";
import * as Option from "effect/Option";

import { DbcService } from "../dbc/DbcService.js";
import { ExtractorService } from "./extractors.js";

/**
 * Determine refresh behavior based on flags and periodic status.
 * - Periodic spells default to "pandemic"
 * - Non-periodic spells default to "duration"
 * - Explicit SX_REFRESH_EXTENDS_DURATION forces "pandemic"
 */
function determineRefreshBehavior(
  pandemicRefresh: boolean,
  tickPeriodMs: number,
): Aura.RefreshBehavior {
  if (pandemicRefresh) return "pandemic";
  if (tickPeriodMs > 0) return "pandemic";
  return "duration";
}

export const transformAura = (
  spellId: number,
): Effect.Effect<
  Aura.AuraDataFlat,
  Errors.SpellInfoNotFound | DbcError,
  DbcService | ExtractorService
> =>
  Effect.gen(function* () {
    const dbc = yield* DbcService;
    const extractor = yield* ExtractorService;

    // Verify spell exists
    const nameRow = yield* dbc.getSpellName(spellId);
    if (!nameRow) {
      return yield* Effect.fail(
        new Errors.SpellInfoNotFound({
          message: `Spell ${spellId} not found in DBC cache`,
          spellId,
        }),
      );
    }

    const misc = Option.fromNullable(yield* dbc.getSpellMisc(spellId));
    const effects = yield* dbc.getSpellEffects(spellId);

    // Extract duration
    const duration = yield* extractor.extractDuration(misc);

    // Extract aura options (stacking)
    const auraOptions = yield* dbc.getSpellAuraOptions(spellId);
    const maxStacks = auraOptions?.CumulativeAura ?? 1;

    // Extract periodic info
    const periodicInfo = yield* extractor.extractPeriodicInfo(effects);

    // Extract aura behavior flags
    const flags = yield* extractor.extractAuraFlags(misc);

    // Determine refresh behavior
    const refreshBehavior = determineRefreshBehavior(
      flags.pandemicRefresh,
      periodicInfo.tickPeriodMs,
    );

    return {
      spellId: Branded.SpellID(spellId),
      baseDurationMs: pipe(
        duration,
        Option.map((d) => d.duration),
        Option.getOrElse(() => 0),
      ),
      maxDurationMs: pipe(
        duration,
        Option.map((d) => d.maxDuration),
        Option.getOrElse(() => 0),
      ),
      maxStacks: maxStacks === 0 ? 1 : maxStacks,
      tickPeriodMs: periodicInfo.tickPeriodMs,
      periodicType: periodicInfo.periodicType,
      refreshBehavior,
      ...flags,
    } satisfies Aura.AuraDataFlat;
  });
```

### 3. Create AuraService

**File:** `packages/wowlab-services/src/internal/aura/AuraService.ts`

```typescript
import { Context, Data, Effect, Ref } from "effect";
import { Map as ImmutableMap } from "immutable";
import type { Aura, Branded } from "@wowlab/core/Schemas";
import { DbcError } from "@wowlab/core/Errors";
import * as Errors from "@wowlab/core/Errors";

export class AuraNotFoundError extends Data.TaggedError("AuraNotFoundError")<{
  readonly spellId: number;
}> {}

export class AuraService extends Context.Tag("AuraService")<
  AuraService,
  {
    readonly getAura: (
      spellId: Branded.SpellID,
    ) => Effect.Effect<Aura.AuraDataFlat, AuraNotFoundError>;

    readonly preloadAuras: (
      spellIds: readonly Branded.SpellID[],
    ) => Effect.Effect<void, AuraNotFoundError>;
  }
>() {}
```

### 4. Implement AuraService

**File:** `packages/wowlab-services/src/internal/aura/AuraServiceImpl.ts`

```typescript
import { Effect, Layer, Ref } from "effect";
import { Map as ImmutableMap } from "immutable";
import type { Aura, Branded } from "@wowlab/core/Schemas";

import { DbcService } from "../data/dbc/DbcService.js";
import { ExtractorService } from "../data/transformer/extractors.js";
import { transformAura } from "../data/transformer/aura.js";
import { AuraService, AuraNotFoundError } from "./AuraService.js";

export const AuraServiceLive = Layer.effect(
  AuraService,
  Effect.gen(function* () {
    const cache =
      yield* Ref.make(ImmutableMap<Branded.SpellID, Aura.AuraDataFlat>());

    const getAura = (spellId: Branded.SpellID) =>
      Effect.gen(function* () {
        const cached = yield* Ref.get(cache);
        const existing = cached.get(spellId);
        if (existing) return existing;

        const aura = yield* transformAura(spellId).pipe(
          Effect.mapError(() => new AuraNotFoundError({ spellId })),
        );

        yield* Ref.update(cache, (c) => c.set(spellId, aura));
        return aura;
      });

    return {
      getAura,
      preloadAuras: (spellIds) =>
        Effect.forEach(spellIds, getAura, { concurrency: 10 }).pipe(
          Effect.asVoid,
        ),
    };
  }),
).pipe(Layer.provide(/* DbcService, ExtractorService layers */));
```

### 5. Create Index Export

**File:** `packages/wowlab-services/src/internal/aura/index.ts`

```typescript
export { AuraService, AuraNotFoundError } from "./AuraService.js";
export { AuraServiceLive } from "./AuraServiceImpl.js";
```

### 6. Export from wowlab-services

Update `packages/wowlab-services/src/index.ts` or appropriate barrel file:

```typescript
export * from "./internal/aura/index.js";
```

## Verification

```typescript
const program = Effect.gen(function* () {
  const auraService = yield* AuraService;

  // Test with Corruption (classic DoT)
  const corruption = yield* auraService.getAura(Branded.SpellID(172));
  console.log("Corruption:");
  console.log("  Duration:", corruption.baseDurationMs, "ms");
  console.log("  Tick Period:", corruption.tickPeriodMs, "ms");
  console.log("  Refresh:", corruption.refreshBehavior);
  console.log("  Pandemic:", corruption.pandemicRefresh);
  console.log("  Hasted Ticks:", corruption.hastedTicks);
});
```

## Notes

- The transformer uses existing `DbcService` and `ExtractorService` dependencies
- Cache is per-service instance (consider moving to `MetadataService` if needed globally)
- `transformAura` can be called directly for one-off lookups or via `AuraService` for caching

## Next Phase

Proceed to `05-phase3-scheduler-and-generations.md` to implement runtime scheduling state.
