import * as Accessors from "@wowlab/services/Accessors";
import * as Log from "@wowlab/services/Log";
import * as Metadata from "@wowlab/services/Metadata";
import * as Rng from "@wowlab/services/Rng";
import * as Rotation from "@wowlab/services/Rotation";
import * as State from "@wowlab/services/State";
import * as Unit from "@wowlab/services/Unit";
import * as Layer from "effect/Layer";

export interface AppLayerOptions<R> {
  readonly logger?: Layer.Layer<Log.LogService>;
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
    State.StateService.Default,
    logger,
    rng,
    metadata,
  );

  const ServicesLayer = Layer.mergeAll(
    Accessors.UnitAccessor.Default,
    Accessors.SpellAccessor.Default,
    Rotation.RotationProviderService.Default,
    Unit.UnitService.Default,
  );

  return ServicesLayer.pipe(Layer.provide(BaseLayer), Layer.merge(BaseLayer));
};
