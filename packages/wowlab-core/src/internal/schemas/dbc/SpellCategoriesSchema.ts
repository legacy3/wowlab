import * as Schema from "effect/Schema";

import * as Branded from "../Branded.js";

export const SpellCategoriesRowSchema = Schema.Struct({
  Category: Schema.NumberFromString,
  ChargeCategory: Schema.NumberFromString,
  DefenseType: Schema.NumberFromString,
  DifficultyID: Schema.NumberFromString,
  DiminishType: Schema.NumberFromString,
  DispelType: Schema.NumberFromString,
  ID: Schema.NumberFromString,
  Mechanic: Schema.NumberFromString,
  PreventionType: Schema.NumberFromString,
  SpellID: Branded.SpellIDSchema,
  StartRecoveryCategory: Schema.NumberFromString,
});

export type SpellCategoriesRow = Schema.Schema.Type<
  typeof SpellCategoriesRowSchema
>;
