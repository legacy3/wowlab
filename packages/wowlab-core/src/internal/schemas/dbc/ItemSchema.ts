import * as Schema from "effect/Schema";

export const ItemRowSchema = Schema.Struct({
  ClassID: Schema.Number,
  ContentTuningID: Schema.Number,
  CraftingQualityID: Schema.Number,
  Field_12_0_0_63534_010: Schema.NullOr(Schema.Number),
  Field_12_0_0_63534_012: Schema.NullOr(Schema.Number),
  Field_12_0_0_63534_013: Schema.NullOr(Schema.Number),
  Field_12_0_0_63534_014: Schema.NullOr(Schema.Number),
  IconFileDataID: Schema.Number,
  ID: Schema.Number,
  InventoryType: Schema.Number,
  ItemGroupSoundsID: Schema.Number,
  Material: Schema.Number,
  ModifiedCraftingReagentItemID: Schema.Number,
  SheatheType: Schema.Number,
  Sound_override_subclassID: Schema.Number,
  SubclassID: Schema.Number,
});

export type ItemRow = Schema.Schema.Type<typeof ItemRowSchema>;
