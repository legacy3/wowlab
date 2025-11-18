import * as Schema from "effect/Schema";

const ItemSchema = Schema.Struct({
  ClassID: Schema.Number,
  CraftingQualityID: Schema.Number,
  IconFileDataID: Schema.Number,
  ID: Schema.Number,
  InventoryType: Schema.Number,
  ItemGroupSoundsID: Schema.Number,
  Material: Schema.Number,
  ModifiedCraftingReagentItemID: Schema.Number,
  SheatheType: Schema.Number,
  SoundOverrideSubclassID: Schema.Number,
  SubclassID: Schema.Number,
});

type ItemRow = Schema.Schema.Type<typeof ItemSchema>;

export { ItemSchema, type ItemRow };
