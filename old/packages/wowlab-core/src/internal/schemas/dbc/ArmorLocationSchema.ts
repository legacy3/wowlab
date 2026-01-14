import * as Schema from "effect/Schema";

export const ArmorLocationRowSchema = Schema.Struct({
  ID: Schema.NumberFromString,
  Clothmodifier: Schema.NumberFromString,
  Leathermodifier: Schema.NumberFromString,
  Chainmodifier: Schema.NumberFromString,
  Platemodifier: Schema.NumberFromString,
  Modifier: Schema.NumberFromString,
});

export type ArmorLocationRow = Schema.Schema.Type<
  typeof ArmorLocationRowSchema
>;
