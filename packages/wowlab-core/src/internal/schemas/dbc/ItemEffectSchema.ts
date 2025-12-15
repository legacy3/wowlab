import * as Schema from "effect/Schema";

import * as Branded from "../Branded.js";

export const ItemEffectRowSchema = Schema.Struct({
  ID: Schema.NumberFromString,
  LegacySlotIndex: Schema.NumberFromString,
  TriggerType: Schema.NumberFromString,
  Charges: Schema.NumberFromString,
  CoolDownMSec: Schema.NumberFromString,
  CategoryCoolDownMSec: Schema.NumberFromString,
  SpellCategoryID: Schema.NumberFromString,
  SpellID: Branded.SpellIDSchema,
  ChrSpecializationID: Schema.NumberFromString,
});

export type ItemEffectRow = Schema.Schema.Type<typeof ItemEffectRowSchema>;
