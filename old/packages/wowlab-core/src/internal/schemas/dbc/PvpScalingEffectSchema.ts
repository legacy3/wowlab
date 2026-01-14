import * as Schema from "effect/Schema";

export const PvpScalingEffectRowSchema = Schema.Struct({
  ID: Schema.NumberFromString,
  SpecializationID: Schema.NumberFromString,
  PvpScalingEffectTypeID: Schema.NumberFromString,
  Value: Schema.NumberFromString,
});

export type PvpScalingEffectRow = Schema.Schema.Type<
  typeof PvpScalingEffectRowSchema
>;
