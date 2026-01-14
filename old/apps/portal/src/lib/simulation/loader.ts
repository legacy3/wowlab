import { createPortalDbcLayer } from "@/lib/services/dbc-layer";
import {
  ExtractorService,
  transformAura,
  transformSpell,
} from "@wowlab/services/Data";
import type { DataProvider } from "@refinedev/core";
import type { QueryClient } from "@tanstack/react-query";
import * as Effect from "effect/Effect";
import * as Layer from "effect/Layer";
import * as Ref from "effect/Ref";

import type { RotationDefinition } from "./types";

export interface SpellLoadProgress {
  loaded: number;
  total: number;
  currentSpellId: number;
}

export type OnSpellProgress = (progress: SpellLoadProgress) => void;

async function loadSpellsInternal(
  spellIds: readonly number[],
  queryClient: QueryClient,
  dataProvider: DataProvider,
  onProgress?: OnSpellProgress,
) {
  const total = spellIds.length;

  const dbcLayer = createPortalDbcLayer(queryClient, dataProvider);
  const extractorLayer = Layer.provide(ExtractorService.Default, dbcLayer);
  const appLayer = Layer.mergeAll(dbcLayer, extractorLayer);

  // Load spells with progress tracking using atomic counter
  const spells = await Effect.runPromise(
    Effect.gen(function* () {
      // Atomic counter for accurate progress with concurrency
      const loadedCount = yield* Ref.make(0);

      return yield* Effect.forEach(
        spellIds,
        (spellId) =>
          Effect.gen(function* () {
            const spell = yield* transformSpell(spellId);

            // Atomically increment and report progress
            const loaded = yield* Ref.updateAndGet(loadedCount, (n) => n + 1);
            onProgress?.({
              loaded,
              total,
              currentSpellId: spellId,
            });

            return spell;
          }),
        { concurrency: "unbounded", batching: true },
      );
    }).pipe(Effect.provide(appLayer)),
  );

  return spells;
}

/**
 * Loads all spells needed for a rotation.
 * Uses existing dbcLayer (React Query + IndexedDB cache).
 */
export async function loadSpellsForRotation(
  rotation: RotationDefinition,
  queryClient: QueryClient,
  dataProvider: DataProvider,
  onProgress?: OnSpellProgress,
) {
  return loadSpellsInternal(
    rotation.spellIds,
    queryClient,
    dataProvider,
    onProgress,
  );
}

export async function loadSpellsById(
  spellIds: readonly number[],
  queryClient: QueryClient,
  dataProvider: DataProvider,
  onProgress?: OnSpellProgress,
) {
  return loadSpellsInternal(spellIds, queryClient, dataProvider, onProgress);
}

export interface AuraLoadProgress {
  loaded: number;
  total: number;
  currentSpellId: number;
}

export type OnAuraProgress = (progress: AuraLoadProgress) => void;

async function loadAurasInternal(
  spellIds: readonly number[],
  queryClient: QueryClient,
  dataProvider: DataProvider,
  onProgress?: OnAuraProgress,
) {
  const total = spellIds.length;

  const dbcLayer = createPortalDbcLayer(queryClient, dataProvider);
  const extractorLayer = Layer.provide(ExtractorService.Default, dbcLayer);
  const appLayer = Layer.mergeAll(dbcLayer, extractorLayer);

  const auras = await Effect.runPromise(
    Effect.gen(function* () {
      const loadedCount = yield* Ref.make(0);

      const results = yield* Effect.forEach(
        spellIds,
        (spellId) =>
          Effect.gen(function* () {
            const aura = yield* Effect.either(transformAura(spellId));

            const loaded = yield* Ref.updateAndGet(loadedCount, (n) => n + 1);
            onProgress?.({
              loaded,
              total,
              currentSpellId: spellId,
            });

            return aura._tag === "Right" ? aura.right : null;
          }),
        { concurrency: "unbounded", batching: true },
      );

      return results.filter((r): r is NonNullable<typeof r> => r !== null);
    }).pipe(Effect.provide(appLayer)),
  );

  return auras;
}

export async function loadAurasForRotation(
  rotation: RotationDefinition,
  queryClient: QueryClient,
  dataProvider: DataProvider,
  onProgress?: OnAuraProgress,
) {
  return loadAurasInternal(
    rotation.spellIds,
    queryClient,
    dataProvider,
    onProgress,
  );
}

export async function loadAurasById(
  spellIds: readonly number[],
  queryClient: QueryClient,
  dataProvider: DataProvider,
  onProgress?: OnAuraProgress,
) {
  return loadAurasInternal(spellIds, queryClient, dataProvider, onProgress);
}
