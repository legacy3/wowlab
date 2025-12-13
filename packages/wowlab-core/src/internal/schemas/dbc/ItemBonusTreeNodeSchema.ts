import * as Schema from "effect/Schema";

export const ItemBonusTreeNodeRowSchema = Schema.Struct({
  ID: Schema.NumberFromString,
  ItemContext: Schema.NumberFromString,
  ChildItemBonusTreeID: Schema.NumberFromString,
  ChildItemBonusListID: Schema.NumberFromString,
  ChildItemLevelSelectorID: Schema.NumberFromString,
  ChildItemBonusListGroupID: Schema.NumberFromString,
  IblGroupPointsModSetID: Schema.NumberFromString,
  MinMythicPlusLevel: Schema.NumberFromString,
  MaxMythicPlusLevel: Schema.NumberFromString,
  ItemCreationContextGroupID: Schema.NumberFromString,
  Flags: Schema.NumberFromString,
  ParentItemBonusTreeID: Schema.NumberFromString,
});

export type ItemBonusTreeNodeRow = Schema.Schema.Type<
  typeof ItemBonusTreeNodeRowSchema
>;
