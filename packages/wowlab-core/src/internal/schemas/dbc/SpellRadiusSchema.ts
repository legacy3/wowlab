import * as Schema from "effect/Schema";

export const SpellRadiusRowSchema = Schema.Struct({
  ID: Schema.NumberFromString,
  Radius: Schema.NumberFromString,
  RadiusPerLevel: Schema.NumberFromString,
  RadiusMin: Schema.NumberFromString,
  RadiusMax: Schema.NumberFromString,
});

export type SpellRadiusRow = Schema.Schema.Type<typeof SpellRadiusRowSchema>;
