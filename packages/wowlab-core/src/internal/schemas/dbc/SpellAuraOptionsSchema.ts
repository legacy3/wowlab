import * as Schema from "effect/Schema";

import * as Branded from "../Branded.js";

export const SpellAuraOptionsRowSchema = Schema.Struct({
  CumulativeAura: Schema.Number,
  DifficultyID: Schema.Number,
  ID: Schema.Number,
  ProcCategoryRecovery: Schema.Number,
  ProcChance: Schema.Number,
  ProcCharges: Schema.Number,
  ProcTypeMask_0: Schema.Number,
  ProcTypeMask_1: Schema.Number,
  SpellID: Branded.SpellIDSchema,
  SpellProcsPerMinuteID: Schema.Number,
});

export type SpellAuraOptionsRow = Schema.Schema.Type<
  typeof SpellAuraOptionsRowSchema
>;
