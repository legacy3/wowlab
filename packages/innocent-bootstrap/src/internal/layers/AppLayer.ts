import * as RotationActions from "@packages/innocent-rotation/Actions";
import * as RotationContext from "@packages/innocent-rotation/Context";
import * as Accessors from "@packages/innocent-services/Accessors";
import * as CastQueue from "@packages/innocent-services/CastQueue";
import { SpellInfoServiceLive } from "@packages/innocent-services/Data";
import * as Data from "@packages/innocent-services/Data";
import * as Lifecycle from "@packages/innocent-services/Lifecycle";
import * as Log from "@packages/innocent-services/Log";
import * as Metadata from "@packages/innocent-services/Metadata";
import * as Periodic from "@packages/innocent-services/Periodic";
import * as Profile from "@packages/innocent-services/Profile";
import * as Projectile from "@packages/innocent-services/Projectile";
import * as Rng from "@packages/innocent-services/Rng";
import * as RotationRef from "@packages/innocent-services/Rotation";
import * as Scheduler from "@packages/innocent-services/Scheduler";
import * as Simulation from "@packages/innocent-services/Simulation";
import * as Spell from "@packages/innocent-services/Spell";
import * as State from "@packages/innocent-services/State";
import * as Unit from "@packages/innocent-services/Unit";
import * as Layer from "effect/Layer";

// 1. Core Services (State, Log, RNG)
// These are the roots. We use .Default to create them.
const CoreLayer = Layer.mergeAll(
  Log.LogService.Default,
  State.StateService.Default,
  Rng.RNGService.Default,
);

// 2. Independent Services (Scheduler, RotationRef, ProfileComposer)
// These don't depend on StateService (or use their own internal state like Ref/FiberRef)
const IndependentLayer = Layer.mergeAll(
  Scheduler.EventSchedulerService.Default,
  RotationRef.RotationRefService.Default,
  Profile.ProfileComposer.Default,
);

// 3. Accessors (Depend on StateService)
// We must construct them manually to use the shared StateService from CoreLayer
const AccessorLayer = Layer.mergeAll(
  // @ts-ignore
  Accessors.UnitAccessor.DefaultWithoutDependencies,
  // @ts-ignore
  Accessors.SpellAccessor.DefaultWithoutDependencies,
).pipe(Layer.provide(CoreLayer));

// 4. Base Dependencies for Higher Level Services
// Core + Independent + Accessors
const BaseDeps = Layer.mergeAll(CoreLayer, IndependentLayer, AccessorLayer);

// 5. Dependent Services (Depend on State, Accessors, Scheduler, etc.)
// We construct them manually to ensure they use the shared instances.

// UnitService depends on State, UnitAccessor, Scheduler
// @ts-ignore
const UnitLayer = Unit.UnitService.DefaultWithoutDependencies.pipe(
  Layer.provide(BaseDeps),
);

// SpellService depends on State
// @ts-ignore
const SpellLayer = Spell.SpellService.DefaultWithoutDependencies.pipe(
  Layer.provide(BaseDeps),
);

// LifecycleService depends on State, Accessors, etc.
// @ts-ignore
const LifecycleLayer = Lifecycle.SpellLifecycleService.Default.pipe(
  Layer.provide(BaseDeps),
);

// ProjectileService depends on State, Accessors, etc.
// @ts-ignore
const ProjectileLayer =
  Projectile.ProjectileService.DefaultWithoutDependencies.pipe(
    Layer.provide(BaseDeps),
  );

// CastQueueService depends on Lifecycle, Scheduler, State, Accessors, Unit, RotationRef, Log
// It needs UnitLayer and LifecycleLayer too.
const CastQueueDeps = Layer.mergeAll(BaseDeps, UnitLayer, LifecycleLayer);
// @ts-ignore
const CastQueueLayer =
  CastQueue.CastQueueService.DefaultWithoutDependencies.pipe(
    Layer.provide(CastQueueDeps),
  );

// PeriodicTriggerService depends on State, Unit, Accessors, Scheduler, SpellAccessor, CastQueue
const PeriodicDeps = Layer.mergeAll(BaseDeps, UnitLayer, CastQueueLayer);
// @ts-ignore
const PeriodicLayer =
  Periodic.PeriodicTriggerService.DefaultWithoutDependencies.pipe(
    Layer.provide(PeriodicDeps),
  );

// SimulationService depends on State, Unit, Scheduler, RotationRef, Periodic
const SimulationDeps = Layer.mergeAll(BaseDeps, UnitLayer, PeriodicLayer);
// @ts-ignore
const SimulationLayer =
  Simulation.SimulationService.DefaultWithoutDependencies.pipe(
    Layer.provide(SimulationDeps),
  );

// Rotation Actions
const RotationActionsDeps = Layer.mergeAll(
  BaseDeps,
  UnitLayer,
  SpellLayer,
  CastQueueLayer,
);

// @ts-ignore
const UnitActionsLayer =
  RotationActions.UnitActions.DefaultWithoutDependencies.pipe(
    Layer.provide(RotationActionsDeps),
  );

// @ts-ignore
const SpellActionsLayer =
  RotationActions.SpellActions.DefaultWithoutDependencies.pipe(
    Layer.provide(RotationActionsDeps),
  );

// @ts-ignore
const ControlActionsLayer = RotationActions.ControlActions.Default.pipe(
  Layer.provide(RotationActionsDeps),
);

const RotationActionsLayer = Layer.mergeAll(
  UnitActionsLayer,
  SpellActionsLayer,
  ControlActionsLayer,
);

// Rotation Context
// @ts-ignore
const RotationContextLayer =
  RotationContext.RotationContext.DefaultWithoutDependencies.pipe(
    Layer.provide(RotationActionsLayer),
  );

export const create = <R>(
  metadataLayer: Layer.Layer<Metadata.MetadataService, never, R>,
) => {
  // SpellInfoService depends on Metadata, Profile, Modifiers (runtime?)
  const SpellInfoDeps = Layer.mergeAll(
    metadataLayer,
    IndependentLayer, // Contains ProfileComposer
  );

  const SpellInfoLayer = SpellInfoServiceLive.pipe(
    Layer.provide(SpellInfoDeps),
  );

  return Layer.mergeAll(
    CoreLayer,
    IndependentLayer,
    AccessorLayer,
    UnitLayer,
    SpellLayer,
    LifecycleLayer,
    ProjectileLayer,
    CastQueueLayer,
    PeriodicLayer,
    SimulationLayer,
    SpellInfoLayer,
    metadataLayer,
    RotationActionsLayer,
    RotationContextLayer,
  );
};
