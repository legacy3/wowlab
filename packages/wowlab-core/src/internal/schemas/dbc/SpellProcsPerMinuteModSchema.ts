import * as Schema from "effect/Schema";

export const SpellProcsPerMinuteModRowSchema = Schema.Struct({
  Coeff: Schema.NumberFromString,
  ID: Schema.NumberFromString,
  Param: Schema.NumberFromString,
  SpellProcsPerMinuteID: Schema.NumberFromString,
  Type: Schema.NumberFromString,
});

export type SpellProcsPerMinuteModRow = Schema.Schema.Type<
  typeof SpellProcsPerMinuteModRowSchema
>;
