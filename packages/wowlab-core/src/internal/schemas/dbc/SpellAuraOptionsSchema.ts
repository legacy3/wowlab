import * as Schema from "effect/Schema";

import * as Branded from "../Branded.js";

export const SpellAuraOptionsRowSchema = Schema.Struct({
  CumulativeAura: Schema.NumberFromString,
  DifficultyID: Schema.NumberFromString,
  ID: Schema.NumberFromString,
  ProcCategoryRecovery: Schema.NumberFromString,
  ProcChance: Schema.NumberFromString,
  ProcCharges: Schema.NumberFromString,
  ProcTypeMask_0: Schema.NumberFromString,
  ProcTypeMask_1: Schema.NumberFromString,
  SpellID: Branded.SpellIDSchema,
  SpellProcsPerMinuteID: Schema.NumberFromString,
});

export type SpellAuraOptionsRow = Schema.Schema.Type<
  typeof SpellAuraOptionsRowSchema
>;
