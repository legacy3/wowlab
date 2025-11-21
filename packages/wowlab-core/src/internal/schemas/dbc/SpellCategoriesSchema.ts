import * as Schema from "effect/Schema";
import * as Branded from "../Branded.js";

export const SpellCategoriesRowSchema = Schema.Struct({
  ID: Schema.Number,
  DifficultyID: Schema.Number,
  Category: Schema.Number,
  DefenseType: Schema.Number,
  DiminishType: Schema.Number,
  DispelType: Schema.Number,
  Mechanic: Schema.Number,
  PreventionType: Schema.Number,
  StartRecoveryCategory: Schema.Number,
  ChargeCategory: Schema.Number,
  SpellID: Branded.SpellIDSchema,
});

export type SpellCategoriesRow = Schema.Schema.Type<
  typeof SpellCategoriesRowSchema
>;
