import * as Schemas from "@wowlab/core/Schemas";
import * as Context from "@wowlab/rotation/Context";
import { createAppLayer } from "@wowlab/runtime";
import * as Config from "@wowlab/services/Config";
import * as Metadata from "@wowlab/services/Metadata";
import * as Effect from "effect/Effect";
import * as Layer from "effect/Layer";
import * as Logger from "effect/Logger";
import * as LogLevel from "effect/LogLevel";
import * as ManagedRuntime from "effect/ManagedRuntime";

export interface BrowserRuntimeConfig {
  auras?: Schemas.Aura.AuraDataFlat[];
  items?: Schemas.Item.ItemDataFlat[];
  spells: Schemas.Spell.SpellDataFlat[];
}

const initializeSimulationConfig = (
  config: BrowserRuntimeConfig,
): Effect.Effect<void, never, Config.SimulationConfigService> =>
  Effect.gen(function* () {
    const configService = yield* Config.SimulationConfigService;
    const auraMap = new Map((config.auras ?? []).map((a) => [a.spellId, a]));
    const spellMap = new Map(config.spells.map((s) => [s.id, s]));

    yield* configService.setConfig({
      auras: auraMap,
      spells: spellMap,
    });
  });

export function createBrowserRuntime(config: BrowserRuntimeConfig) {
  const metadataLayer = Metadata.InMemoryMetadata({
    items: config.items ?? [],
    spells: config.spells,
  });

  const baseAppLayer = createAppLayer({ metadata: metadataLayer });

  const loggerLayer = Layer.merge(
    Logger.replace(Logger.defaultLogger, Logger.none),
    Logger.minimumLogLevel(LogLevel.None),
  );

  const configInitLayer = Layer.effectDiscard(
    initializeSimulationConfig(config),
  ).pipe(Layer.provide(baseAppLayer));

  const fullLayer = Context.RotationContext.Default.pipe(
    Layer.provide(baseAppLayer),
    Layer.merge(baseAppLayer),
    Layer.provide(loggerLayer),
    Layer.provide(configInitLayer),
  );

  return ManagedRuntime.make(fullLayer);
}

export type BrowserRuntime = Awaited<ReturnType<typeof createBrowserRuntime>>;
