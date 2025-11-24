import * as Schema from "effect/Schema";

export const SpellCategoryRowSchema = Schema.Struct({
  ChargeRecoveryTime: Schema.Number,
  Flags: Schema.Number,
  ID: Schema.Number,
  MaxCharges: Schema.Number,
  Name_lang: Schema.optional(Schema.String),
  TypeMask: Schema.Number,
  UsesPerWeek: Schema.Number,
});

export type SpellCategoryRow = Schema.Schema.Type<
  typeof SpellCategoryRowSchema
>;
