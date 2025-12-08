# Phase 2: Aura Definition Service

## Goal

Create a service that loads and caches `AuraDefinition` from spell data.

## Prerequisites

- Phase 1 complete (data structures exist)

## Spell Data Tables

The spell data is available via MetadataService:

| Table                | Key Fields                                              |
| -------------------- | ------------------------------------------------------- |
| `spell_misc`         | `DurationIndex`, `Attributes_0` through `Attributes_15` |
| `spell_duration`     | `ID` → `Duration` (milliseconds)                        |
| `spell_effect`       | `SpellID` → `EffectAura`, `EffectAuraPeriod`            |
| `spell_aura_options` | `SpellID` → `CumulativeAura` (max stacks)               |

## Tasks

### 1. Create AuraDefinitionService Interface

**File:** `packages/wowlab-services/src/internal/aura/AuraDefinitionService.ts`

```typescript
import { Context, Effect } from "effect";
import type { AuraDefinition } from "@wowlab/core/schemas/aura";
import type { SpellID } from "@wowlab/core/branded";

export class SpellNotFoundError extends Data.TaggedError("SpellNotFoundError")<{
  readonly spellId: number;
}> {}

export class AuraDefinitionService extends Context.Tag("AuraDefinitionService")<
  AuraDefinitionService,
  {
    readonly getDefinition: (
      spellId: SpellID,
    ) => Effect.Effect<AuraDefinition, SpellNotFoundError>;

    readonly preloadDefinitions: (
      spellIds: readonly SpellID[],
    ) => Effect.Effect<void, SpellNotFoundError>;
  }
>() {}
```

### 2. Implement the Service

**File:** `packages/wowlab-services/src/internal/aura/AuraDefinitionServiceImpl.ts`

```typescript
import { Effect, Layer, Ref, Data } from "effect";
import { Map as ImmutableMap } from "immutable";
import { AuraDefinition, AuraFlags } from "@wowlab/core/schemas/aura";
import {
  SX_REFRESH_EXTENDS_DURATION,
  SX_DOT_HASTED,
  SX_TICK_ON_APPLICATION,
  SX_DURATION_HASTED,
  SX_ROLLING_PERIODIC,
  SX_TICK_MAY_CRIT,
  hasSpellAttribute,
} from "@wowlab/core/constants/SpellAttributes";
import { MetadataService } from "../metadata/MetadataService.js";
import {
  AuraDefinitionService,
  SpellNotFoundError,
} from "./AuraDefinitionService.js";

const PERIODIC_DAMAGE_AURAS = [3, 53, 64]; // A_PERIODIC_DAMAGE, A_PERIODIC_LEECH, A_PERIODIC_MANA_LEECH
const PERIODIC_HEAL_AURAS = [8, 20]; // A_PERIODIC_HEAL, A_PERIODIC_HEAL_PCT
const PERIODIC_AURA_TYPES = [
  ...PERIODIC_DAMAGE_AURAS,
  ...PERIODIC_HEAL_AURAS,
  23,
  24,
]; // +trigger, energize

function determineRefreshBehavior(
  flags: AuraFlags,
  tickPeriodMs: number | undefined,
): "pandemic" | "duration" {
  if (flags.pandemicRefresh) return "pandemic";
  if (tickPeriodMs && tickPeriodMs > 0) return "pandemic";
  return "duration";
}

export const AuraDefinitionServiceLive = Layer.effect(
  AuraDefinitionService,
  Effect.gen(function* () {
    const metadata = yield* MetadataService;
    const cache = yield* Ref.make(ImmutableMap<number, AuraDefinition>());

    const loadDefinition = (spellId: number) =>
      Effect.gen(function* () {
        const cached = yield* Ref.get(cache);
        const existing = cached.get(spellId);
        if (existing) return existing;

        const misc = yield* metadata
          .loadSpellMisc(spellId)
          .pipe(Effect.mapError(() => new SpellNotFoundError({ spellId })));

        const durationRow = yield* metadata
          .loadSpellDuration(misc.DurationIndex)
          .pipe(Effect.mapError(() => new SpellNotFoundError({ spellId })));

        const effects = yield* metadata
          .loadSpellEffects(spellId)
          .pipe(Effect.mapError(() => new SpellNotFoundError({ spellId })));

        const auraOptions = yield* metadata
          .loadSpellAuraOptions(spellId)
          .pipe(Effect.orElseSucceed(() => null));

        const periodicEffect = effects.find((e) =>
          PERIODIC_AURA_TYPES.includes(e.EffectAura),
        );

        // Determine periodic type from effect aura
        const periodicType = periodicEffect
          ? PERIODIC_HEAL_AURAS.includes(periodicEffect.EffectAura)
            ? ("heal" as const)
            : ("damage" as const)
          : undefined;

        const attributes: Record<string, number> = {};
        for (let i = 0; i <= 15; i++) {
          const key = `Attributes_${i}`;
          if (key in misc) {
            attributes[key] = (misc as any)[key];
          }
        }

        const flags = new AuraFlags({
          pandemicRefresh: hasSpellAttribute(
            attributes,
            SX_REFRESH_EXTENDS_DURATION,
          ),
          hastedTicks: hasSpellAttribute(attributes, SX_DOT_HASTED),
          tickOnApplication: hasSpellAttribute(
            attributes,
            SX_TICK_ON_APPLICATION,
          ),
          durationHasted: hasSpellAttribute(attributes, SX_DURATION_HASTED),
          rollingPeriodic: hasSpellAttribute(attributes, SX_ROLLING_PERIODIC),
          tickMayCrit: hasSpellAttribute(attributes, SX_TICK_MAY_CRIT),
        });

        const tickPeriodMs = periodicEffect?.EffectAuraPeriod;

        const definition = new AuraDefinition({
          spellId,
          baseDurationMs: durationRow.Duration,
          maxStacks: auraOptions?.CumulativeAura || 1,
          tickPeriodMs,
          periodicType,
          refreshBehavior: determineRefreshBehavior(flags, tickPeriodMs),
          flags,
        });

        yield* Ref.update(cache, (c) => c.set(spellId, definition));

        return definition;
      });

    return {
      getDefinition: loadDefinition,
      preloadDefinitions: (spellIds) =>
        Effect.forEach(spellIds, loadDefinition, { concurrency: 10 }).pipe(
          Effect.asVoid,
        ),
    };
  }),
);
```

### 3. Create Index Export

**File:** `packages/wowlab-services/src/internal/aura/index.ts`

```typescript
export {
  AuraDefinitionService,
  SpellNotFoundError,
} from "./AuraDefinitionService.js";
export { AuraDefinitionServiceLive } from "./AuraDefinitionServiceImpl.js";
```

### 4. MetadataService Interface

Ensure `MetadataService` provides these methods:

```typescript
interface MetadataService {
  loadSpellMisc(spellId: number): Effect<SpellMisc, Error>;
  loadSpellDuration(durationIndex: number): Effect<SpellDuration, Error>;
  loadSpellEffects(spellId: number): Effect<SpellEffect[], Error>;
  loadSpellAuraOptions(spellId: number): Effect<SpellAuraOptions | null, Error>;
}
```

## Verification

```typescript
const program = Effect.gen(function* () {
  const service = yield* AuraDefinitionService;
  const corruption = yield* service.getDefinition(172 as SpellID);

  console.log("Duration:", corruption.baseDurationMs);
  console.log("Tick Period:", corruption.tickPeriodMs);
  console.log("Refresh:", corruption.refreshBehavior);
});
```

## Next Phase

Proceed to `05-phase3-scheduler-and-generations.md`.
