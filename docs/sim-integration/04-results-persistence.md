# Phase 4: Results & Persistence

> Run the simulation loop, display results, and upload to Supabase.

## What To Create

```
apps/portal/src/lib/simulation/
└── runner.ts    # Execute simulation loop with progress

apps/portal/src/hooks/
└── use-simulation.ts    # Full simulation hook for UI
```

## Step 1: Create Simulation Runner

```typescript
// apps/portal/src/lib/simulation/runner.ts

import * as Effect from "effect/Effect";
import * as Schemas from "@wowlab/core/Schemas";
import * as CombatLogService from "@wowlab/services/CombatLog";
import * as State from "@wowlab/services/State";
import * as Unit from "@wowlab/services/Unit";
import * as Metadata from "@wowlab/services/Metadata";
import * as Hunter from "@wowlab/specs/Hunter";
import * as Shared from "@wowlab/specs/Shared";
import type { BrowserRuntime } from "./runtime";
import type { RotationDefinition, SimulationResult } from "./types";

export interface RunProgress {
  currentTime: number;
  totalTime: number;
  casts: number;
}

export type OnRunProgress = (progress: RunProgress) => void;

/**
 * Creates a player unit for the rotation using metadata service.
 */
const createRotationPlayer = (
  playerId: Schemas.Branded.UnitID,
  rotationSpellIds: readonly number[],
) =>
  Effect.gen(function* () {
    const metadata = yield* Metadata.MetadataService;

    // Get spells from metadata (already loaded in runtime config)
    const spellMap = new Map<number, Schemas.Spell.SpellDataFlat>();
    for (const spellId of rotationSpellIds) {
      const spell = yield* metadata.getSpell(spellId);
      if (spell) {
        spellMap.set(spellId, spell);
      }
    }

    // Create player unit
    return {
      id: playerId,
      name: "Player",
      type: "player" as const,
      level: 80,
      health: 100000,
      maxHealth: 100000,
      spells: spellMap,
      auras: new Map(),
      power: new Map([["focus", { current: 100, max: 100 }]]),
    };
  });

/**
 * Runs the simulation loop in the browser.
 */
export async function runSimulationLoop(
  runtime: BrowserRuntime,
  rotation: RotationDefinition,
  durationMs: number,
  onProgress?: OnRunProgress,
): Promise<SimulationResult> {
  return runtime.runPromise(
    Effect.gen(function* () {
      // Register spec (Hunter BM for now)
      yield* Shared.registerSpec(Hunter.BeastMastery);

      // Create and register the player unit
      const playerId = Schemas.Branded.UnitID("player-1");
      const player = yield* createRotationPlayer(playerId, rotation.spellIds);

      const unitService = yield* Unit.UnitService;
      yield* unitService.add(player);

      // Reset state for clean simulation
      const stateService = yield* State.StateService;
      yield* stateService.reset();

      const simDriver = yield* CombatLogService.SimDriver;

      const events: Schemas.CombatLog.CombatLogEvent[] = [];
      let casts = 0;
      let totalDamage = 0;

      // Subscribe to combat events
      const subscription = yield* simDriver.subscribe({
        filter: ["SPELL_CAST_SUCCESS", "SPELL_DAMAGE", "SPELL_AURA_APPLIED"],
        onEvent: (event) => {
          events.push(event);
          if (event.type === "SPELL_DAMAGE") {
            totalDamage += event.amount ?? 0;
          }
          return Effect.void;
        },
      });

      // Main simulation loop
      const tickInterval = 100; // 100ms per tick
      let currentTime = 0;

      while (currentTime < durationMs) {
        // Execute rotation priority list
        yield* rotation.run(playerId);
        casts++;

        // Advance simulation time
        yield* simDriver.run(currentTime + tickInterval);
        currentTime += tickInterval;

        // Report progress (every 10 ticks to reduce overhead)
        if (casts % 10 === 0) {
          onProgress?.({
            currentTime,
            totalTime: durationMs,
            casts,
          });
        }
      }

      yield* subscription.unsubscribe;

      const dps = totalDamage / (durationMs / 1000);

      return {
        events,
        casts,
        durationMs,
        totalDamage,
        dps,
      };
    }),
  );
}
```

## Step 2: Create Full Simulation Hook

```typescript
// apps/portal/src/hooks/use-simulation.ts

"use client";

import { useState, useCallback } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useDataProvider } from "@refinedev/core";
import { useSetAtom } from "jotai";
import {
  createSimJobAtom,
  updateSimPhaseAtom,
  updateSimProgressAtom,
  completeSimJobAtom,
  failSimJobAtom,
} from "@/atoms/simulation/job";
import {
  loadSpellsForRotation,
  createBrowserRuntime,
  runSimulationLoop,
  type RotationDefinition,
  type SimulationResult,
} from "@/lib/simulation";
import { uploadSimulationResult } from "@/lib/simulation/upload";

export interface SimulationState {
  isRunning: boolean;
  result: SimulationResult | null;
  error: Error | null;
  jobId: string | null;
  resultId: string | null; // Supabase record ID for viewing/sharing
}

export interface UseSimulationOptions {
  onComplete?: (result: SimulationResult) => void;
  onError?: (error: Error) => void;
}

export function useSimulation(options?: UseSimulationOptions) {
  const [state, setState] = useState<SimulationState>({
    isRunning: false,
    result: null,
    error: null,
    jobId: null,
    resultId: null,
  });

  const queryClient = useQueryClient();
  const dataProvider = useDataProvider()();

  const createJob = useSetAtom(createSimJobAtom);
  const updatePhase = useSetAtom(updateSimPhaseAtom);
  const updateProgress = useSetAtom(updateSimProgressAtom);
  const completeJob = useSetAtom(completeSimJobAtom);
  const failJob = useSetAtom(failSimJobAtom);

  const run = useCallback(
    async (rotation: RotationDefinition, durationSeconds: number) => {
      const durationMs = durationSeconds * 1000;

      setState({
        isRunning: true,
        result: null,
        error: null,
        jobId: null,
        resultId: null,
      });

      // Create job in computing drawer
      const jobId = createJob({
        name: `${rotation.name} Simulation`,
        rotationId: rotation.name.toLowerCase().replace(/\s+/g, "-"),
        totalIterations: Math.ceil(durationMs / 100), // Approx ticks
      });

      setState((prev) => ({ ...prev, jobId }));

      try {
        // Phase 1: Load spells
        updatePhase({
          jobId,
          phase: "preparing-spells",
          detail: "Loading spell data",
        });

        const spells = await loadSpellsForRotation(
          rotation,
          queryClient,
          dataProvider,
          (progress) => {
            updatePhase({
              jobId,
              phase: "preparing-spells",
              detail: `Loading spell ${progress.loaded}/${progress.total}`,
            });
          },
        );

        // Phase 2: Create runtime
        updatePhase({
          jobId,
          phase: "booting-engine",
          detail: "Initializing Effect runtime",
        });

        const runtime = createBrowserRuntime({ spells });

        // Phase 3: Run simulation
        updatePhase({
          jobId,
          phase: "running",
          detail: "Executing rotation",
        });

        const result = await runSimulationLoop(
          runtime,
          rotation,
          durationMs,
          (progress) => {
            const percent = Math.round(
              (progress.currentTime / progress.totalTime) * 100,
            );
            const remaining = Math.ceil(
              (progress.totalTime - progress.currentTime) / 1000,
            );

            updateProgress({
              jobId,
              current: progress.currentTime,
              total: progress.totalTime,
              eta: `${remaining}s remaining`,
            });
          },
        );

        // Cleanup runtime
        await runtime.dispose();

        // Phase 4: Upload results
        updatePhase({
          jobId,
          phase: "uploading",
          detail: "Saving results to database",
        });

        const resultId = await uploadSimulationResult({ result, rotation });

        // Mark complete
        completeJob({ jobId, resultId });

        setState({
          isRunning: false,
          result,
          error: null,
          jobId,
          resultId, // Surface the Supabase record ID
        });

        options?.onComplete?.(result);

        return result;
      } catch (error) {
        const err = error instanceof Error ? error : new Error(String(error));

        failJob({
          jobId,
          error: err.message,
        });

        setState({
          isRunning: false,
          result: null,
          error: err,
          jobId,
          resultId: null,
        });

        options?.onError?.(err);

        throw err;
      }
    },
    [
      queryClient,
      dataProvider,
      createJob,
      updatePhase,
      updateProgress,
      completeJob,
      failJob,
      options,
    ],
  );

  return {
    run,
    ...state,
  };
}
```

## Step 3: Create Upload Function

```typescript
// apps/portal/src/lib/simulation/upload.ts

import { createClient } from "@/lib/supabase/client";
import type { SimulationResult, RotationDefinition } from "./types";

export interface UploadParams {
  result: SimulationResult;
  rotation: RotationDefinition;
  rotationDbId?: string; // UUID from rotations table if linked
}

/**
 * Uploads simulation result to Supabase.
 * Returns the created record ID.
 */
export async function uploadSimulationResult(
  params: UploadParams,
): Promise<string> {
  const { result, rotation, rotationDbId } = params;
  const supabase = createClient();

  // Get current user (optional - supports anonymous)
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data, error } = await supabase
    .from("rotation_sim_results")
    .insert({
      user_id: user?.id ?? null,
      rotation_id: rotationDbId ?? null,
      duration: result.durationMs / 1000,
      iterations: 1,
      fight_type: "patchwerk",
      mean_dps: result.dps,
      min_dps: result.dps,
      max_dps: result.dps,
      std_dev: 0,
      timeline: result.events,
      sim_version: "0.1.0",
      // Store rotation name for display even without DB link
      scenario: { rotationName: rotation.name },
    })
    .select("id")
    .single();

  if (error) {
    console.error("Failed to upload simulation result:", error);
    throw new Error(`Upload failed: ${error.message}`);
  }

  return data.id;
}
```

## Step 4: Wire to UI

```typescript
// apps/portal/src/components/simulate/quick-sim-content.tsx

"use client";

import { useSimulation } from "@/hooks/use-simulation";
import { BeastMasteryRotation } from "@/lib/simulation";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export function QuickSimContent() {
  const { run, isRunning, result, error, resultId } = useSimulation({
    onComplete: (result) => {
      console.log("Simulation complete!", result);
    },
  });

  const handleRun = async () => {
    await run(BeastMasteryRotation, 60); // 60 second fight
  };

  return (
    <div className="space-y-4">
      <Button onClick={handleRun} disabled={isRunning}>
        {isRunning ? "Running..." : "Run Simulation"}
      </Button>

      {result && (
        <div className="p-4 bg-muted rounded space-y-2">
          <p>DPS: {Math.round(result.dps).toLocaleString()}</p>
          <p>Total Damage: {result.totalDamage.toLocaleString()}</p>
          <p>Casts: {result.casts}</p>
          <p>Events: {result.events.length}</p>

          {/* Link to saved result */}
          {resultId && (
            <Link
              href={`/simulate/results/${resultId}`}
              className="text-sm text-primary underline"
            >
              View full results →
            </Link>
          )}
        </div>
      )}

      {error && (
        <div className="p-4 bg-destructive/10 text-destructive rounded">
          {error.message}
        </div>
      )}
    </div>
  );
}
```

## Step 5: Update Exports

```typescript
// apps/portal/src/lib/simulation/index.ts

export * from "./types";
export * from "./runtime";
export * from "./rotation-utils";
export * from "./loader";
export * from "./runner";
export * from "./upload";
export { getRotation, listRotations, BeastMasteryRotation } from "./rotations";
```

## Checklist

- [ ] Create `lib/simulation/runner.ts` with `runSimulationLoop`
- [ ] Create `lib/simulation/upload.ts` with `uploadSimulationResult`
- [ ] Create `hooks/use-simulation.ts` with full flow
- [ ] Update `lib/simulation/index.ts` exports
- [ ] Wire to `quick-sim-content.tsx`
- [ ] Test: Run simulation, verify results display
- [ ] Test: Verify result uploaded to Supabase

## Data Flow

```
1. User clicks "Run Simulation"
2. Job created in computing drawer
3. Spells load from cache/Supabase
4. Browser runtime boots
5. Simulation loop executes
6. Events collected
7. Results uploaded to Supabase
8. Job marked complete
9. Results displayed in UI
```

## Success Criteria

1. Click "Run Simulation" → computing drawer shows job
2. Phases progress: preparing → booting → running → uploading → completed
3. Results display DPS, damage, casts
4. Result saved to Supabase `rotation_sim_results` table
5. No server-side execution (all client-side)

## Cleanup & Next Steps

After this phase works:

1. **Display results in timeline/charts** - Wire to existing viz components
2. **Handle large simulations** - Web Worker for background execution
3. **Batch simulations** - Run multiple iterations for stat accuracy
4. **Results history** - Show past simulations in UI
