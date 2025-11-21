import * as Schema from "effect/Schema";
import * as Branded from "../Branded.js";

export const ItemEffectRowSchema = Schema.Struct({
  ID: Schema.Number,
  LegacySlotIndex: Schema.Number,
  TriggerType: Schema.Number,
  Charges: Schema.Number,
  CoolDownMSec: Schema.Number,
  CategoryCoolDownMSec: Schema.Number,
  SpellCategoryID: Schema.Number,
  SpellID: Branded.SpellIDSchema,
  ChrSpecializationID: Schema.Number,
  PlayerConditionID: Schema.Number,
});

export type ItemEffectRow = Schema.Schema.Type<typeof ItemEffectRowSchema>;
