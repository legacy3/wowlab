import * as Data from "effect/Data";

import * as Entities from "../entities/index.js";
import * as Branded from "../schemas/Branded.js";

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

export class GCDActive extends Data.TaggedError("GCDActive")<{
  readonly spell: Entities.Spell.Spell;
  readonly gcdEndsAt: number;
  readonly currentTime: number;
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
