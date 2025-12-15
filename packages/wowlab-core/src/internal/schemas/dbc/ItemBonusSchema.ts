import * as Schema from "effect/Schema";

export const ItemBonusRowSchema = Schema.Struct({
  ID: Schema.NumberFromString,
  Value_0: Schema.NumberFromString,
  Value_1: Schema.NumberFromString,
  Value_2: Schema.NumberFromString,
  Value_3: Schema.NumberFromString,
  ParentItemBonusListID: Schema.NumberFromString,
  Type: Schema.NumberFromString,
  OrderIndex: Schema.NumberFromString,
});

export type ItemBonusRow = Schema.Schema.Type<typeof ItemBonusRowSchema>;
