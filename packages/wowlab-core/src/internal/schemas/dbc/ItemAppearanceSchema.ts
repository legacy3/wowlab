import * as Schema from "effect/Schema";

export const ItemAppearanceRowSchema = Schema.Struct({
  ID: Schema.NumberFromString,
  DisplayType: Schema.NumberFromString,
  ItemDisplayInfoID: Schema.NumberFromString,
  DefaultIconFileDataID: Schema.NumberFromString,
  UiOrder: Schema.NumberFromString,
  TransmogPlayerConditionID: Schema.NumberFromString,
});

export type ItemAppearanceRow = Schema.Schema.Type<
  typeof ItemAppearanceRowSchema
>;
