/**
 * Event Transformer
 *
 * Transforms CombatLogEvents (WoW's CLEU format) from the simulation
 * into CombatData format expected by the timeline visualization.
 *
 * See docs/sim-integration/05-event-collection.md for details.
 */
import type * as Schemas from "@wowlab/core/Schemas";
import type {
  CombatData,
  CastEvent,
  DamageEvent,
  BuffEvent,
  ResourceEvent,
  PhaseMarker,
} from "@/atoms/timeline";

interface ActiveAura {
  spellId: number;
  start: number;
  target: string;
  type: "buff" | "debuff";
  stacks: number;
}

interface CastInProgress {
  spellId: number;
  startTime: number;
  target: string;
}

/**
 * Transforms raw CombatLogEvents into timeline-compatible CombatData.
 *
 * Key transformations:
 * - Timestamps: ms → seconds
 * - Event _tag → timeline type
 * - Pairs SPELL_AURA_APPLIED/REMOVED into BuffEvent ranges
 * - Pairs SPELL_CAST_START/SUCCESS into CastEvent with duration
 */
export function transformEvents(
  events: readonly Schemas.CombatLog.CombatLogEvent[],
  durationMs: number,
): CombatData {
  const casts: CastEvent[] = [];
  const damage: DamageEvent[] = [];
  const buffs: BuffEvent[] = [];
  const resources: ResourceEvent[] = [];

  // Track active auras for start/end pairing
  const activeAuras = new Map<string, ActiveAura>();

  // Track casts in progress for duration calculation
  const castsInProgress = new Map<string, CastInProgress>();

  let idx = 0;
  const id = () => `evt-${idx++}`;

  for (const event of events) {
    const timeSec = event.timestamp / 1000;

    switch (event._tag) {
      case "SPELL_CAST_START": {
        // Track cast start for duration calculation
        const castKey = `${event.sourceGUID}:${event.spellId}`;
        castsInProgress.set(castKey, {
          spellId: event.spellId,
          startTime: timeSec,
          target: event.destName,
        });

        break;
      }

      case "SPELL_CAST_SUCCESS": {
        // Check if we have a matching cast start
        const castKey = `${event.sourceGUID}:${event.spellId}`;
        const castStart = castsInProgress.get(castKey);
        const duration = castStart ? timeSec - castStart.startTime : 0;

        casts.push({
          type: "cast",
          id: id(),
          spellId: event.spellId,
          timestamp: castStart?.startTime ?? timeSec,
          duration,
          target: event.destName || "Target",
          successful: true,
        });

        // Clean up tracking
        castsInProgress.delete(castKey);

        break;
      }

      case "SPELL_CAST_FAILED": {
        // Record failed cast
        const castKey = `${event.sourceGUID}:${event.spellId}`;
        const castStart = castsInProgress.get(castKey);

        casts.push({
          type: "cast",
          id: id(),
          spellId: event.spellId,
          timestamp: castStart?.startTime ?? timeSec,
          duration: castStart ? timeSec - castStart.startTime : 0,
          target: event.destName || "Target",
          successful: false,
        });

        castsInProgress.delete(castKey);

        break;
      }

      case "SPELL_DAMAGE":
      case "SPELL_PERIODIC_DAMAGE": {
        damage.push({
          type: "damage",
          id: id(),
          spellId: event.spellId,
          timestamp: timeSec,
          amount: event.amount,
          isCrit: event.critical,
          target: event.destName || "Target",
          overkill: event.overkill > 0 ? event.overkill : undefined,
        });

        break;
      }

      case "SPELL_AURA_APPLIED": {
        const auraKey = `${event.destGUID}:${event.spellId}`;

        activeAuras.set(auraKey, {
          spellId: event.spellId,
          start: timeSec,
          target: event.destName || "Target",
          type: event.auraType === "DEBUFF" ? "debuff" : "buff",
          stacks: 1,
        });

        break;
      }

      case "SPELL_AURA_APPLIED_DOSE": {
        // Stack increase
        const auraKey = `${event.destGUID}:${event.spellId}`;
        const aura = activeAuras.get(auraKey);

        if (aura && "amount" in event && typeof event.amount === "number") {
          aura.stacks = event.amount;
        }

        break;
      }

      case "SPELL_AURA_REMOVED_DOSE": {
        // Stack decrease
        const auraKey = `${event.destGUID}:${event.spellId}`;
        const aura = activeAuras.get(auraKey);

        if (aura && "amount" in event && typeof event.amount === "number") {
          aura.stacks = event.amount;
        }

        break;
      }

      case "SPELL_AURA_REFRESH": {
        // Refresh extends duration - we just update the start time
        // since we'll close it at the actual REMOVED event
        const auraKey = `${event.destGUID}:${event.spellId}`;
        const aura = activeAuras.get(auraKey);

        if (aura) {
          // Close the old aura segment
          buffs.push({
            type: aura.type,
            id: id(),
            spellId: aura.spellId,
            start: aura.start,
            end: timeSec,
            stacks: aura.stacks > 1 ? aura.stacks : undefined,
            target: aura.target,
          });

          // Start a new segment
          aura.start = timeSec;
        }
        break;
      }

      case "SPELL_AURA_REMOVED": {
        const auraKey = `${event.destGUID}:${event.spellId}`;
        const aura = activeAuras.get(auraKey);

        if (aura) {
          buffs.push({
            type: aura.type,
            id: id(),
            spellId: aura.spellId,
            start: aura.start,
            end: timeSec,
            stacks: aura.stacks > 1 ? aura.stacks : undefined,
            target: aura.target,
          });

          activeAuras.delete(auraKey);
        }
        break;
      }

      case "SPELL_ENERGIZE": {
        // For now, we emit resource snapshots from the runner
        // This case handles any additional energize tracking if needed
        break;
      }

      case "SPELL_DRAIN": {
        // Handle resource drains if needed
        break;
      }
    }
  }

  // Close any auras still active at fight end
  const endSec = durationMs / 1000;
  for (const [, aura] of activeAuras) {
    buffs.push({
      type: aura.type,
      id: id(),
      spellId: aura.spellId,
      start: aura.start,
      end: endSec,
      stacks: aura.stacks > 1 ? aura.stacks : undefined,
      target: aura.target,
    });
  }

  // Default combat phase
  const phases: PhaseMarker[] = [
    {
      type: "phase",
      id: "p1",
      name: "Combat",
      start: 0,
      end: endSec,
      color: "#3B82F6",
    },
  ];

  return {
    casts,
    damage,
    buffs,
    resources,
    phases,
  };
}

/**
 * Custom event type for resource snapshots.
 * These are emitted by the runner at regular intervals.
 */
export interface ResourceSnapshot {
  _tag: "RESOURCE_SNAPSHOT";
  timestamp: number;
  focus: number;
  maxFocus: number;
}

/**
 * Type guard to check if an event is a resource snapshot.
 */
export function isResourceSnapshot(
  event: Schemas.CombatLog.CombatLogEvent | ResourceSnapshot,
): event is ResourceSnapshot {
  return "_tag" in event && event._tag === "RESOURCE_SNAPSHOT";
}

/**
 * Transforms events including resource snapshots.
 * Use this when the runner emits RESOURCE_SNAPSHOT events.
 */
export function transformEventsWithResources(
  events: readonly (Schemas.CombatLog.CombatLogEvent | ResourceSnapshot)[],
  durationMs: number,
): CombatData {
  const combatLogEvents: Schemas.CombatLog.CombatLogEvent[] = [];
  const resources: ResourceEvent[] = [];

  let idx = 0;
  const id = () => `res-${idx++}`;

  for (const event of events) {
    if (isResourceSnapshot(event)) {
      resources.push({
        type: "resource",
        id: id(),
        timestamp: event.timestamp / 1000,
        focus: event.focus,
        maxFocus: event.maxFocus,
      });
    } else {
      combatLogEvents.push(event);
    }
  }

  const result = transformEvents(combatLogEvents, durationMs);
  return {
    ...result,
    resources,
  };
}
