import * as Schema from "effect/Schema";

export const ItemAppearanceRowSchema = Schema.Struct({
  DefaultIconFileDataID: Schema.NumberFromString,
  DisplayType: Schema.NumberFromString,
  ID: Schema.NumberFromString,
  ItemDisplayInfoID: Schema.NumberFromString,
  TransmogPlayerConditionID: Schema.NumberFromString,
  UiOrder: Schema.NumberFromString,
});

export type ItemAppearanceRow = Schema.Schema.Type<
  typeof ItemAppearanceRowSchema
>;
