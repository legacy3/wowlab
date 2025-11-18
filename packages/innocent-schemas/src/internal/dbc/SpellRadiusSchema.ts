import * as Schema from "effect/Schema";

const SpellRadiusSchema = Schema.Struct({
  ID: Schema.Number,
  MaxRadius: Schema.Number,
  Radius: Schema.Number,
  RadiusMin: Schema.Number,
});

type SpellRadiusRow = Schema.Schema.Type<typeof SpellRadiusSchema>;

export { SpellRadiusSchema, type SpellRadiusRow };
