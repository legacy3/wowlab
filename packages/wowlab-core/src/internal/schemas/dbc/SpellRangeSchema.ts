import * as Schema from "effect/Schema";

export const SpellRangeRowSchema = Schema.Struct({
  DisplayName_lang: Schema.optional(Schema.String),
  DisplayNameShort_lang: Schema.optional(Schema.String),
  Flags: Schema.Number,
  ID: Schema.Number,
  RangeMax_0: Schema.Number,
  RangeMax_1: Schema.Number,
  RangeMin_0: Schema.Number,
  RangeMin_1: Schema.Number,
});

export type SpellRangeRow = Schema.Schema.Type<typeof SpellRangeRowSchema>;
