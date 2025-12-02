import * as Schema from "effect/Schema";

export const SpellShapeshiftFormRowSchema = Schema.Struct({
  AttackIconFileID: Schema.NumberFromString,
  BonusActionBar: Schema.NumberFromString,
  CombatRoundTime: Schema.NumberFromString,
  CreatureDisplayID: Schema.NumberFromString,
  CreatureType: Schema.NumberFromString,
  DamageVariance: Schema.NumberFromString,
  Flags: Schema.NumberFromString,
  ID: Schema.NumberFromString,
  MountTypeID: Schema.NumberFromString,
  Name_lang: Schema.String,
  PresetSpellID_0: Schema.NumberFromString,
  PresetSpellID_1: Schema.NumberFromString,
  PresetSpellID_2: Schema.NumberFromString,
  PresetSpellID_3: Schema.NumberFromString,
  PresetSpellID_4: Schema.NumberFromString,
  PresetSpellID_5: Schema.NumberFromString,
  PresetSpellID_6: Schema.NumberFromString,
  PresetSpellID_7: Schema.NumberFromString,
});

export type SpellShapeshiftFormRow = Schema.Schema.Type<
  typeof SpellShapeshiftFormRowSchema
>;
