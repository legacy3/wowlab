import * as Schema from "effect/Schema";

export const ItemBonusTreeRowSchema = Schema.Struct({
  ID: Schema.NumberFromString,
  Flags: Schema.NumberFromString,
  InventoryTypeSlotMask: Schema.NumberFromString,
});

export type ItemBonusTreeRow = Schema.Schema.Type<
  typeof ItemBonusTreeRowSchema
>;
