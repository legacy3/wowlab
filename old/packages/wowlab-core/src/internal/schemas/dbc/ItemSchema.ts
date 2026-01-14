import * as Schema from "effect/Schema";

export const ItemRowSchema = Schema.Struct({
  ID: Schema.NumberFromString,
  ClassID: Schema.NumberFromString,
  SubclassID: Schema.NumberFromString,
  Material: Schema.NumberFromString,
  InventoryType: Schema.NumberFromString,
  SheatheType: Schema.NumberFromString,
  Sound_override_subclassID: Schema.NumberFromString,
  IconFileDataID: Schema.NumberFromString,
  ItemGroupSoundsID: Schema.NumberFromString,
  ContentTuningID: Schema.NumberFromString,
  ModifiedCraftingReagentItemID: Schema.NumberFromString,
  CraftingQualityID: Schema.NumberFromString,
});

export type ItemRow = Schema.Schema.Type<typeof ItemRowSchema>;
