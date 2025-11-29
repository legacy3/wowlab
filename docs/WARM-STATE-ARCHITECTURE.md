# Warm State Architecture

Design document for pre-computing simulation state to reduce per-simulation overhead.

## Problem Statement

Current simulation initialization performs significant redundant work **per-simulation**:

| Work                          | Location      | Cost                         | Frequency |
| ----------------------------- | ------------- | ---------------------------- | --------- |
| `spells.find()` × 4           | `setupPlayer` | O(n) × 4                     | Per-sim   |
| `SpellInfo.create()` × 4      | `setupPlayer` | Object allocation            | Per-sim   |
| `Spell.create()` × 4          | `setupPlayer` | Object allocation            | Per-sim   |
| `Unit.create()` with defaults | `setupPlayer` | Object allocation + defaults | Per-sim   |
| `createGameState()`           | `runBatch`    | Object allocation            | Per-sim   |
| Player ID string concat       | `runBatch`    | String allocation            | Per-sim   |

For batch runs of 100,000+ simulations, this adds up to significant overhead. Profiling shows ~99% of time is spent in bootstrapping, not actual simulation logic.

## Design Goals

1. **Pre-compute everything that doesn't depend on per-sim state**
2. **Create "warm" templates that can be cloned/reset cheaply**
3. **Maintain immutable state snapshots** (core design requirement)
4. **Support future healing sims** with multiple raid members

## Architecture

### Initialization Phases

```
┌─────────────────────────────────────────────────────────────────┐
│ PER-WORKER (once when worker starts)                            │
│                                                                 │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐ │
│  │  SpellCatalog   │  │  UnitTemplates  │  │   WarmState     │ │
│  │                 │  │                 │  │                 │ │
│  │ • Spell ID Map  │  │ • Player tmpl   │  │ • baseGameState │ │
│  │ • SpellInfo[]   │  │ • Raid tmpl     │  │   (with player) │ │
│  │ • Spell[]       │  │                 │  │                 │ │
│  └─────────────────┘  └─────────────────┘  └─────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│ PER-SIMULATION (minimal work)                                   │
│                                                                 │
│  1. stateService.setState(baseGameState)  ← Just a Ref.set()   │
│  2. [If healing sim] Spawn raid members from template           │
│  3. Run rotation loop                                           │
└─────────────────────────────────────────────────────────────────┘
```

### New Services

#### 1. SpellCatalog Service

Pre-indexes spell data and creates spell entity templates.

```typescript
interface SpellCatalog {
  // O(1) lookup instead of array.find()
  getSpellData(id: SpellID): SpellDataFlat | undefined;

  // Pre-built spell entities for rotation
  getSpellEntity(id: SpellID): Spell;

  // All rotation spell entities as a Map (ready for Unit.spells.all)
  getRotationSpells(): Map<SpellID, Spell>;
}
```

**Built once per-worker** from the spells array passed during init.

#### 2. UnitTemplates Service

Holds pre-built unit templates.

```typescript
interface UnitTemplates {
  // Main player unit - fully configured, used in baseGameState
  readonly player: Unit;

  // Template for raid members (healing sims)
  readonly raidMemberTemplate: Unit;

  // Spawn a raid member with specific index
  spawnRaidMember(index: number): Unit;
}
```

**Player unit** uses static ID `"player"` - no per-sim string allocation.

**Raid members** use IDs like `"raid-1"`, `"raid-2"`, etc. - only created when needed for healing sims.

#### 3. WarmState Service

Holds the pre-built GameState template.

```typescript
interface WarmState {
  // Base game state with player already added
  readonly baseGameState: GameState;

  // Reset state service to warm state
  reset(): Effect<void>;

  // Reset and add raid members (for healing sims)
  resetWithRaid(raidSize: number): Effect<void>;
}
```

### Layer Structure

```
Worker Layer (memoized, built once):
├── MetadataService        (spell/item data maps)
├── SpellCatalog           (pre-built spell templates)  [NEW]
├── UnitTemplates          (pre-built unit templates)   [NEW]
├── WarmState              (baseGameState template)     [NEW]
├── StateService           (Ref for current state)
├── UnitService            (unit operations)
├── UnitAccessor           (unit reads)
├── SpellAccessor          (spell reads)
└── RotationContext        (rotation actions)
```

### Data Flow

#### DPS Simulation (optimized path)

```
1. Worker Init:
   - Build SpellCatalog from spells array
   - Build player Unit with rotation spells from catalog
   - Build baseGameState with player added
   - Store in WarmState service

2. Per-Sim:
   - warmState.reset()  // Just Ref.set(baseGameState)
   - Run rotation loop
   - Return results
```

#### Healing Simulation (future)

```
1. Worker Init:
   - Same as DPS, plus build raidMemberTemplate

2. Per-Sim:
   - warmState.resetWithRaid(raidSize)
     - Ref.set(baseGameState)
     - Spawn N raid members from template
   - Run rotation loop
   - Return results
```

## Implementation Details

### SpellCatalog Implementation

```typescript
// packages/wowlab-services/src/internal/catalog/SpellCatalog.ts

export interface SpellCatalogConfig {
  readonly spells: SpellDataFlat[];
  readonly rotationSpellIds: number[];
}

export class SpellCatalog extends Effect.Service<SpellCatalog>()(
  "SpellCatalog",
  {
    effect: Effect.gen(function* () {
      // Will be configured via Layer
      return {
        getSpellData: () => {
          throw new Error("Not configured");
        },
        getSpellEntity: () => {
          throw new Error("Not configured");
        },
        getRotationSpells: () => {
          throw new Error("Not configured");
        },
      };
    }),
  },
) {}

export const makeSpellCatalog = (config: SpellCatalogConfig) => {
  // Pre-index spell data by ID - O(n) once
  const spellDataMap = new Map(config.spells.map((s) => [s.id, s]));

  // Pre-create SpellInfo for rotation spells
  const spellInfoMap = new Map(
    config.rotationSpellIds.map((id) => {
      const data = spellDataMap.get(id)!;
      return [id, SpellInfo.create({ ...data, modifiers: [] })];
    }),
  );

  // Pre-create Spell entities for rotation spells
  const spellEntityMap = Map(
    config.rotationSpellIds.map((id) => {
      const info = spellInfoMap.get(id)!;
      const spell = Spell.create(
        {
          charges: info.maxCharges || 1,
          cooldownExpiry: 0,
          info,
        },
        0,
      );
      return [Branded.SpellID(id), spell];
    }),
  );

  return Layer.succeed(SpellCatalog, {
    getSpellData: (id) => spellDataMap.get(id),
    getSpellEntity: (id) => spellEntityMap.get(Branded.SpellID(id))!,
    getRotationSpells: () => spellEntityMap,
  });
};
```

### UnitTemplates Implementation

```typescript
// packages/wowlab-services/src/internal/templates/UnitTemplates.ts

export class UnitTemplates extends Effect.Service<UnitTemplates>()(
  "UnitTemplates",
  {
    dependencies: [SpellCatalog.Default],
    effect: Effect.gen(function* () {
      const catalog = yield* SpellCatalog;

      // Pre-build player unit with rotation spells
      const player = Unit.create({
        id: Branded.UnitID("player"),
        isPlayer: true,
        name: "Player",
        spells: {
          all: catalog.getRotationSpells(),
          meta: Record({ cooldownCategories: Map() })(),
        },
      });

      // Template for raid members (no spells, basic stats)
      const raidMemberTemplate = Unit.create({
        id: Branded.UnitID("raid-template"),
        isPlayer: false,
        name: "Raid Member",
        spells: { all: Map(), meta: Record({ cooldownCategories: Map() })() },
      });

      return {
        player,
        raidMemberTemplate,
        spawnRaidMember: (index: number) =>
          raidMemberTemplate
            .set("id", Branded.UnitID(`raid-${index}`))
            .set("name", `Raid Member ${index}`),
      };
    }),
  },
) {}
```

### WarmState Implementation

```typescript
// packages/wowlab-services/src/internal/warmstate/WarmState.ts

export class WarmState extends Effect.Service<WarmState>()("WarmState", {
  dependencies: [UnitTemplates.Default, StateService.Default],
  effect: Effect.gen(function* () {
    const templates = yield* UnitTemplates;
    const stateService = yield* StateService;

    // Pre-build base game state with player
    const baseGameState = createGameState().setIn(
      ["units", templates.player.id],
      templates.player,
    );

    return {
      baseGameState,

      reset: () => stateService.setState(baseGameState),

      resetWithRaid: (raidSize: number) =>
        Effect.gen(function* () {
          let state = baseGameState;
          for (let i = 1; i <= raidSize; i++) {
            const member = templates.spawnRaidMember(i);
            state = state.setIn(["units", member.id], member);
          }
          yield* stateService.setState(state);
        }),
    };
  }),
}) {}
```

### Updated Worker Init

```typescript
// apps/standalone/src/workers/simulation-worker.ts

const initWorker = (init: WorkerInit): Effect.Effect<SimulationResult> =>
  Effect.gen(function* () {
    const rotation = rotations[init.rotationName];

    // Build spell catalog from init data
    const catalogLayer = makeSpellCatalog({
      spells: init.spells,
      rotationSpellIds: rotation.spellIds,
    });

    // Compose layers with catalog
    const fullLayer = pipe(
      WarmState.Default,
      Layer.provideMerge(UnitTemplates.Default),
      Layer.provideMerge(catalogLayer),
      Layer.provideMerge(baseAppLayer),
      Layer.provideMerge(loggerLayer),
    );

    const runtime = ManagedRuntime.make(fullLayer);

    // Pre-warm: build the base state now
    yield* Effect.promise(() =>
      runtime.runPromise(
        Effect.gen(function* () {
          const warmState = yield* WarmState;
          yield* warmState.reset(); // Initialize state
        }),
      ),
    );

    workerState = { runtime, rotation };
  });
```

### Updated runBatch

```typescript
// apps/standalone/src/workers/simulation-worker.ts

const runBatch = (batch: SimulationBatch): Effect.Effect<SimulationResult> =>
  Effect.gen(function* () {
    const { runtime, rotation } = workerState!;
    const results: SingleSimResult[] = [];

    for (const simId of batch.simIds) {
      const result = yield* Effect.promise(() =>
        runtime.runPromise(
          Effect.gen(function* () {
            // Just reset to warm state - no unit/spell creation!
            const warmState = yield* WarmState;
            yield* warmState.reset();

            // Run simulation
            let casts = 0;
            const stateService = yield* StateService;
            while (true) {
              const state = yield* stateService.getState();
              if (state.currentTime >= batch.duration) break;
              yield* rotation.run(Branded.UnitID("player"));
              casts++;
            }

            return { casts, duration: batch.duration, simId };
          }),
        ),
      );
      results.push(result);
    }

    return { batchId: batch.batchId, results };
  });
```

## Performance Impact

### Before (Per-Sim)

- 4× `array.find()` - O(n) each
- 4× `SpellInfo.create()` - object allocation
- 4× `Spell.create()` - object allocation
- 1× `Unit.create()` - object allocation + defaults
- 1× `createGameState()` - object allocation
- String concat for player ID

### After (Per-Sim)

- 1× `Ref.set(baseGameState)` - just a reference swap
- (Immutable.js structural sharing makes this essentially free)

### Expected Gains

| Optimization                       | Estimated Impact |
| ---------------------------------- | ---------------- |
| Map lookup instead of array.find() | ~5-10%           |
| Reuse SpellInfo/Spell templates    | ~10-15%          |
| Pre-built Unit template            | ~5-10%           |
| Pre-built GameState with player    | ~10-15%          |
| Static player ID                   | Enables above    |
| **Combined**                       | **~25-40%**      |

## Cooldown Reset Consideration

One subtlety: the pre-built spell entities have `cooldownExpiry: 0` and `isReady: true`. This is correct for sim start. However, if spells get modified during a sim (cooldowns triggered), we need to ensure the next sim gets fresh spells.

Since we reset to `baseGameState` which contains the original spell templates, this is handled automatically - each sim starts with fresh spell states.

## Future Enhancements

1. **Spell variant templates** - Pre-build spell entities with different talent configurations
2. **Raid composition templates** - Pre-build common raid setups (5-man, 20-man, 40-man)
3. **Object pooling** - Reuse Spell/Unit objects across sims instead of relying on GC
4. **Layer.memoize** - Use Effect's built-in memoization for expensive layer computations

## Migration Path

1. Implement SpellCatalog service
2. Implement UnitTemplates service
3. Implement WarmState service
4. Update worker to use new services
5. Update rotation definitions to use static player ID
6. Benchmark before/after
7. Remove old setupPlayer logic from rotations
