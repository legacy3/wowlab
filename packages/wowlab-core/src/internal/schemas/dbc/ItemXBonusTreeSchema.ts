import * as Schema from "effect/Schema";

export const ItemXBonusTreeRowSchema = Schema.Struct({
  ID: Schema.NumberFromString,
  ItemBonusTreeID: Schema.NumberFromString,
  ItemID: Schema.NumberFromString,
});

export type ItemXBonusTreeRow = Schema.Schema.Type<
  typeof ItemXBonusTreeRowSchema
>;
