import * as Branded from "@packages/innocent-schemas/Branded";
import * as EffectData from "effect/Data";

import type * as Entities from "@/Entities";

// ============================================================================
// Accessor Errors
// ============================================================================

export class AuraNotFound extends EffectData.TaggedError("AuraNotFound")<{
  readonly auraId: Branded.SpellID;
  readonly unitId: Branded.UnitID;
}> {}

export class Cast extends EffectData.TaggedError("Cast")<{
  readonly reason: string;
  readonly spell: Entities.Spell;
  readonly caster?: Entities.Unit;
}> {}

export class Data extends EffectData.TaggedError("Data")<{
  readonly message: string;
  readonly cause?: unknown;
}> {}

export class DBCParse extends EffectData.TaggedError("DBCParse")<{
  readonly tableName: string;
  readonly reason: string;
}> {}

// ============================================================================
// Casting Errors
// ============================================================================

export class GCDActive extends EffectData.TaggedError("GCDActive")<{
  readonly spell: Entities.Spell;
  readonly gcdEndsAt: number;
  readonly currentTime: number;
}> {}

export class ItemNotFound extends EffectData.TaggedError("ItemNotFound")<{
  readonly itemId: number;
  readonly message: string;
}> {}

export class Modifier extends EffectData.TaggedError("Modifier")<{
  readonly modifierName: string;
  readonly spell: Entities.Spell;
  readonly reason: string;
  readonly phase: "beforeCast" | "onCast" | "onHit" | "onDamage";
}> {}

// ============================================================================
// Data Errors
// ============================================================================

export class ModifierTimeout extends EffectData.TaggedError("ModifierTimeout")<{
  readonly modifierName: string;
  readonly spell: Entities.Spell;
  readonly timeoutMs: number;
}> {}

export class NoChargesAvailable extends EffectData.TaggedError(
  "NoChargesAvailable",
)<{
  readonly spell: Entities.Spell;
}> {}

export class PlayerIsCasting extends EffectData.TaggedError("PlayerIsCasting")<{
  readonly spell: Entities.Spell;
  readonly castingSpell: Entities.Spell;
  readonly castEndsAt: number;
}> {}

export class ProfileBundleNotFound extends EffectData.TaggedError(
  "ProfileBundleNotFound",
)<{
  readonly id: string;
}> {}

export class ProjectileNotFound extends EffectData.TaggedError(
  "ProjectileNotFound",
)<{
  readonly projectileId: Branded.ProjectileID;
}> {}

// ============================================================================
// Modifier Errors
// ============================================================================

export class SpellInfoNotFound extends EffectData.TaggedError(
  "SpellInfoNotFound",
)<{
  readonly spellId: number;
  readonly message: string;
}> {}

export class SpellNotFound extends EffectData.TaggedError("SpellNotFound")<{
  readonly spellId: Branded.SpellID;
}> {}

// ============================================================================
// Validation Errors
// ============================================================================

export class SpellOnCooldown extends EffectData.TaggedError("SpellOnCooldown")<{
  readonly spell: Entities.Spell;
  readonly remainingCooldown: number;
}> {}

export class UnitNotFound extends EffectData.TaggedError("UnitNotFound")<{
  readonly unitId: Branded.UnitID;
}> {}
