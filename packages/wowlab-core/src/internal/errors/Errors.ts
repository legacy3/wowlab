import * as Data from "effect/Data";

import * as Entities from "../entities/index.js";
import * as Branded from "../schemas/Branded.js";

/** Union of all combat log errors */
export type CombatLogError =
  | QueueEmpty
  | HandlerError
  | EventValidationError
  | HandlerNotFound
  | DuplicateHandlerId;

export type DbcError = DbcQueryError;

/** Union of all errors that can occur during rotation execution */
export type RotationError =
  | NoChargesAvailable
  | SpellNotFound
  | SpellOnCooldown
  | UnitNotFound;

export class AuraNotFound extends Data.TaggedError("AuraNotFound")<{
  readonly auraId: Branded.SpellID;
  readonly unitId: Branded.UnitID;
}> {}

export class Cast extends Data.TaggedError("Cast")<{
  readonly reason: string;
  readonly spell: Entities.Spell.Spell;
  readonly caster?: Entities.Unit.Unit;
}> {}

export class DataError extends Data.TaggedError("Data")<{
  readonly message: string;
  readonly cause?: unknown;
}> {}

export class DBCParse extends Data.TaggedError("DBCParse")<{
  readonly tableName: string;
  readonly reason: string;
}> {}

export class DbcQueryError extends Data.TaggedError("DbcQueryError")<{
  readonly message: string;
  readonly cause?: unknown;
}> {}

/** Error when trying to subscribe with a duplicate handler ID */
export class DuplicateHandlerId extends Data.TaggedError("DuplicateHandlerId")<{
  readonly handlerId: string;
}> {}

/** Error when an event fails validation */
export class EventValidationError extends Data.TaggedError(
  "EventValidationError",
)<{
  readonly event: unknown;
  readonly message: string;
}> {}

export class GCDActive extends Data.TaggedError("GCDActive")<{
  readonly spell: Entities.Spell.Spell;
  readonly gcdEndsAt: number;
  readonly currentTime: number;
}> {}

/** Error when an event handler fails */
export class HandlerError extends Data.TaggedError("HandlerError")<{
  readonly handlerId: string;
  readonly eventTag: string;
  readonly cause: unknown;
}> {}

/** Error when a handler is not found for an event */
export class HandlerNotFound extends Data.TaggedError("HandlerNotFound")<{
  readonly handlerId: string;
}> {}

export class ItemNotFound extends Data.TaggedError("ItemNotFound")<{
  readonly itemId: number;
  readonly message: string;
}> {}

export class Modifier extends Data.TaggedError("Modifier")<{
  readonly modifierName: string;
  readonly spell: Entities.Spell.Spell;
  readonly reason: string;
  readonly phase: "beforeCast" | "onCast" | "onHit" | "onDamage";
}> {}

export class ModifierTimeout extends Data.TaggedError("ModifierTimeout")<{
  readonly modifierName: string;
  readonly spell: Entities.Spell.Spell;
  readonly timeoutMs: number;
}> {}

export class NoChargesAvailable extends Data.TaggedError("NoChargesAvailable")<{
  readonly spell: Entities.Spell.Spell;
}> {}

export class PlayerIsCasting extends Data.TaggedError("PlayerIsCasting")<{
  readonly spell: Entities.Spell.Spell;
  readonly castingSpell: Entities.Spell.Spell;
  readonly castEndsAt: number;
}> {}

export class ProfileBundleNotFound extends Data.TaggedError(
  "ProfileBundleNotFound",
)<{
  readonly id: string;
}> {}

export class ProjectileNotFound extends Data.TaggedError("ProjectileNotFound")<{
  readonly projectileId: Branded.ProjectileID;
}> {}

// ============================================================================
// Combat Log Errors
// ============================================================================

/** Error when trying to take from an empty event queue */
export class QueueEmpty extends Data.TaggedError("QueueEmpty")<{
  readonly message: string;
}> {}

export class ScheduleInPast extends Data.TaggedError("ScheduleInPast")<{
  readonly currentTime: number;
  readonly eventTime: number;
}> {}

export class SpellInfoNotFound extends Data.TaggedError("SpellInfoNotFound")<{
  readonly spellId: number;
  readonly message: string;
}> {}

export class SpellNotFound extends Data.TaggedError("SpellNotFound")<{
  readonly unitId: Branded.UnitID;
  readonly spellId: number;
}> {}

export class SpellOnCooldown extends Data.TaggedError("SpellOnCooldown")<{
  readonly remainingCooldown: number;
  readonly spell: Entities.Spell.Spell;
}> {}

export class UnitNotFound extends Data.TaggedError("UnitNotFound")<{
  readonly unitId: Branded.UnitID;
}> {}
