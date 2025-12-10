"use client";

import { useCallback, useState, useEffect, useMemo } from "react";
import { useDataProvider } from "@refinedev/core";
import { useQueryClient } from "@tanstack/react-query";
import { createPortalDbcLayer } from "@/lib/services";
import { ExtractorService } from "@wowlab/services/Data";
import * as Effect from "effect/Effect";
import { Hunter } from "@wowlab/specs";
import { getAllSupportedSpellIds } from "@wowlab/specs/Shared";

export interface SpecCoverageSpell {
  id: number;
  name: string;
  supported: boolean;
}

export interface SpecCoverageSpec {
  id: number;
  name: string;
  spells: SpecCoverageSpell[];
}

export interface SpecCoverageClass {
  id: number;
  name: string;
  color: string;
  specs: SpecCoverageSpec[];
}

export interface SpecCoverageData {
  classes: SpecCoverageClass[];
}

export interface UseSpecCoverageResult {
  data: SpecCoverageData | null;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

// TODO Refactor this, it's kinda hacked at the moment
const ALL_CLASSES = [Hunter.Hunter];
const SUPPORTED_SPELL_IDS = getAllSupportedSpellIds(ALL_CLASSES);

export function useSpecCoverage(): UseSpecCoverageResult {
  const dataProvider = useDataProvider()();
  const queryClient = useQueryClient();

  const [data, setData] = useState<SpecCoverageData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetch = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const layer = createPortalDbcLayer(queryClient, dataProvider);

      const result = await Effect.runPromise(
        Effect.gen(function* () {
          const extractor = yield* ExtractorService;

          return yield* extractor.buildSpecCoverage(SUPPORTED_SPELL_IDS);
        }).pipe(Effect.provide(layer)),
      );

      setData(result);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  }, [queryClient, dataProvider]);

  useEffect(() => {
    fetch();
  }, [fetch]);

  return {
    data,
    loading,
    error,
    refetch: fetch,
  };
}

// TODO Move helper fuctions to lib/ or something
export function calculateCoverage(spells: SpecCoverageSpell[]): number {
  if (spells.length === 0) {
    return 0;
  }

  const supported = spells.filter((s) => s.supported).length;

  return Math.round((supported / spells.length) * 100);
}

export function getCounts(spells: SpecCoverageSpell[]) {
  return {
    supported: spells.filter((s) => s.supported).length,
    total: spells.length,
  };
}

export function getOverallStats(data: SpecCoverageData) {
  const allSpells = data.classes.flatMap((c) =>
    c.specs.flatMap((s) => s.spells),
  );
  const supported = allSpells.filter((s) => s.supported).length;

  return {
    totalClasses: data.classes.length,
    totalSpecs: data.classes.reduce((sum, c) => sum + c.specs.length, 0),
    totalSpells: allSpells.length,
    supportedSpells: supported,
    coverage:
      allSpells.length > 0
        ? Math.round((supported / allSpells.length) * 100)
        : 0,
  };
}
