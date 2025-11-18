import * as RotationActions from "@packages/innocent-rotation/Actions";
import * as RotationContext from "@packages/innocent-rotation/Context";
import * as Accessors from "@packages/innocent-services/Accessors";
import * as CastQueue from "@packages/innocent-services/CastQueue";
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

// Core services (no dependencies)
const CoreLayer = Layer.mergeAll(
  Log.LogService.Default,
  State.StateService.Default,
  Rng.RNGService.Default,
);

// Accessors layer - just the raw accessors
const AccessorsRaw = Layer.mergeAll(
  Accessors.UnitAccessor.Default,
  Accessors.SpellAccessor.Default,
);

// Provide Core to Accessors (Accessors depend on State)
const AccessorLayer = Layer.provide(AccessorsRaw, CoreLayer);

// Services that depend on Accessors - provide full stack (Core + Accessors)
const ServiceDeps = Layer.mergeAll(CoreLayer, AccessorLayer);

const UnitLayer = Layer.provide(Unit.UnitService.Default, ServiceDeps);
const ProjectileLayer = Layer.provide(
  Projectile.ProjectileService.Default,
  ServiceDeps,
);
const PeriodicLayer = Layer.provide(
  Periodic.PeriodicTriggerService.Default,
  ServiceDeps,
);
const CastQueueLayer = Layer.provide(
  CastQueue.CastQueueService.Default,
  ServiceDeps,
);
const LifecycleLayer = Layer.provide(
  Lifecycle.SpellLifecycleService.Default,
  ServiceDeps,
);

export const create = <R>(
  metadataLayer: Layer.Layer<Metadata.MetadataService, never, R>,
) => {
  return Layer.mergeAll(
    CoreLayer,
    AccessorLayer,
    UnitLayer,
    ProjectileLayer,
    PeriodicLayer,
    CastQueueLayer,
    LifecycleLayer,
    Spell.SpellService.Default,
    RotationRef.RotationRefService.Default,
    Simulation.SimulationService.Default,
    Scheduler.EventSchedulerService.Default,
    RotationActions.UnitActions.Default,
    RotationActions.SpellActions.Default,
    RotationActions.ControlActions.Default,
    RotationContext.RotationContext.Default,
  ).pipe(
    // Provide MetadataService (external dependency)
    Layer.provide(metadataLayer),

    // Merge ProfileComposer and SpellInfoService (share StateService instance)
    Layer.provideMerge(Profile.ProfileComposer.Default),
    Layer.provideMerge(Data.SpellInfoService.Default),
  );
};
