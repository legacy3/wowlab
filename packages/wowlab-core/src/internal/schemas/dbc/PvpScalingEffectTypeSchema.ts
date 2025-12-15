import * as Schema from "effect/Schema";

export const PvpScalingEffectTypeRowSchema = Schema.Struct({
  ID: Schema.NumberFromString,
  Name: Schema.NumberFromString,
});

export type PvpScalingEffectTypeRow = Schema.Schema.Type<
  typeof PvpScalingEffectTypeRowSchema
>;
