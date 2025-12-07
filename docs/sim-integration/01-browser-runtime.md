# Phase 1: Browser Runtime Setup

> Create the simulation runtime that runs in the browser. Copy and adapt from standalone.

## Key Principle

**Simulations run CLIENT-SIDE in the browser.** No server execution. The browser loads spells, runs the sim, and uploads results.

## What To Create

```
apps/portal/src/lib/simulation/
├── index.ts              # Re-exports
├── types.ts              # RotationDefinition, SimulationConfig, SimulationResult
├── runtime.ts            # Browser-adapted createBrowserRuntime
├── rotation-utils.ts     # tryCast, runPriorityList, createPlayerWithSpells
└── rotations/
    ├── index.ts          # Registry
    └── beast-mastery.ts  # BM Hunter rotation
```

## Step 1: Create Types

Copy from `apps/standalone/src/framework/types.ts`:

```typescript
// apps/portal/src/lib/simulation/types.ts

import type * as Errors from "@wowlab/core/Errors";
import type * as Schemas from "@wowlab/core/Schemas";
import type * as Context from "@wowlab/rotation/Context";
import type * as Effect from "effect/Effect";

/**
 * Definition for a rotation that can be run by the browser simulation.
 */
export interface RotationDefinition {
  /** Display name for the rotation */
  readonly name: string;

  /** The APL logic that decides what to cast each GCD */
  readonly run: (
    playerId: Schemas.Branded.UnitID,
  ) => Effect.Effect<void, Errors.RotationError, Context.RotationContext>;

  /** All spell IDs needed by this rotation (used to load spell data) */
  readonly spellIds: readonly number[];
}

/**
 * Configuration for running a simulation.
 */
export interface SimulationConfig {
  rotation: RotationDefinition;
  spells: Schemas.Spell.SpellDataFlat[];
  durationMs: number;
}

/**
 * Result of a simulation run.
 */
export interface SimulationResult {
  events: Schemas.CombatLog.CombatLogEvent[];
  casts: number;
  durationMs: number;
  totalDamage: number;
  dps: number;
}
```

## Step 2: Create Rotation Utils

Copy from `apps/standalone/src/framework/rotation-utils.ts`:

```typescript
// apps/portal/src/lib/simulation/rotation-utils.ts

import * as Entities from "@wowlab/core/Entities";
import * as Errors from "@wowlab/core/Errors";
import * as Schemas from "@wowlab/core/Schemas";
import * as Context from "@wowlab/rotation/Context";
import * as Effect from "effect/Effect";
import { Map, Record } from "immutable";

/**
 * Creates a spell entity from flat spell data.
 */
export const createSpellEntity = (
  data: Schemas.Spell.SpellDataFlat,
): Entities.Spell.Spell => {
  const info = Entities.Spell.SpellInfo.create({
    ...data,
    id: Schemas.Branded.SpellID(data.id),
    modifiers: [],
  });

  return Entities.Spell.Spell.create(
    {
      charges: info.maxCharges || 1,
      cooldownExpiry: 0,
      info,
    },
    0,
  );
};

/**
 * Creates a player unit with spells derived from the provided spell IDs.
 * Automatically filters out any spell IDs that aren't found in the spell data.
 */
export const createPlayerWithSpells = (
  id: Schemas.Branded.UnitID,
  name: string,
  spellIds: readonly number[],
  spellData: Schemas.Spell.SpellDataFlat[],
): Entities.Unit.Unit => {
  // Build lookup by raw number for easier matching
  const spellMap = new globalThis.Map<number, Schemas.Spell.SpellDataFlat>();
  for (const spell of spellData) {
    spellMap.set(spell.id, spell);
  }

  const spellEntities: [Schemas.Branded.SpellID, Entities.Spell.Spell][] = [];

  for (const spellId of spellIds) {
    const data = spellMap.get(spellId);
    if (!data) {
      console.warn(`Spell ID ${spellId} not found in spell data`);
      continue;
    }

    const entity = createSpellEntity(data);
    spellEntities.push([entity.info.id, entity]);
  }

  return Entities.Unit.Unit.create({
    id,
    isPlayer: true,
    name,
    spells: {
      all: Map(spellEntities),
      meta: Record({ cooldownCategories: Map<number, number>() })(),
    },
  });
};

/**
 * Result of attempting to cast a spell.
 */
export type CastResult =
  | { readonly cast: true; readonly consumedGCD: boolean }
  | { readonly cast: false };

/**
 * Attempts to cast a spell, returning whether it was cast and consumed the GCD.
 * Silently handles SpellOnCooldown errors by returning { cast: false }.
 */
export const tryCast = (
  rotation: Context.RotationContext,
  playerId: Schemas.Branded.UnitID,
  spellId: number,
): Effect.Effect<CastResult, Errors.SpellNotFound | Errors.UnitNotFound> =>
  rotation.spell.cast(playerId, spellId).pipe(
    Effect.map(({ consumedGCD }) => ({ cast: true as const, consumedGCD })),
    Effect.catchTag("SpellOnCooldown", () =>
      Effect.succeed({ cast: false as const }),
    ),
  );

/**
 * Runs a priority list of spells, stopping after the first one consumes the GCD.
 * Each spell is tried in order. Off-GCD spells that succeed won't stop the list.
 */
export const runPriorityList = (
  rotation: Context.RotationContext,
  playerId: Schemas.Branded.UnitID,
  spellIds: readonly number[],
): Effect.Effect<void, Errors.SpellNotFound | Errors.UnitNotFound> =>
  Effect.gen(function* () {
    for (const spellId of spellIds) {
      const result = yield* tryCast(rotation, playerId, spellId);
      if (result.cast && result.consumedGCD) {
        return;
      }
    }
  });
```

## Step 3: Copy Beast Mastery Rotation

Copy from `apps/standalone/src/rotations/beast-mastery.ts`:

```typescript
// apps/portal/src/lib/simulation/rotations/beast-mastery.ts

import * as Context from "@wowlab/rotation/Context";
import * as Effect from "effect/Effect";

import { tryCast } from "../rotation-utils";
import type { RotationDefinition } from "../types";

const SpellIds = {
  BARBED_SHOT: 217200,
  BESTIAL_WRATH: 19574,
  BLOODSHED: 321530,
  CALL_OF_THE_WILD: 359844,
  COBRA_SHOT: 193455,
  EXPLOSIVE_SHOT: 212431,
  KILL_COMMAND: 34026,
  KILL_SHOT: 53351,
  MULTI_SHOT: 2643,
} as const;

export const BeastMasteryRotation: RotationDefinition = {
  name: "Beast Mastery Hunter",

  run: (playerId) =>
    Effect.gen(function* () {
      const rotation = yield* Context.RotationContext;

      const bw = yield* tryCast(rotation, playerId, SpellIds.BESTIAL_WRATH);
      if (bw.cast && bw.consumedGCD) {
        return;
      }

      const cotw = yield* tryCast(
        rotation,
        playerId,
        SpellIds.CALL_OF_THE_WILD,
      );
      if (cotw.cast && cotw.consumedGCD) {
        return;
      }

      const bs = yield* tryCast(rotation, playerId, SpellIds.BARBED_SHOT);
      if (bs.cast && bs.consumedGCD) {
        return;
      }

      const bloodshed = yield* tryCast(rotation, playerId, SpellIds.BLOODSHED);
      if (bloodshed.cast && bloodshed.consumedGCD) {
        return;
      }

      const ks = yield* tryCast(rotation, playerId, SpellIds.KILL_SHOT);
      if (ks.cast && ks.consumedGCD) {
        return;
      }

      const kc = yield* tryCast(rotation, playerId, SpellIds.KILL_COMMAND);
      if (kc.cast && kc.consumedGCD) {
        return;
      }

      const es = yield* tryCast(rotation, playerId, SpellIds.EXPLOSIVE_SHOT);
      if (es.cast && es.consumedGCD) {
        return;
      }

      yield* tryCast(rotation, playerId, SpellIds.COBRA_SHOT);
    }),

  spellIds: [
    SpellIds.COBRA_SHOT,
    SpellIds.BARBED_SHOT,
    SpellIds.KILL_COMMAND,
    SpellIds.MULTI_SHOT,
    SpellIds.BESTIAL_WRATH,
    SpellIds.CALL_OF_THE_WILD,
    SpellIds.BLOODSHED,
    SpellIds.KILL_SHOT,
    SpellIds.EXPLOSIVE_SHOT,
  ],
};
```

## Step 4: Create Rotation Registry

```typescript
// apps/portal/src/lib/simulation/rotations/index.ts

import type { RotationDefinition } from "../types";
import { BeastMasteryRotation } from "./beast-mastery";

const ROTATIONS: Record<string, RotationDefinition> = {
  "beast-mastery": BeastMasteryRotation,
};

export function getRotation(name: string): RotationDefinition | undefined {
  return ROTATIONS[name];
}

export function listRotations(): string[] {
  return Object.keys(ROTATIONS);
}

export { BeastMasteryRotation };
```

## Step 5: Create Browser Runtime

Adapt from `apps/standalone/src/runtime/RotationRuntime.ts`:

```typescript
// apps/portal/src/lib/simulation/runtime.ts

import * as Schemas from "@wowlab/core/Schemas";
import * as Context from "@wowlab/rotation/Context";
import { createAppLayer } from "@wowlab/runtime";
import * as Metadata from "@wowlab/services/Metadata";
import * as Layer from "effect/Layer";
import * as Logger from "effect/Logger";
import * as LogLevel from "effect/LogLevel";
import * as ManagedRuntime from "effect/ManagedRuntime";

export interface BrowserRuntimeConfig {
  spells: Schemas.Spell.SpellDataFlat[];
  items?: Schemas.Item.ItemDataFlat[];
}

export function createBrowserRuntime(config: BrowserRuntimeConfig) {
  // Create metadata layer with loaded spells
  const metadataLayer = Metadata.InMemoryMetadata({
    items: config.items ?? [],
    spells: config.spells,
  });

  // Create base app layer
  const baseAppLayer = createAppLayer({ metadata: metadataLayer });

  // Suppress logging in browser (or use console logger)
  const loggerLayer = Layer.merge(
    Logger.replace(Logger.defaultLogger, Logger.none),
    Logger.minimumLogLevel(LogLevel.None),
  );

  // Compose full layer with rotation context
  const fullLayer = Context.RotationContext.Default.pipe(
    Layer.provide(baseAppLayer),
    Layer.merge(baseAppLayer),
    Layer.provide(loggerLayer),
  );

  return ManagedRuntime.make(fullLayer);
}

export type BrowserRuntime = Awaited<ReturnType<typeof createBrowserRuntime>>;
```

## Step 6: Create Index

```typescript
// apps/portal/src/lib/simulation/index.ts

export * from "./types";
export * from "./runtime";
export * from "./rotation-utils";
export { getRotation, listRotations, BeastMasteryRotation } from "./rotations";
```

## Checklist

- [x] Create `lib/simulation/types.ts` with RotationDefinition, SimulationConfig, SimulationResult
- [x] Create `lib/simulation/rotation-utils.ts` with tryCast, runPriorityList, createPlayerWithSpells
- [x] Create `lib/simulation/rotations/beast-mastery.ts`
- [x] Create `lib/simulation/rotations/index.ts` with registry
- [x] Create `lib/simulation/runtime.ts` with createBrowserRuntime
- [x] Create `lib/simulation/index.ts` re-exports
- [x] Verify imports resolve correctly (`pnpm build`)

## Success Criteria

1. `import { createBrowserRuntime, BeastMasteryRotation } from "@/lib/simulation"` works
2. `pnpm build` passes with no errors
3. No Node.js-specific code in the simulation folder

## Next Phase

→ [Phase 2: Spell Loading](./02-spell-loading.md)
