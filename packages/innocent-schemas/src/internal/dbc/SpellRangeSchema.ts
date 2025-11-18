import * as Schema from "effect/Schema";

const SpellRangeSchema = Schema.Struct({
  DisplayName: Schema.String.pipe(Schema.optional),
  ID: Schema.Number,
  MaxRange: Schema.Array(Schema.Number),
  MinRange: Schema.Array(Schema.Number),
});

type SpellRangeRow = Schema.Schema.Type<typeof SpellRangeSchema>;

export { SpellRangeSchema, type SpellRangeRow };
