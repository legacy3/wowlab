import * as Schema from "effect/Schema";

import * as Branded from "../Branded.js";

export const SpellCategoriesRowSchema = Schema.Struct({
  Category: Schema.Number,
  ChargeCategory: Schema.Number,
  DefenseType: Schema.Number,
  DifficultyID: Schema.Number,
  DiminishType: Schema.Number,
  DispelType: Schema.Number,
  ID: Schema.Number,
  Mechanic: Schema.Number,
  PreventionType: Schema.Number,
  SpellID: Branded.SpellIDSchema,
  StartRecoveryCategory: Schema.Number,
});

export type SpellCategoriesRow = Schema.Schema.Type<
  typeof SpellCategoriesRowSchema
>;
