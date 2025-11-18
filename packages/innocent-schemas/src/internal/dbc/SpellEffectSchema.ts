import * as Schema from "effect/Schema";

import * as Branded from "@/Branded";

const SpellEffectSchema = Schema.Struct({
  BonusCoefficientFromAP: Schema.Number,
  Effect: Schema.Number,
  EffectAmplitude: Schema.Number.pipe(Schema.optional),
  EffectAura: Schema.Number,
  EffectBasePoints: Schema.Number,
  EffectBonusCoefficient: Schema.Number,
  EffectChainTargets: Schema.Number.pipe(Schema.optional),
  EffectMiscValue: Schema.Array(Schema.Number),
  EffectRadiusIndex: Schema.Array(Schema.Number),
  EffectTriggerSpell: Schema.Number,
  ID: Schema.Number,
  ImplicitTarget: Schema.Array(Schema.Number),
  SpellID: Branded.SpellIDSchema,
});

type SpellEffectRow = Schema.Schema.Type<typeof SpellEffectSchema>;

export { SpellEffectSchema, type SpellEffectRow };
