import * as Schema from "effect/Schema";

import * as Branded from "../Branded.js";

export const SpellAuraOptionsRowSchema = Schema.Struct({
  ID: Schema.NumberFromString,
  DifficultyID: Schema.NumberFromString,
  CumulativeAura: Schema.NumberFromString,
  ProcCategoryRecovery: Schema.NumberFromString,
  ProcChance: Schema.NumberFromString,
  ProcCharges: Schema.NumberFromString,
  SpellProcsPerMinuteID: Schema.NumberFromString,
  ProcTypeMask_0: Schema.NumberFromString,
  ProcTypeMask_1: Schema.NumberFromString,
  SpellID: Branded.SpellIDSchema,
});

export type SpellAuraOptionsRow = Schema.Schema.Type<
  typeof SpellAuraOptionsRowSchema
>;
