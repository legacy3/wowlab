import * as Schema from "effect/Schema";

export const SpellRadiusRowSchema = Schema.Struct({
  ID: Schema.NumberFromString,
  Radius: Schema.NumberFromString,
  RadiusMax: Schema.NumberFromString,
  RadiusMin: Schema.NumberFromString,
  RadiusPerLevel: Schema.NumberFromString,
});

export type SpellRadiusRow = Schema.Schema.Type<typeof SpellRadiusRowSchema>;
