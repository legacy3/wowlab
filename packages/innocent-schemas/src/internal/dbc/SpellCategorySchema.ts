import * as Schema from "effect/Schema";

const SpellCategorySchema = Schema.Struct({
  ChargeRecoveryTime: Schema.Number,
  ID: Schema.Number,
  MaxCharges: Schema.Number,
  Name: Schema.String.pipe(Schema.optional),
});

type SpellCategoryRow = Schema.Schema.Type<typeof SpellCategorySchema>;

export { SpellCategorySchema, type SpellCategoryRow };
