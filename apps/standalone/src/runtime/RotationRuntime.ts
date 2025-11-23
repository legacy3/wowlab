import * as Schemas from "@wowlab/core/Schemas";
import * as Context from "@wowlab/rotation/Context";
import { createAppLayer } from "@wowlab/runtime";
import * as Metadata from "@wowlab/services/Metadata";
import * as Layer from "effect/Layer";
import * as Logger from "effect/Logger";
import * as LogLevel from "effect/LogLevel";
import * as ManagedRuntime from "effect/ManagedRuntime";

export interface RotationRuntimeConfig {
  readonly items?: Schemas.Item.ItemDataFlat[];
  readonly logLevel?: LogLevel.LogLevel;
  readonly spells: Schemas.Spell.SpellDataFlat[];
}

export const createRotationRuntime = (config: RotationRuntimeConfig) => {
  // 1. Create metadata layer with spell/item data
  const metadataLayer = Metadata.InMemoryMetadata({
    items: config.items ?? [],
    spells: config.spells,
  });

  // 2. Create base app layer with all core services
  const baseAppLayer = createAppLayer({ metadata: metadataLayer });

  // 3. Build full layer with rotation context and logging
  const fullLayer = Context.RotationContext.Default.pipe(
    Layer.provide(baseAppLayer),
    Layer.merge(baseAppLayer),
    Layer.provide(Logger.pretty),
    Layer.provide(Logger.minimumLogLevel(config.logLevel ?? LogLevel.Debug)),
  );

  // 4. Convert layer to managed runtime
  return ManagedRuntime.make(fullLayer);
};
