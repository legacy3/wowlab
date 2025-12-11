import * as Schema from "effect/Schema";

export const ItemModifiedAppearanceRowSchema = Schema.Struct({
  Flags: Schema.NumberFromString,
  ID: Schema.NumberFromString,
  ItemAppearanceID: Schema.NumberFromString,
  ItemAppearanceModifierID: Schema.NumberFromString,
  ItemID: Schema.NumberFromString,
  OrderIndex: Schema.NumberFromString,
  TransmogSourceTypeEnum: Schema.NumberFromString,
});

export type ItemModifiedAppearanceRow = Schema.Schema.Type<
  typeof ItemModifiedAppearanceRowSchema
>;
