import * as Schema from "effect/Schema";

export const SpellCastTimesRowSchema = Schema.Struct({
  ID: Schema.Number,
  Base: Schema.Number,
  Minimum: Schema.Number,
});

export type SpellCastTimesRow = Schema.Schema.Type<
  typeof SpellCastTimesRowSchema
>;
