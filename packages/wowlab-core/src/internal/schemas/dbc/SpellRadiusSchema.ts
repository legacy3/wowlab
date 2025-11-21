import * as Schema from "effect/Schema";

export const SpellRadiusRowSchema = Schema.Struct({
  ID: Schema.Number,
  Radius: Schema.Number,
  RadiusPerLevel: Schema.Number,
  RadiusMin: Schema.Number,
  RadiusMax: Schema.Number,
});

export type SpellRadiusRow = Schema.Schema.Type<typeof SpellRadiusRowSchema>;
