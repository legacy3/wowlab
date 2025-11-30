import * as Schema from "effect/Schema";

export const SpellProcsPerMinuteModRowSchema = Schema.Struct({
  Coeff: Schema.Number,
  ID: Schema.Number,
  Param: Schema.Number,
  SpellProcsPerMinuteID: Schema.Number,
  Type: Schema.Number,
});

export type SpellProcsPerMinuteModRow = Schema.Schema.Type<
  typeof SpellProcsPerMinuteModRowSchema
>;
