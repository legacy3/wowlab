import * as Schema from "effect/Schema";

export const SpellCastTimesRowSchema = Schema.Struct({
  Base: Schema.Number,
  ID: Schema.Number,
  Minimum: Schema.Number,
});

export type SpellCastTimesRow = Schema.Schema.Type<
  typeof SpellCastTimesRowSchema
>;
