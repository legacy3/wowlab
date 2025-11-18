import * as Schema from "effect/Schema";

const SpellDurationSchema = Schema.Struct({
  Duration: Schema.Number,
  ID: Schema.Number,
  MaxDuration: Schema.Number,
});

type SpellDurationRow = Schema.Schema.Type<typeof SpellDurationSchema>;

export { SpellDurationSchema, type SpellDurationRow };
