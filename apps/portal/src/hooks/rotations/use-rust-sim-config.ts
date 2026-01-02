"use client";

import {
  buildSimConfig,
  type PlayerConfig,
  type SimConfig,
  type TargetConfig,
} from "@/lib/simulation/rust-config-builder";
import { loadAurasById, loadSpellsById } from "@/lib/simulation/loader";
import { useDataProvider, type DataProvider } from "@refinedev/core";
import { useQueryClient, type QueryClient } from "@tanstack/react-query";
import { useCallback, useState } from "react";

export interface RustSimConfigOptions {
  spellIds: readonly number[];
  duration: number;
  rotationId: string; // UUID of the rotation in rotations table
  player?: Partial<PlayerConfig>;
  target?: Partial<TargetConfig>;
  onProgress?: (phase: string, progress: number) => void;
}

export interface RustSimConfigResult {
  config: SimConfig;
}

export function useRustSimConfig() {
  const queryClient = useQueryClient();
  const dataProvider = useDataProvider();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const build = useCallback(
    async (options: RustSimConfigOptions): Promise<RustSimConfigResult> => {
      const { spellIds, duration, rotationId, player, target, onProgress } =
        options;

      setIsLoading(true);
      setError(null);

      try {
        // Phase 1: Load spells
        onProgress?.("Loading spells", 0);
        const spells = await loadSpellsById(
          spellIds,
          queryClient,
          dataProvider() as DataProvider,
          (progress) => {
            onProgress?.(
              `Loading spell ${progress.currentSpellId}`,
              (progress.loaded / progress.total) * 50,
            );
          },
        );

        // Phase 2: Load auras
        onProgress?.("Loading auras", 50);
        const auras = await loadAurasById(
          spellIds,
          queryClient,
          dataProvider() as DataProvider,
          (progress) => {
            onProgress?.(
              `Loading aura ${progress.currentSpellId}`,
              50 + (progress.loaded / progress.total) * 40,
            );
          },
        );

        // Phase 3: Build config
        onProgress?.("Building config", 95);
        const config = buildSimConfig({
          spells,
          auras,
          duration,
          rotationId,
          player,
          target,
        });

        onProgress?.("Complete", 100);
        return { config };
      } catch (err) {
        const error = err instanceof Error ? err : new Error(String(err));
        setError(error);
        throw error;
      } finally {
        setIsLoading(false);
      }
    },
    [queryClient, dataProvider],
  );

  return {
    build,
    isLoading,
    error,
  };
}

/**
 * Extract spell IDs from a rotation script using regex patterns.
 * Looks for patterns like: spell(12345), cast(12345), 12345 (standalone numbers)
 */
export function extractSpellIdsFromScript(script: string): number[] {
  const ids = new Set<number>();

  // Pattern 1: spell(12345) or cast(12345) or similar
  const funcPattern = /(?:spell|cast|use|summon)\s*\(\s*(\d+)\s*\)/gi;
  let match: RegExpExecArray | null;
  while ((match = funcPattern.exec(script)) !== null) {
    ids.add(parseInt(match[1], 10));
  }

  // Pattern 2: spell_id: 12345 or spellId: 12345
  const assignPattern = /(?:spell_?id|aura_?id)\s*[:=]\s*(\d+)/gi;
  while ((match = assignPattern.exec(script)) !== null) {
    ids.add(parseInt(match[1], 10));
  }

  // Pattern 3: SPELL_NAME = 12345 (constants)
  const constPattern = /[A-Z_]+\s*=\s*(\d{4,})/g;
  while ((match = constPattern.exec(script)) !== null) {
    const num = parseInt(match[1], 10);
    // Only include reasonable spell IDs (4+ digits, < 1M)
    if (num >= 1000 && num < 1_000_000) {
      ids.add(num);
    }
  }

  return Array.from(ids).sort((a, b) => a - b);
}
