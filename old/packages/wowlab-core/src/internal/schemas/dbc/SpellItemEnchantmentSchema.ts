import * as Schema from "effect/Schema";

export const SpellItemEnchantmentRowSchema = Schema.Struct({
  ID: Schema.NumberFromString,
  Name_lang: Schema.NullOr(Schema.String),
  HordeName_lang: Schema.NullOr(Schema.String),
  Duration: Schema.NumberFromString,
  EffectArg_0: Schema.NumberFromString,
  EffectArg_1: Schema.NumberFromString,
  EffectArg_2: Schema.NumberFromString,
  Flags: Schema.NumberFromString,
  EffectScalingPoints_0: Schema.NumberFromString,
  EffectScalingPoints_1: Schema.NumberFromString,
  EffectScalingPoints_2: Schema.NumberFromString,
  IconFileDataID: Schema.NumberFromString,
  ItemLevelMin: Schema.NumberFromString,
  ItemLevelMax: Schema.NumberFromString,
  TransmogUseConditionID: Schema.NumberFromString,
  TransmogCost: Schema.NumberFromString,
  EffectPointsMin_0: Schema.NumberFromString,
  EffectPointsMin_1: Schema.NumberFromString,
  EffectPointsMin_2: Schema.NumberFromString,
  ItemVisual: Schema.NumberFromString,
  RequiredSkillID: Schema.NumberFromString,
  RequiredSkillRank: Schema.NumberFromString,
  ItemLevel: Schema.NumberFromString,
  Charges: Schema.NumberFromString,
  Effect_0: Schema.NumberFromString,
  Effect_1: Schema.NumberFromString,
  Effect_2: Schema.NumberFromString,
  ScalingClass: Schema.NumberFromString,
  ScalingClassRestricted: Schema.NumberFromString,
  Condition_ID: Schema.NumberFromString,
  MinLevel: Schema.NumberFromString,
  MaxLevel: Schema.NumberFromString,
});

export type SpellItemEnchantmentRow = Schema.Schema.Type<
  typeof SpellItemEnchantmentRowSchema
>;
