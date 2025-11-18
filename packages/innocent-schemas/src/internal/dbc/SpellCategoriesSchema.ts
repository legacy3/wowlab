import * as Schema from "effect/Schema";

import * as Branded from "@/Branded";

const SpellCategoriesSchema = Schema.Struct({
  ChargeCategory: Schema.Number,
  DefenseType: Schema.Number,
  DispelType: Schema.Number,
  ID: Schema.Number,
  SpellID: Branded.SpellIDSchema,
  StartRecoveryCategory: Schema.Number.pipe(Schema.optional),
});

type SpellCategoriesRow = Schema.Schema.Type<typeof SpellCategoriesSchema>;

export { SpellCategoriesSchema, type SpellCategoriesRow };
