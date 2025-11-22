import * as Schema from "effect/Schema";

import * as Branded from "../Branded.js";

export const SpellEffectRowSchema = Schema.Struct({
  BonusCoefficientFromAP: Schema.Number,
  Coefficient: Schema.Number,
  Effect: Schema.Number,
  EffectAmplitude: Schema.Number,
  EffectAttributes: Schema.Number,
  EffectAura: Schema.Number,
  EffectAuraPeriod: Schema.Number,
  EffectBasePointsF: Schema.Number,
  EffectBonusCoefficient: Schema.Number,
  EffectChainAmplitude: Schema.Number,
  EffectChainTargets: Schema.Number,
  EffectIndex: Schema.Number,
  EffectItemType: Schema.Number,
  EffectMechanic: Schema.Number,
  EffectMiscValue_0: Schema.Number,
  EffectMiscValue_1: Schema.Number,
  EffectPointsPerResource: Schema.Number,
  EffectPos_facing: Schema.Number,
  EffectRadiusIndex_0: Schema.Number,
  EffectRadiusIndex_1: Schema.Number,
  EffectRealPointsPerLevel: Schema.Number,
  EffectSpellClassMask_0: Schema.Number,
  EffectSpellClassMask_1: Schema.Number,
  EffectSpellClassMask_2: Schema.Number,
  EffectSpellClassMask_3: Schema.Number,
  EffectTriggerSpell: Schema.Number,
  GroupSizeBasePointsCoefficient: Schema.Number,
  ID: Schema.Number,
  ImplicitTarget_0: Schema.Number,
  ImplicitTarget_1: Schema.Number,
  Node__Field_12_0_0_63534_001: Schema.optional(Schema.Number),
  PvpMultiplier: Schema.Number,
  ResourceCoefficient: Schema.Number,
  ScalingClass: Schema.Number,
  SpellID: Branded.SpellIDSchema,
  Variance: Schema.Number,
});

export type SpellEffectRow = Schema.Schema.Type<typeof SpellEffectRowSchema>;
