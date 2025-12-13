import * as Schema from "effect/Schema";

export const ContentTuningRowSchema = Schema.Struct({
  ID: Schema.NumberFromString,
  Flags: Schema.NumberFromString,
  ExpansionID: Schema.NumberFromString,
  HPScalingCurveID: Schema.NumberFromString,
  DMGScalingCurveID: Schema.NumberFromString,
  HPPrimaryStatScalingCurveID: Schema.NumberFromString,
  DMGPrimaryStatScalingCurveID: Schema.NumberFromString,
  PrimaryStatScalingModPlayerDataElementCharacterID: Schema.NumberFromString,
  PrimaryStatScalingModPlayerDataElementCharacterMultiplier:
    Schema.NumberFromString,
  MinLevelSquish: Schema.NumberFromString,
  MaxLevelSquish: Schema.NumberFromString,
  MinLevelScalingOffset: Schema.NumberFromString,
  MaxLevelScalingOffset: Schema.NumberFromString,
  AllowedMinOffset: Schema.NumberFromString,
  AllowedMaxOffset: Schema.NumberFromString,
  LfgMinLevel: Schema.NumberFromString,
  LfgMaxLevel: Schema.NumberFromString,
  ILevel: Schema.NumberFromString,
  XpMultQuest: Schema.NumberFromString,
});

export type ContentTuningRow = Schema.Schema.Type<
  typeof ContentTuningRowSchema
>;
