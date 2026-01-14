import * as Schema from "effect/Schema";

import * as Branded from "../Branded.js";

export const SpellEffectRowSchema = Schema.Struct({
  ID: Schema.NumberFromString,
  EffectAura: Schema.NumberFromString,
  DifficultyID: Schema.NumberFromString,
  EffectIndex: Schema.NumberFromString,
  Effect: Schema.NumberFromString,
  EffectAmplitude: Schema.NumberFromString,
  EffectAttributes: Schema.NumberFromString,
  EffectAuraPeriod: Schema.NumberFromString,
  EffectBonusCoefficient: Schema.NumberFromString,
  EffectChainAmplitude: Schema.NumberFromString,
  EffectChainTargets: Schema.NumberFromString,
  EffectItemType: Schema.NumberFromString,
  EffectMechanic: Schema.NumberFromString,
  EffectPointsPerResource: Schema.NumberFromString,
  EffectPos_facing: Schema.NumberFromString,
  EffectRealPointsPerLevel: Schema.NumberFromString,
  EffectTriggerSpell: Schema.NumberFromString,
  BonusCoefficientFromAP: Schema.NumberFromString,
  PvpMultiplier: Schema.NumberFromString,
  Coefficient: Schema.NumberFromString,
  Variance: Schema.NumberFromString,
  ResourceCoefficient: Schema.NumberFromString,
  GroupSizeBasePointsCoefficient: Schema.NumberFromString,
  EffectBasePointsF: Schema.NumberFromString,
  ScalingClass: Schema.NumberFromString,
  EffectMiscValue_0: Schema.NumberFromString,
  EffectMiscValue_1: Schema.NumberFromString,
  EffectRadiusIndex_0: Schema.NumberFromString,
  EffectRadiusIndex_1: Schema.NumberFromString,
  EffectSpellClassMask_0: Schema.NumberFromString,
  EffectSpellClassMask_1: Schema.NumberFromString,
  EffectSpellClassMask_2: Schema.NumberFromString,
  EffectSpellClassMask_3: Schema.NumberFromString,
  ImplicitTarget_0: Schema.NumberFromString,
  ImplicitTarget_1: Schema.NumberFromString,
  SpellID: Branded.SpellIDSchema,
});

export type SpellEffectRow = Schema.Schema.Type<typeof SpellEffectRowSchema>;
