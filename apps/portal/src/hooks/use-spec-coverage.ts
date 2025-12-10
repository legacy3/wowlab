"use client";

import { useCallback } from "react";
import { useDataProvider } from "@refinedev/core";
import { useQueryClient } from "@tanstack/react-query";
import { useAtom } from "jotai";
import * as Effect from "effect/Effect";
import * as PubSub from "effect/PubSub";
import * as Queue from "effect/Queue";
import * as Layer from "effect/Layer";
import { Hunter } from "@wowlab/specs";
import { getAllSupportedSpellIds } from "@wowlab/specs/Shared";
import {
  ExtractorService,
  SpecCoverageProgressService,
} from "@wowlab/services/Data";
import { createPortalDbcLayer } from "@/lib/services";
import {
  SpecCoverageProgressLive,
  type SpecCoverageData,
  type SpecCoverageProgress,
} from "@/lib/spec-coverage";
import {
  specCoverageDataAtom,
  specCoverageLoadingAtom,
  specCoverageErrorAtom,
  specCoverageProgressAtom,
} from "@/atoms/spec-coverage";

// Re-export types for convenience
export type { SpecCoverageData, SpecCoverageProgress };
export type {
  SpecCoverageClass,
  SpecCoverageSpec,
  SpecCoverageSpell,
} from "@/lib/spec-coverage";

export interface UseSpecCoverageResult {
  data: SpecCoverageData | null;
  loading: boolean;
  error: string | null;
  progress: SpecCoverageProgress | null;
  fetch: () => Promise<void>;
}

// TODO Refactor this, it's kinda hacked at the moment
const ALL_CLASSES = [Hunter.Hunter];
const SUPPORTED_SPELL_IDS = getAllSupportedSpellIds(ALL_CLASSES);

export function useSpecCoverage(): UseSpecCoverageResult {
  const dataProvider = useDataProvider()();
  const queryClient = useQueryClient();

  const [data, setData] = useAtom(specCoverageDataAtom);
  const [loading, setLoading] = useAtom(specCoverageLoadingAtom);
  const [error, setError] = useAtom(specCoverageErrorAtom);
  const [progress, setProgress] = useAtom(specCoverageProgressAtom);

  const fetch = useCallback(async () => {
    if (loading) {
      return;
    }

    setLoading(true);
    setError(null);
    setProgress(null);

    try {
      const dbcLayer = createPortalDbcLayer(queryClient, dataProvider);
      const progressLayer = SpecCoverageProgressLive;
      const fullLayer = Layer.mergeAll(dbcLayer, progressLayer);

      const result = await Effect.runPromise(
        Effect.scoped(
          Effect.gen(function* () {
            const progressService = yield* SpecCoverageProgressService;

            // Subscribe to progress updates (scoped - auto-unsubscribes)
            const dequeue = yield* PubSub.subscribe(progressService.pubsub);

            // Fork fiber to consume progress and update React state
            yield* Effect.fork(
              Effect.gen(function* () {
                while (true) {
                  const msg = yield* Queue.take(dequeue);

                  yield* Effect.sync(() => setProgress(msg));
                }
              }),
            );

            const extractor = yield* ExtractorService;

            return yield* extractor.buildSpecCoverage(SUPPORTED_SPELL_IDS);
          }),
        ).pipe(Effect.provide(fullLayer)),
      );

      setData(result);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  }, [
    queryClient,
    dataProvider,
    loading,
    setData,
    setLoading,
    setError,
    setProgress,
  ]);

  return { data, loading, error, progress, fetch };
}
