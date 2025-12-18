import * as Schema from "effect/Schema";

export const ModifiedCraftingReagentItemRowSchema = Schema.Struct({
  ID: Schema.NumberFromString,
  Description_lang: Schema.NullOr(Schema.String),
  ModifiedCraftingCategoryID: Schema.NumberFromString,
  ItemBonusTreeID: Schema.NumberFromString,
  Flags: Schema.NumberFromString,
  Field_9_1_0_38511_004: Schema.NumberFromString,
  ItemContextOffset: Schema.NumberFromString,
});

export type ModifiedCraftingReagentItemRow = Schema.Schema.Type<
  typeof ModifiedCraftingReagentItemRowSchema
>;
