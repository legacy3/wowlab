import * as Schema from "effect/Schema";

export const TraitDefinitionEffectPointsRowSchema = Schema.Struct({
  ID: Schema.NumberFromString,
  TraitDefinitionID: Schema.NumberFromString,
  EffectIndex: Schema.NumberFromString,
  OperationType: Schema.NumberFromString,
  CurveID: Schema.NumberFromString,
});

export type TraitDefinitionEffectPointsRow = Schema.Schema.Type<
  typeof TraitDefinitionEffectPointsRowSchema
>;
