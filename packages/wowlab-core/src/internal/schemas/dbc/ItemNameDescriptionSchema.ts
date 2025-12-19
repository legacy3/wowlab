import * as Schema from "effect/Schema";

export const ItemNameDescriptionRowSchema = Schema.Struct({
  ID: Schema.NumberFromString,
  Description_lang: Schema.NullOr(Schema.String),
  Color: Schema.NumberFromString,
});

export type ItemNameDescriptionRow = Schema.Schema.Type<
  typeof ItemNameDescriptionRowSchema
>;
