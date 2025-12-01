import * as Schema from "effect/Schema";

export const SpellRangeRowSchema = Schema.Struct({
  DisplayName_lang: Schema.optional(Schema.String),
  DisplayNameShort_lang: Schema.optional(Schema.String),
  Flags: Schema.NumberFromString,
  ID: Schema.NumberFromString,
  RangeMax_0: Schema.NumberFromString,
  RangeMax_1: Schema.NumberFromString,
  RangeMin_0: Schema.NumberFromString,
  RangeMin_1: Schema.NumberFromString,
});

export type SpellRangeRow = Schema.Schema.Type<typeof SpellRangeRowSchema>;
