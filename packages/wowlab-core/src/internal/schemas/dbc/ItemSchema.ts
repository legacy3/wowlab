import * as Schema from "effect/Schema";

export const ItemRowSchema = Schema.Struct({
  ClassID: Schema.NumberFromString,
  ContentTuningID: Schema.NumberFromString,
  CraftingQualityID: Schema.NumberFromString,
  Field_12_0_0_63534_010: Schema.NullOr(Schema.NumberFromString),
  Field_12_0_0_63534_012: Schema.NullOr(Schema.NumberFromString),
  Field_12_0_0_63534_013: Schema.NullOr(Schema.NumberFromString),
  Field_12_0_0_63534_014: Schema.NullOr(Schema.NumberFromString),
  IconFileDataID: Schema.NumberFromString,
  ID: Schema.NumberFromString,
  InventoryType: Schema.NumberFromString,
  ItemGroupSoundsID: Schema.NumberFromString,
  Material: Schema.NumberFromString,
  ModifiedCraftingReagentItemID: Schema.NumberFromString,
  SheatheType: Schema.NumberFromString,
  Sound_override_subclassID: Schema.NumberFromString,
  SubclassID: Schema.NumberFromString,
});

export type ItemRow = Schema.Schema.Type<typeof ItemRowSchema>;
