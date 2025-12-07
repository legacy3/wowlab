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
