import * as Schema from "effect/Schema";

const SpellNameSchema = Schema.Struct({
  ID: Schema.Number,
  Name: Schema.String,
});

type SpellNameRow = Schema.Schema.Type<typeof SpellNameSchema>;

export { SpellNameSchema, type SpellNameRow };
