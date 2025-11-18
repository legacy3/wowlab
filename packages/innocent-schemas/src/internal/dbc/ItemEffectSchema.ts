import * as Schema from "effect/Schema";

const ItemEffectSchema = Schema.Struct({
  CategoryCoolDownMSec: Schema.Number,
  Charges: Schema.Number,
  ChrSpecializationID: Schema.Number,
  CoolDownMSec: Schema.Number,
  ID: Schema.Number,
  ItemID: Schema.Number,
  LegacySlotIndex: Schema.Number,
  SpellCategoryID: Schema.Number,
  SpellID: Schema.Number,
  TriggerType: Schema.Number,
});

type ItemEffectRow = Schema.Schema.Type<typeof ItemEffectSchema>;

export { ItemEffectSchema, type ItemEffectRow };
