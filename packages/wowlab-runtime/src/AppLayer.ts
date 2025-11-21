import * as Accessors from "@wowlab/services/Accessors";
import * as Log from "@wowlab/services/Log";
import * as Metadata from "@wowlab/services/Metadata";
import * as Rng from "@wowlab/services/Rng";
import * as Scheduler from "@wowlab/services/Scheduler";
import * as Simulation from "@wowlab/services/Simulation";
import * as Spell from "@wowlab/services/Spell";
import * as State from "@wowlab/services/State";
import * as Unit from "@wowlab/services/Unit";
import * as Layer from "effect/Layer";

/**
 * Creates the application layer with pluggable services.
 *
 * CRITICAL: Uses Effect.Service dependencies correctly.
 * NO @ts-ignore needed - Effect handles dependency resolution automatically.
 */
export interface AppLayerOptions<R> {
  // Optional: defaults provided
  readonly logger?: Layer.Layer<Log.LogService>;

  // Required: consumer must provide metadata
  readonly metadata: Layer.Layer<Metadata.MetadataService, never, R>;

  readonly rng?: Layer.Layer<Rng.RNGService>;
}

export const createAppLayer = <R>(options: AppLayerOptions<R>) => {
  const {
    logger = Log.ConsoleLogger,
    metadata,
    rng = Rng.RNGServiceDefault,
  } = options;

  const BaseLayer = Layer.mergeAll(
    State.StateServiceLive,
    logger,
    rng,
    metadata,
  );

  const ServicesLayer = Layer.mergeAll(
    Scheduler.EventSchedulerService.Default,
    Accessors.UnitAccessor.Default,
    Accessors.SpellAccessor.Default,
    Unit.UnitService.Default,
    Spell.SpellService.Default,
    Simulation.SimulationService.Default,
  );

  return ServicesLayer.pipe(Layer.provide(BaseLayer), Layer.merge(BaseLayer));
};
