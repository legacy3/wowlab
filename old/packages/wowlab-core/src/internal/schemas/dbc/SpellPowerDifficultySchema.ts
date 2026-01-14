import * as Schema from "effect/Schema";

export const SpellPowerDifficultyRowSchema = Schema.Struct({
  ID: Schema.NumberFromString,
  DifficultyID: Schema.NumberFromString,
  OrderIndex: Schema.NumberFromString,
});

export type SpellPowerDifficultyRow = Schema.Schema.Type<
  typeof SpellPowerDifficultyRowSchema
>;
