import * as Schema from "effect/Schema";

export const ItemBonusListGroupEntryRowSchema = Schema.Struct({
  ID: Schema.NumberFromString,
  ItemBonusListGroupID: Schema.NumberFromString,
  ItemBonusListID: Schema.NumberFromString,
  ItemLevelSelectorID: Schema.NumberFromString,
  SequenceValue: Schema.NumberFromString,
  ItemExtendedCostID: Schema.NumberFromString,
  PlayerConditionID: Schema.NumberFromString,
  Flags: Schema.NumberFromString,
  ItemLogicalCostGroupID: Schema.NumberFromString,
});

export type ItemBonusListGroupEntryRow = Schema.Schema.Type<
  typeof ItemBonusListGroupEntryRowSchema
>;
