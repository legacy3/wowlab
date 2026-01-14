import * as Schema from "effect/Schema";

export const SpellProcsPerMinuteModRowSchema = Schema.Struct({
  ID: Schema.NumberFromString,
  Type: Schema.NumberFromString,
  Param: Schema.NumberFromString,
  Coeff: Schema.NumberFromString,
  SpellProcsPerMinuteID: Schema.NumberFromString,
});

export type SpellProcsPerMinuteModRow = Schema.Schema.Type<
  typeof SpellProcsPerMinuteModRowSchema
>;
