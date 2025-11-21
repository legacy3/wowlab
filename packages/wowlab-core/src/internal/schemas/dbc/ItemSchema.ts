import * as Schema from "effect/Schema";

export const ItemRowSchema = Schema.Struct({
  ID: Schema.Number,
  ClassID: Schema.Number,
  SubclassID: Schema.Number,
  Material: Schema.Number,
  InventoryType: Schema.Number,
  SheatheType: Schema.Number,
  Sound_override_subclassID: Schema.Number,
  IconFileDataID: Schema.Number,
  ItemGroupSoundsID: Schema.Number,
  ContentTuningID: Schema.Number,
  ModifiedCraftingReagentItemID: Schema.Number,
  Field_12_0_0_63534_010: Schema.optional(Schema.Number),
  CraftingQualityID: Schema.Number,
  Field_12_0_0_63534_012: Schema.optional(Schema.Number),
  Field_12_0_0_63534_013: Schema.optional(Schema.Number),
  Field_12_0_0_63534_014: Schema.optional(Schema.Number),
});

export type ItemRow = Schema.Schema.Type<typeof ItemRowSchema>;
