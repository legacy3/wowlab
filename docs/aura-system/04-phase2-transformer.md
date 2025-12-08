# Phase 2: Aura Transformer

## Goal

Create a transformer that extracts `AuraDataFlat` from DBC tables, following the existing `transformSpell` / `transformItem` pattern.

## Prerequisites

- Phase 1 complete (`AuraDataFlat` schema and constants exist)
- Understand the existing transformer pattern in `packages/wowlab-services/src/internal/data/transformer/`

## Architecture

```
transformAura(spellId)
    ↓
DbcService (spell_misc, spell_duration, spell_effect, spell_aura_options)
    ↓
AuraDataFlat
```

The transformer is a pure function that takes a spell ID and returns `AuraDataFlat`. It uses the existing `DbcService` and `ExtractorService` dependencies.

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
  hasSpellAttribute,
  SX_DOT_HASTED,
  SX_DURATION_HASTED,
  SX_REFRESH_EXTENDS_DURATION,
  SX_ROLLING_PERIODIC,
  SX_TICK_MAY_CRIT,
  SX_TICK_ON_APPLICATION,
} from "@wowlab/core/Constants";

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

// Add to ExtractorService return object:

extractAuraFlags: (misc: Option.Option<Dbc.SpellMiscRow>) =>
  Effect.succeed(
    pipe(
      misc,
      Option.map((m) => {
        const attrs: Record<string, number> = {};
        for (let i = 0; i <= 15; i++) {
          attrs[`Attributes_${i}`] = (m as Record<string, number>)[`Attributes_${i}`] ?? 0;
        }
        return {
          durationHasted: hasSpellAttribute(attrs, SX_DURATION_HASTED),
          hastedTicks: hasSpellAttribute(attrs, SX_DOT_HASTED),
          pandemicRefresh: hasSpellAttribute(attrs, SX_REFRESH_EXTENDS_DURATION),
          rollingPeriodic: hasSpellAttribute(attrs, SX_ROLLING_PERIODIC),
          tickMayCrit: hasSpellAttribute(attrs, SX_TICK_MAY_CRIT),
          tickOnApplication: hasSpellAttribute(attrs, SX_TICK_ON_APPLICATION),
        };
      }),
      Option.getOrElse(() => ({
        durationHasted: false,
        hastedTicks: false,
        pandemicRefresh: false,
        rollingPeriodic: false,
        tickMayCrit: false,
        tickOnApplication: false,
      })),
    ),
  ),

extractPeriodicInfo: (effects: readonly Dbc.SpellEffectRow[]) =>
  Effect.succeed((() => {
    const periodicEffect = effects.find((e) =>
      ALL_PERIODIC_AURAS.includes(e.EffectAura),
    );

    if (!periodicEffect) {
      return { periodicType: null, tickPeriodMs: 0 };
    }

    let periodicType: Aura.PeriodicType | null = null;
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
      periodicType,
      tickPeriodMs: periodicEffect.EffectAuraPeriod,
    };
  })()),
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
    const duration = yield* extractor.extractDuration(misc);
    const auraOptions = yield* dbc.getSpellAuraOptions(spellId);
    const maxStacks = auraOptions?.CumulativeAura ?? 1;
    const periodicInfo = yield* extractor.extractPeriodicInfo(effects);
    const flags = yield* extractor.extractAuraFlags(misc);

    const refreshBehavior = determineRefreshBehavior(
      flags.pandemicRefresh,
      periodicInfo.tickPeriodMs,
    );

    return {
      baseDurationMs: pipe(
        duration,
        Option.map((d) => d.duration),
        Option.getOrElse(() => 0),
      ),
      maxDurationMs: pipe(
        duration,
        Option.map((d) => d.max),
        Option.getOrElse(() => 0),
      ),
      maxStacks: maxStacks === 0 ? 1 : maxStacks,
      periodicType: periodicInfo.periodicType,
      refreshBehavior,
      spellId: Branded.SpellID(spellId),
      tickPeriodMs: periodicInfo.tickPeriodMs,
      ...flags,
    } satisfies Aura.AuraDataFlat;
  });
```

### 3. Export from transformer index

**File:** `packages/wowlab-services/src/internal/data/transformer/index.ts`

```typescript
export * from "./aura.js";
export * from "./extractors.js";
export * from "./item.js";
export * from "./spell.js";
```

## Usage

The transformer is used during simulation setup to load aura definitions:

```typescript
const program = Effect.gen(function* () {
  // Load aura data for spells in the rotation
  const corruptionData = yield* transformAura(172);

  // Include in simulation config
  const config = {
    auras: new Map([[172, corruptionData]]),
    // ...
  };
});
```

## Verification

```bash
pnpm build
```

## Next Phase

Proceed to `05-phase3-handler-integration.md` to integrate with combat log handlers.
