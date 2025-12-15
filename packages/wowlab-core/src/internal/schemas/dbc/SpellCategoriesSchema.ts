import * as Schema from "effect/Schema";

import * as Branded from "../Branded.js";

export const SpellCategoriesRowSchema = Schema.Struct({
  ID: Schema.NumberFromString,
  DifficultyID: Schema.NumberFromString,
  Category: Schema.NumberFromString,
  DefenseType: Schema.NumberFromString,
  DispelType: Schema.NumberFromString,
  Mechanic: Schema.NumberFromString,
  PreventionType: Schema.NumberFromString,
  StartRecoveryCategory: Schema.NumberFromString,
  ChargeCategory: Schema.NumberFromString,
  SpellID: Branded.SpellIDSchema,
});

export type SpellCategoriesRow = Schema.Schema.Type<
  typeof SpellCategoriesRowSchema
>;
