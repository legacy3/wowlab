import * as Schemas from "@wowlab/core/Schemas";
import * as Entities from "@wowlab/core/Entities";
import * as CombatLogService from "@wowlab/services/CombatLog";
import * as State from "@wowlab/services/State";
import * as Unit from "@wowlab/services/Unit";
import * as Hunter from "@wowlab/specs/Hunter";
import * as Shared from "@wowlab/specs/Shared";
import * as Effect from "effect/Effect";

import type { BrowserRuntime } from "./runtime";
import type {
  RotationDefinition,
  SimulationEvent,
  SimulationResult,
} from "./types";
import type { ResourceSnapshot } from "./transform-events";
import { createPlayerWithSpells } from "./rotation-utils";

export interface RunProgress {
  currentTime: number;
  totalTime: number;
  casts: number;
}

export type OnRunProgress = (progress: RunProgress) => void;

/**
 * Event types collected for timeline visualization.
 * See docs/sim-integration/05-event-collection.md for details.
 */
const EVENT_STREAM_FILTER = [
  // Casts
  "SPELL_CAST_START",
  "SPELL_CAST_SUCCESS",
  "SPELL_CAST_FAILED",

  // Damage
  "SPELL_DAMAGE",
  "SPELL_PERIODIC_DAMAGE",

  // Auras
  "SPELL_AURA_APPLIED",
  "SPELL_AURA_REMOVED",
  "SPELL_AURA_REFRESH",
  "SPELL_AURA_APPLIED_DOSE",
  "SPELL_AURA_REMOVED_DOSE",

  // Resources
  "SPELL_ENERGIZE",
  "SPELL_DRAIN",
] as const;

/**
 * Runs the simulation loop in the browser.
 * Duration is in SECONDS (matching standalone/CLI pattern).
 */
export async function runSimulationLoop(
  runtime: BrowserRuntime,
  rotation: RotationDefinition,
  durationSeconds: number,
  spells: Schemas.Spell.SpellDataFlat[],
  onProgress?: OnRunProgress,
): Promise<SimulationResult> {
  return runtime.runPromise(
    Effect.gen(function* () {
      // Register spec handlers (required for damage/aura processing)
      yield* Shared.registerSpec(Hunter.BeastMastery);

      // Reset state to fresh GameState before simulation
      const stateService = yield* State.StateService;
      yield* stateService.setState(Entities.GameState.createGameState());

      // Create and register the player unit
      const playerId = Schemas.Branded.UnitID("player-1");
      const player = createPlayerWithSpells(
        playerId,
        rotation.name,
        rotation.spellIds,
        spells,
      );

      const unitService = yield* Unit.UnitService;
      yield* unitService.add(player);

      // Get SimDriver for event processing and time advancement
      const simDriver = yield* CombatLogService.SimDriver;

      // Track results - includes both combat log events and resource snapshots
      const events: SimulationEvent[] = [];
      let casts = 0;
      let totalDamage = 0;

      // Subscribe to combat events for damage tracking
      const subscription = yield* simDriver.subscribe({
        filter: EVENT_STREAM_FILTER,
        onEvent: (event) => {
          events.push(event);
          if (event._tag === "SPELL_DAMAGE" && "amount" in event) {
            totalDamage += event.amount ?? 0;
          }
          return Effect.void;
        },
      });

      // Helper to emit resource snapshot
      const emitResourceSnapshot = (
        state: Entities.GameState.GameState,
      ): void => {
        const playerUnit = state.units.get(playerId);
        if (!playerUnit) {
          return;
        }

        const focusPower = playerUnit.power.get(Schemas.Enums.PowerType.Focus);
        if (!focusPower) {
          return;
        }

        const snapshot: ResourceSnapshot = {
          _tag: "RESOURCE_SNAPSHOT",
          timestamp: state.currentTime * 1000, // Convert to ms
          focus: focusPower.current,
          maxFocus: focusPower.max,
        };

        events.push(snapshot);
      };

      // Main simulation loop (matches standalone pattern)
      while (true) {
        const state = yield* stateService.getState();

        // Duration comparison in seconds (currentTime is in seconds)
        if (state.currentTime >= durationSeconds) {
          break;
        }

        // Execute rotation priority list
        yield* Effect.catchAll(rotation.run(playerId), () => Effect.void);
        casts++;

        // Advance simulation time by processing events up to currentTime + 100ms
        yield* simDriver.run(state.currentTime + 100);

        // Emit resource snapshot after state changes (every 10 ticks to reduce data size)
        if (casts % 10 === 0) {
          const updatedState = yield* stateService.getState();
          emitResourceSnapshot(updatedState);

          onProgress?.({
            currentTime: updatedState.currentTime,
            totalTime: durationSeconds,
            casts,
          });
        }
      }

      // Cleanup subscription
      yield* subscription.unsubscribe;

      // Calculate DPS
      const dps = durationSeconds > 0 ? totalDamage / durationSeconds : 0;

      return {
        events,
        casts,
        durationMs: durationSeconds * 1000,
        totalDamage,
        dps,
      };
    }),
  );
}
