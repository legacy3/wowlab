import * as Schema from "effect/Schema";

const SpellCastTimesSchema = Schema.Struct({
  Base: Schema.Number,
  ID: Schema.Number,
  Minimum: Schema.Number,
});

type SpellCastTimesRow = Schema.Schema.Type<typeof SpellCastTimesSchema>;

export { SpellCastTimesSchema, type SpellCastTimesRow };
