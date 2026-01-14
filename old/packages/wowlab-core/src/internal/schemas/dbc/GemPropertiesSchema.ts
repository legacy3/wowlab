import * as Schema from "effect/Schema";

export const GemPropertiesRowSchema = Schema.Struct({
  ID: Schema.NumberFromString,
  Enchant_ID: Schema.NumberFromString,
  Type: Schema.NumberFromString,
});

export type GemPropertiesRow = Schema.Schema.Type<
  typeof GemPropertiesRowSchema
>;
