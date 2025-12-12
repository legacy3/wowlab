import * as Schema from "effect/Schema";

export const ItemRowSchema = Schema.Struct({
  ClassID: Schema.NumberFromString,
  ContentTuningID: Schema.NumberFromString,
  CraftingQualityID: Schema.NumberFromString,
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
