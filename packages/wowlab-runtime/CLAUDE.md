# wowlab-runtime

Application layer composition for running simulations.

## Purpose

Combines all services from `@wowlab/services` into a ready-to-use Layer for simulation execution.

## Usage

```ts
import { createAppLayer } from "@wowlab/runtime";

const AppLayer = createAppLayer({
  metadata: MyMetadataLayer, // Required: spell/item data source
  logger: Log.ConsoleLogger, // Optional: defaults to console
  rng: Rng.RNGServiceDefault, // Optional: defaults to Math.random
});

// Run simulation with all services provided
mySimulationEffect.pipe(Effect.provide(AppLayer));
```

## What It Provides

The `createAppLayer` wires up:

- StateService (simulation state)
- SimulationConfigService
- CombatLogService + SimDriver
- UnitAccessor, SpellAccessor
- RotationProviderService
- UnitService
- Logger, RNG

## Key Pattern

Layer composition with `Layer.mergeAll` and `Layer.provide`:

```ts
const BaseLayer = Layer.mergeAll(State, Config, Logger, Rng, Metadata);
const CombatLogLayer = CombatLog.pipe(Layer.provide(BaseLayer));
const ServicesLayer = Services.pipe(Layer.provide(BaseLayer));
```
