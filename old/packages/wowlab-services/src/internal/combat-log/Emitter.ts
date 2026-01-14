/**
 * Emitter Context
 *
 * Provides a context for event handlers to emit new events.
 * Collects all emitted events for batch insertion into the queue.
 */
import type * as CombatLog from "@wowlab/core/Schemas";

import * as Effect from "effect/Effect";
import * as Ref from "effect/Ref";

/**
 * The Emitter interface provided to event handlers
 */
export interface Emitter {
  /** Current simulation time */
  readonly currentTime: number;

  /**
   * Emit an event at the current timestamp
   */
  readonly emit: (event: CombatLog.CombatLog.CombatLogEvent) => void;

  /**
   * Emit an event at an offset from current time (in milliseconds)
   */
  readonly emitAt: (
    offsetMs: number,
    eventWithoutTimestamp: { timestamp?: never } & Omit<
      CombatLog.CombatLog.CombatLogEvent,
      "timestamp"
    >,
  ) => void;

  /**
   * Emit multiple events
   */
  readonly emitBatch: (
    events: readonly CombatLog.CombatLog.CombatLogEvent[],
  ) => void;
}

/**
 * Internal representation that includes getEmitted
 */
interface EmitterInternal extends Emitter {
  /** Get all events emitted so far (for queue insertion) */
  readonly getEmitted: Effect.Effect<
    readonly CombatLog.CombatLog.CombatLogEvent[]
  >;
}

/**
 * Create an Emitter for a handler invocation.
 * The emitter collects all emitted events for later insertion into the queue.
 *
 * @param currentTime - The current simulation time
 * @returns An Effect that yields an Emitter
 */
export const makeEmitter = (
  currentTime: number,
): Effect.Effect<EmitterInternal> =>
  Effect.gen(function* () {
    const emittedRef = yield* Ref.make<CombatLog.CombatLog.CombatLogEvent[]>(
      [],
    );

    const emitter: EmitterInternal = {
      currentTime,

      emit: (event) => {
        Effect.runSync(Ref.update(emittedRef, (arr) => [...arr, event]));
      },

      emitAt: (offsetMs, eventWithoutTimestamp) => {
        const fullEvent = {
          ...eventWithoutTimestamp,
          timestamp: currentTime + offsetMs / 1000,
        } as CombatLog.CombatLog.CombatLogEvent;

        Effect.runSync(Ref.update(emittedRef, (arr) => [...arr, fullEvent]));
      },

      emitBatch: (events) => {
        Effect.runSync(Ref.update(emittedRef, (arr) => [...arr, ...events]));
      },

      getEmitted: Ref.get(emittedRef),
    };

    return emitter;
  });

/**
 * Get the events emitted by an emitter
 */
export const getEmitted = (
  emitter: EmitterInternal,
): Effect.Effect<readonly CombatLog.CombatLog.CombatLogEvent[]> =>
  emitter.getEmitted;
