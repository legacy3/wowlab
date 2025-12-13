import * as Schema from "effect/Schema";

export const ItemArmorTotalRowSchema = Schema.Struct({
  ID: Schema.NumberFromString,
  ItemLevel: Schema.NumberFromString,
  Cloth: Schema.NumberFromString,
  Leather: Schema.NumberFromString,
  Mail: Schema.NumberFromString,
  Plate: Schema.NumberFromString,
});

export type ItemArmorTotalRow = Schema.Schema.Type<
  typeof ItemArmorTotalRowSchema
>;
