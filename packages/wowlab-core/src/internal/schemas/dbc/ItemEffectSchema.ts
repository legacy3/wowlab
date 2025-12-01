import * as Schema from "effect/Schema";

import * as Branded from "../Branded.js";

export const ItemEffectRowSchema = Schema.Struct({
  CategoryCoolDownMSec: Schema.NumberFromString,
  Charges: Schema.NumberFromString,
  ChrSpecializationID: Schema.NumberFromString,
  CoolDownMSec: Schema.NumberFromString,
  ID: Schema.NumberFromString,
  LegacySlotIndex: Schema.NumberFromString,
  PlayerConditionID: Schema.NumberFromString,
  SpellCategoryID: Schema.NumberFromString,
  SpellID: Branded.SpellIDSchema,
  TriggerType: Schema.NumberFromString,
});

export type ItemEffectRow = Schema.Schema.Type<typeof ItemEffectRowSchema>;
