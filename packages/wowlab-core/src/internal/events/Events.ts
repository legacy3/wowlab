import * as Effect from "effect/Effect";

import * as Entities from "../entities/index.js";
import * as Branded from "../schemas/Branded.js";

export enum EventType {
  // Core progression
  APL_EVALUATE = "apl_evaluate",

  // Spell lifecycle
  SPELL_CAST_COMPLETE = "spell_cast_complete",
  SPELL_CAST_START = "spell_cast_start",
  SPELL_CHARGE_READY = "spell_charge_ready",
  SPELL_COOLDOWN_READY = "spell_cooldown_ready",

  // Projectiles
  PROJECTILE_IMPACT = "projectile_impact",
  SPELL_DAMAGE = "spell_damage",

  // Auras
  AURA_EXPIRE = "aura_expire",
  AURA_STACK_DECAY = "aura_stack_decay",

  // Periodic triggers
  PERIODIC_POWER = "periodic_power",
  PERIODIC_SPELL = "periodic_spell",
}

export type EventPayloadMap = {
  [EventType.APL_EVALUATE]: Record<string, never>; // No payload

  [EventType.SPELL_CAST_COMPLETE]: {
    casterId: Branded.UnitID;
    spell: Entities.Spell.Spell;
    targetId: Branded.UnitID | null;
  };

  [EventType.SPELL_CAST_START]: {
    casterId: Branded.UnitID;
    spell: Entities.Spell.Spell;
    targetId: Branded.UnitID | null;
  };

  [EventType.SPELL_CHARGE_READY]: {
    casterId: Branded.UnitID;
    spell: Entities.Spell.Spell;
  };

  [EventType.SPELL_COOLDOWN_READY]: {
    casterId: Branded.UnitID;
    spell: Entities.Spell.Spell;
  };

  [EventType.PROJECTILE_IMPACT]: {
    projectileId: Branded.ProjectileID;
    spell: Entities.Spell.Spell;
    casterUnitId: Branded.UnitID;
    targetUnitId: Branded.UnitID;
    damage: number;
  };

  [EventType.SPELL_DAMAGE]: {
    spell: Entities.Spell.Spell;
    damage: number;
  };

  [EventType.AURA_EXPIRE]: {
    aura: Entities.Aura.Aura;
    unitId: Branded.UnitID;
  };

  [EventType.AURA_STACK_DECAY]: {
    aura: Entities.Aura.Aura;
    unitId: Branded.UnitID;
  };

  [EventType.PERIODIC_POWER]: Record<string, never>; // No payload
  [EventType.PERIODIC_SPELL]: Record<string, never>; // No payload
};

export const EVENT_PRIORITY: Record<EventType, number> = {
  [EventType.APL_EVALUATE]: 10,
  [EventType.AURA_EXPIRE]: 80,
  [EventType.AURA_STACK_DECAY]: 20,
  [EventType.PERIODIC_POWER]: 60,
  [EventType.PERIODIC_SPELL]: 59,
  [EventType.PROJECTILE_IMPACT]: 90,
  [EventType.SPELL_CAST_COMPLETE]: 100,
  [EventType.SPELL_CAST_START]: 30,
  [EventType.SPELL_CHARGE_READY]: 40,
  [EventType.SPELL_COOLDOWN_READY]: 70,
  [EventType.SPELL_DAMAGE]: 95,
};

export type EventContext<T extends EventType = EventType> = EventPayloadMap[T];

// Bivariant parameter allows storing specific event callbacks in wider arrays
export type ExecutionCallback<T extends EventType = EventType> = {
  bivarianceHack(
    ctx: EventPayloadMap[T],
  ): Effect.Effect<void, unknown, unknown>;
}["bivarianceHack"];

/**
 * Scheduled event in the priority queue.
 * Alias for SimulationEvent for consistency with the event scheduler plan.
 */
export type ScheduledEvent<T extends EventType = EventType> =
  SimulationEvent<T>;

export interface SimulationEvent<T extends EventType = EventType> {
  readonly at: number;
  readonly callbacks: ReadonlyArray<ExecutionCallback<T>>;
  readonly id: Branded.EventID;
  readonly payload: EventPayloadMap[T];
  readonly priority: number;
  readonly type: T;
}
