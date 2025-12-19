import * as Schema from "effect/Schema";

export const ItemClassRowSchema = Schema.Struct({
  ID: Schema.NumberFromString,
  ClassName_lang: Schema.NullOr(Schema.String),
  ClassID: Schema.NumberFromString,
  PriceModifier: Schema.NumberFromString,
  Flags: Schema.NumberFromString,
});

export type ItemClassRow = Schema.Schema.Type<typeof ItemClassRowSchema>;
