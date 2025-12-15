import * as Schema from "effect/Schema";

export const ItemModifiedAppearanceRowSchema = Schema.Struct({
  ID: Schema.NumberFromString,
  ItemID: Schema.NumberFromString,
  ItemAppearanceModifierID: Schema.NumberFromString,
  ItemAppearanceID: Schema.NumberFromString,
  OrderIndex: Schema.NumberFromString,
  TransmogSourceTypeEnum: Schema.NumberFromString,
  Flags: Schema.NumberFromString,
});

export type ItemModifiedAppearanceRow = Schema.Schema.Type<
  typeof ItemModifiedAppearanceRowSchema
>;
