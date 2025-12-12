import * as Schema from "effect/Schema";

export const SpellCastTimesRowSchema = Schema.Struct({
  ID: Schema.NumberFromString,
  Base: Schema.NumberFromString,
  Minimum: Schema.NumberFromString,
});

export type SpellCastTimesRow = Schema.Schema.Type<
  typeof SpellCastTimesRowSchema
>;
