// Local layer construction for debugging
// Step 1: Core services (no dependencies)

import * as Context from "effect/Context";
import * as Effect from "effect/Effect";
import * as Layer from "effect/Layer";

// ============================================================================
// STEP 1: Core Services (No Dependencies)
// ============================================================================

// Mock LogService
export class LogService extends Context.Tag("LogService")<
  LogService,
  {
    readonly log: (message: string) => Effect.Effect<void>;
  }
>() {
  static Default = Layer.succeed(this, {
    log: (message: string) =>
      Effect.sync(() => {
        console.log(`[LOG] ${message}`);
      }),
  });
}

// Mock StateService - simplified
export class StateService extends Context.Tag("StateService")<
  StateService,
  {
    readonly getState: () => Effect.Effect<{ currentTime: number }>;
    readonly setState: (
      state: { currentTime: number },
    ) => Effect.Effect<void>;
  }
>() {
  static Default = Layer.sync(this, () => {
    let state = { currentTime: 0 };
    return {
      getState: () => Effect.succeed(state),
      setState: (newState: { currentTime: number }) =>
        Effect.sync(() => {
          state = newState;
        }),
    };
  });
}

// Mock RNGService
export class RNGService extends Context.Tag("RNGService")<
  RNGService,
  {
    readonly random: () => Effect.Effect<number>;
  }
>() {
  static Default = Layer.succeed(this, {
    random: () => Effect.sync(() => Math.random()),
  });
}

// ============================================================================
// STEP 1 LAYER
// ============================================================================

export const CoreLayer = Layer.mergeAll(
  LogService.Default,
  StateService.Default,
  RNGService.Default,
);

// ============================================================================
// STEP 2: Accessor Services (Depend on StateService)
// ============================================================================

// Mock UnitAccessor
export class UnitAccessor extends Context.Tag("UnitAccessor")<
  UnitAccessor,
  {
    readonly getUnit: (unitId: number) => Effect.Effect<{ id: number } | null>;
    readonly getAllUnits: () => Effect.Effect<Array<{ id: number }>>;
  }
>() {
  static Default = Layer.effect(
    this,
    Effect.gen(function* () {
      const state = yield* StateService;
      return {
        getUnit: (unitId: number) =>
          Effect.gen(function* () {
            yield* state.getState(); // Depend on state
            return { id: unitId };
          }),
        getAllUnits: () =>
          Effect.gen(function* () {
            yield* state.getState(); // Depend on state
            return [{ id: 1 }, { id: 2 }];
          }),
      };
    }),
  );
}

// Mock SpellAccessor
export class SpellAccessor extends Context.Tag("SpellAccessor")<
  SpellAccessor,
  {
    readonly getSpell: (
      spellId: number,
    ) => Effect.Effect<{ id: number } | null>;
  }
>() {
  static Default = Layer.effect(
    this,
    Effect.gen(function* () {
      const state = yield* StateService;
      return {
        getSpell: (spellId: number) =>
          Effect.gen(function* () {
            yield* state.getState(); // Depend on state
            return { id: spellId };
          }),
      };
    }),
  );
}

// ============================================================================
// STEP 2 LAYER
// ============================================================================

// Accessors depend on Core services
const AccessorsRaw = Layer.mergeAll(
  UnitAccessor.Default,
  SpellAccessor.Default,
);

export const AccessorLayer = Layer.provide(AccessorsRaw, CoreLayer);

// Full stack so far
export const Step2Layer = Layer.mergeAll(CoreLayer, AccessorLayer);

// ============================================================================
// STEP 3: Dependent Services (Depend on Core + Accessors)
// ============================================================================

// Mock UnitService
export class UnitService extends Context.Tag("UnitService")<
  UnitService,
  {
    readonly add: (unit: { id: number }) => Effect.Effect<void>;
    readonly get: (unitId: number) => Effect.Effect<{ id: number } | null>;
  }
>() {
  static Default = Layer.effect(
    this,
    Effect.gen(function* () {
      const unitAccessor = yield* UnitAccessor;
      const log = yield* LogService;
      return {
        add: (unit: { id: number }) =>
          Effect.gen(function* () {
            yield* log.log(`UnitService: Adding unit ${unit.id}`);
          }),
        get: (unitId: number) =>
          Effect.gen(function* () {
            return yield* unitAccessor.getUnit(unitId);
          }),
      };
    }),
  );
}

// Mock ProjectileService
export class ProjectileService extends Context.Tag("ProjectileService")<
  ProjectileService,
  {
    readonly launch: (projectileId: number) => Effect.Effect<void>;
  }
>() {
  static Default = Layer.effect(
    this,
    Effect.gen(function* () {
      const log = yield* LogService;
      return {
        launch: (projectileId: number) =>
          Effect.gen(function* () {
            yield* log.log(`ProjectileService: Launching ${projectileId}`);
          }),
      };
    }),
  );
}

// Mock PeriodicService
export class PeriodicService extends Context.Tag("PeriodicService")<
  PeriodicService,
  {
    readonly trigger: (periodicId: number) => Effect.Effect<void>;
  }
>() {
  static Default = Layer.effect(
    this,
    Effect.gen(function* () {
      const log = yield* LogService;
      return {
        trigger: (periodicId: number) =>
          Effect.gen(function* () {
            yield* log.log(`PeriodicService: Triggering ${periodicId}`);
          }),
      };
    }),
  );
}

// Mock CastQueueService
export class CastQueueService extends Context.Tag("CastQueueService")<
  CastQueueService,
  {
    readonly enqueue: (spellId: number) => Effect.Effect<void>;
  }
>() {
  static Default = Layer.effect(
    this,
    Effect.gen(function* () {
      const log = yield* LogService;
      return {
        enqueue: (spellId: number) =>
          Effect.gen(function* () {
            yield* log.log(`CastQueueService: Enqueuing spell ${spellId}`);
          }),
      };
    }),
  );
}

// Mock LifecycleService
export class LifecycleService extends Context.Tag("LifecycleService")<
  LifecycleService,
  {
    readonly start: (spellId: number) => Effect.Effect<void>;
  }
>() {
  static Default = Layer.effect(
    this,
    Effect.gen(function* () {
      const log = yield* LogService;
      return {
        start: (spellId: number) =>
          Effect.gen(function* () {
            yield* log.log(`LifecycleService: Starting spell ${spellId}`);
          }),
      };
    }),
  );
}

// ============================================================================
// STEP 3 LAYER
// ============================================================================

// Services that depend on Accessors - provide full stack (Core + Accessors)
const ServiceDeps = Layer.mergeAll(CoreLayer, AccessorLayer);

const UnitLayer = Layer.provide(UnitService.Default, ServiceDeps);
const ProjectileLayer = Layer.provide(ProjectileService.Default, ServiceDeps);
const PeriodicLayer = Layer.provide(PeriodicService.Default, ServiceDeps);
const CastQueueLayer = Layer.provide(CastQueueService.Default, ServiceDeps);
const LifecycleLayer = Layer.provide(LifecycleService.Default, ServiceDeps);

export const Step3Layer = Layer.mergeAll(
  CoreLayer,
  AccessorLayer,
  UnitLayer,
  ProjectileLayer,
  PeriodicLayer,
  CastQueueLayer,
  LifecycleLayer,
);

// ============================================================================
// STEP 4: Higher-level Services (Mimics lib pattern)
// ============================================================================
// COMMENTED OUT - This is where it breaks when following the lib's pattern

/*
// Mock MetadataService
export class MetadataService extends Context.Tag("MetadataService")<
  MetadataService,
  {
    readonly loadSpell: (spellId: number) => Effect.Effect<{ id: number }>;
    readonly loadItem: (itemId: number) => Effect.Effect<{ id: number }>;
  }
>() {
  static Default = Layer.succeed(this, {
    loadSpell: (spellId: number) => Effect.succeed({ id: spellId }),
    loadItem: (itemId: number) => Effect.succeed({ id: itemId }),
  });
}

// Mock ProfileComposer - depends on StateService
export class ProfileComposer extends Context.Tag("ProfileComposer")<
  ProfileComposer,
  {
    readonly compose: (profileId: number) => Effect.Effect<{ id: number }>;
  }
>() {
  static Default = Layer.effect(
    this,
    Effect.gen(function* () {
      const state = yield* StateService;
      return {
        compose: (profileId: number) =>
          Effect.gen(function* () {
            yield* state.getState();
            return { id: profileId };
          }),
      };
    }),
  );
}

// Mock SpellInfoService - depends on StateService and MetadataService
export class SpellInfoService extends Context.Tag("SpellInfoService")<
  SpellInfoService,
  {
    readonly getSpell: (spellId: number) => Effect.Effect<{ id: number }>;
  }
>() {
  static Default = Layer.effect(
    this,
    Effect.gen(function* () {
      const state = yield* StateService;
      const metadata = yield* MetadataService;
      return {
        getSpell: (spellId: number) =>
          Effect.gen(function* () {
            yield* state.getState();
            return yield* metadata.loadSpell(spellId);
          }),
      };
    }),
  );
}

// Mock other services
export class SpellService extends Context.Tag("SpellService")<
  SpellService,
  { readonly cast: (spellId: number) => Effect.Effect<void> }
>() {
  static Default = Layer.effect(
    this,
    Effect.gen(function* () {
      const log = yield* LogService;
      return {
        cast: (spellId: number) =>
          Effect.gen(function* () {
            yield* log.log(`SpellService: Casting spell ${spellId}`);
          }),
      };
    }),
  );
}

export class RotationRefService extends Context.Tag("RotationRefService")<
  RotationRefService,
  { readonly get: () => Effect.Effect<string> }
>() {
  static Default = Layer.effect(
    this,
    Effect.gen(function* () {
      const log = yield* LogService;
      return {
        get: () =>
          Effect.gen(function* () {
            yield* log.log("RotationRefService: Getting rotation ref");
            return "rotation-ref";
          }),
      };
    }),
  );
}

export class SimulationService extends Context.Tag("SimulationService")<
  SimulationService,
  {
    readonly run: (
      rotation: Effect.Effect<void>,
      durationMs: number,
    ) => Effect.Effect<void>;
  }
>() {
  static Default = Layer.effect(
    this,
    Effect.gen(function* () {
      const log = yield* LogService;
      return {
        run: (rotation: Effect.Effect<void>, durationMs: number) =>
          Effect.gen(function* () {
            yield* log.log(`SimulationService: Running for ${durationMs}ms`);
            yield* rotation;
          }),
      };
    }),
  );
}

export class EventSchedulerService extends Context.Tag("EventSchedulerService")<
  EventSchedulerService,
  {
    readonly schedule: (eventId: number, timeMs: number) => Effect.Effect<void>;
  }
>() {
  static Default = Layer.effect(
    this,
    Effect.gen(function* () {
      const log = yield* LogService;
      return {
        schedule: (eventId: number, timeMs: number) =>
          Effect.gen(function* () {
            yield* log.log(`EventSchedulerService: Scheduling ${eventId} at ${timeMs}ms`);
          }),
      };
    }),
  );
}

// ============================================================================
// STEP 4 LAYER - Mimics the lib's AppLayer.create() pattern
// ============================================================================

export const Step4Layer = Layer.mergeAll(
  CoreLayer,
  AccessorLayer,
  UnitLayer,
  ProjectileLayer,
  PeriodicLayer,
  CastQueueLayer,
  LifecycleLayer,
  SpellService.Default,
  RotationRefService.Default,
  SimulationService.Default,
  EventSchedulerService.Default,
).pipe(
  // This is what the lib does
  Layer.provide(MetadataService.Default),
  Layer.provideMerge(ProfileComposer.Default),
  Layer.provideMerge(SpellInfoService.Default),
);

export const testHigherLevelServicesLayer = Effect.gen(function* () {
  const log = yield* LogService;
  const metadata = yield* MetadataService;
  const profileComposer = yield* ProfileComposer;
  const spellInfoService = yield* SpellInfoService;

  yield* log.log("Testing Step 4");

  const spell = yield* metadata.loadSpell(108853);
  yield* log.log(`Loaded spell: ${JSON.stringify(spell)}`);

  const profile = yield* profileComposer.compose(1);
  yield* log.log(`Composed profile: ${JSON.stringify(profile)}`);

  const spellInfo = yield* spellInfoService.getSpell(108853);
  yield* log.log(`Got spell info: ${JSON.stringify(spellInfo)}`);

  return { success: true, message: "Step 4 works!" };
});
*/

// ============================================================================
// TEST PROGRAMS
// ============================================================================

export const testCoreLayer = Effect.gen(function* () {
  const log = yield* LogService;
  const state = yield* StateService;
  const rng = yield* RNGService;

  yield* log.log("Testing Core Layer");

  const currentState = yield* state.getState();
  yield* log.log(`Current time: ${currentState.currentTime}`);

  yield* state.setState({ currentTime: 1000 });
  const newState = yield* state.getState();
  yield* log.log(`Updated time: ${newState.currentTime}`);

  const randomValue = yield* rng.random();
  yield* log.log(`Random value: ${randomValue}`);

  return { success: true, message: "Core Layer works!" };
});

export const testAccessorLayer = Effect.gen(function* () {
  const log = yield* LogService;
  const unitAccessor = yield* UnitAccessor;
  const spellAccessor = yield* SpellAccessor;

  yield* log.log("Testing Accessor Layer");

  const unit = yield* unitAccessor.getUnit(1);
  yield* log.log(`Got unit: ${JSON.stringify(unit)}`);

  const units = yield* unitAccessor.getAllUnits();
  yield* log.log(`Got all units: ${JSON.stringify(units)}`);

  const spell = yield* spellAccessor.getSpell(108853);
  yield* log.log(`Got spell: ${JSON.stringify(spell)}`);

  return { success: true, message: "Accessor Layer works!" };
});

export const testDependentServicesLayer = Effect.gen(function* () {
  const log = yield* LogService;
  const unitService = yield* UnitService;
  const projectileService = yield* ProjectileService;
  const periodicService = yield* PeriodicService;
  const castQueueService = yield* CastQueueService;
  const lifecycleService = yield* LifecycleService;

  yield* log.log("Testing Dependent Services Layer");

  yield* unitService.add({ id: 1 });
  const unit = yield* unitService.get(1);
  yield* log.log(`Got unit from UnitService: ${JSON.stringify(unit)}`);

  yield* projectileService.launch(1);
  yield* periodicService.trigger(2);
  yield* castQueueService.enqueue(108853);
  yield* lifecycleService.start(108853);

  return { success: true, message: "Dependent Services Layer works!" };
});

export const testHigherLevelServicesLayer = Effect.gen(function* () {
  const log = yield* LogService;
  const metadata = yield* MetadataService;
  const profileComposer = yield* ProfileComposer;
  const spellInfoService = yield* SpellInfoService;
  const spellService = yield* SpellService;
  const rotationRefService = yield* RotationRefService;
  const simulationService = yield* SimulationService;
  const eventScheduler = yield* EventSchedulerService;

  yield* log.log("Testing Higher-Level Services Layer");

  const spell = yield* metadata.loadSpell(108853);
  yield* log.log(`Loaded spell: ${JSON.stringify(spell)}`);

  const profile = yield* profileComposer.compose(1);
  yield* log.log(`Composed profile: ${JSON.stringify(profile)}`);

  const spellInfo = yield* spellInfoService.getSpell(108853);
  yield* log.log(`Got spell info: ${JSON.stringify(spellInfo)}`);

  yield* spellService.cast(108853);

  const rotationRef = yield* rotationRefService.get();
  yield* log.log(`Got rotation ref: ${rotationRef}`);

  yield* eventScheduler.schedule(1, 1000);

  const rotation = Effect.gen(function* () {
    yield* log.log("Executing mock rotation");
  });

  yield* simulationService.run(rotation, 5000);

  return { success: true, message: "Higher-Level Services Layer works!" };
});
