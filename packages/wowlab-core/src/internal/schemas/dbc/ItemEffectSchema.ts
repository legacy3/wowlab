import * as Schema from "effect/Schema";

import * as Branded from "../Branded.js";

export const ItemEffectRowSchema = Schema.Struct({
  CategoryCoolDownMSec: Schema.Number,
  Charges: Schema.Number,
  ChrSpecializationID: Schema.Number,
  CoolDownMSec: Schema.Number,
  ID: Schema.Number,
  LegacySlotIndex: Schema.Number,
  PlayerConditionID: Schema.Number,
  SpellCategoryID: Schema.Number,
  SpellID: Branded.SpellIDSchema,
  TriggerType: Schema.Number,
});

export type ItemEffectRow = Schema.Schema.Type<typeof ItemEffectRowSchema>;
