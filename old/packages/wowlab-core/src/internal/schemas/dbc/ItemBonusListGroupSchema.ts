import * as Schema from "effect/Schema";

export const ItemBonusListGroupRowSchema = Schema.Struct({
  ID: Schema.NumberFromString,
  SequenceSpellID: Schema.NumberFromString,
  PlayerConditionID: Schema.NumberFromString,
  ItemExtendedCostID: Schema.NumberFromString,
  ItemLogicalCostGroupID: Schema.NumberFromString,
  ItemGroupIlvlScalingID: Schema.NumberFromString,
});

export type ItemBonusListGroupRow = Schema.Schema.Type<
  typeof ItemBonusListGroupRowSchema
>;
