import * as Schema from "effect/Schema";

export const SpellCastTimesRowSchema = Schema.Struct({
  Base: Schema.NumberFromString,
  ID: Schema.NumberFromString,
  Minimum: Schema.NumberFromString,
});

export type SpellCastTimesRow = Schema.Schema.Type<
  typeof SpellCastTimesRowSchema
>;
