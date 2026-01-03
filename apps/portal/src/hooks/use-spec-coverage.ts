"use client";

import { useCallback } from "react";
import { useAtom } from "jotai";
import {
  type SpecCoverageData,
  type SpecCoverageProgress,
  type UntrackedSpell,
} from "@/lib/spec-coverage";
import {
  specCoverageDataAtom,
  specCoverageLoadingAtom,
  specCoverageErrorAtom,
  specCoverageProgressAtom,
  untrackedSpellsAtom,
} from "@/atoms/lab";

// Re-export types for convenience
export type { SpecCoverageData, SpecCoverageProgress, UntrackedSpell };
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
  untrackedSpells: UntrackedSpell[];
  fetch: () => Promise<void>;
}

// TODO: Spec coverage will be reimplemented using Rust engine TOML specs
// For now, returns empty data since the TS simulation packages were removed

export function useSpecCoverage(): UseSpecCoverageResult {
  const [data, setData] = useAtom(specCoverageDataAtom);
  const [loading, setLoading] = useAtom(specCoverageLoadingAtom);
  const [error, setError] = useAtom(specCoverageErrorAtom);
  const [progress, setProgress] = useAtom(specCoverageProgressAtom);
  const [untrackedSpells] = useAtom(untrackedSpellsAtom);

  const fetch = useCallback(async () => {
    if (loading) {
      return;
    }

    setLoading(true);
    setError(null);
    setProgress(null);

    // Return empty data - spec coverage needs reimplementation for Rust engine
    setData({ classes: [] });
    setError(
      "Spec coverage is being migrated to the Rust simulation engine. Check back soon!",
    );
    setLoading(false);
  }, [loading, setData, setLoading, setError, setProgress]);

  return { data, loading, error, progress, untrackedSpells, fetch };
}
