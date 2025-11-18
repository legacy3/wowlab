import * as Schema from "effect/Schema";

const SpellProcsPerMinuteSchema = Schema.Struct({
  BaseProcRate: Schema.Number,
  Flags: Schema.Number,
  ID: Schema.Number,
});

type SpellProcsPerMinuteRow = Schema.Schema.Type<
  typeof SpellProcsPerMinuteSchema
>;

export { SpellProcsPerMinuteSchema, type SpellProcsPerMinuteRow };
