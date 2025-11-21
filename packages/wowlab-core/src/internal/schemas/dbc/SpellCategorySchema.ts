import * as Schema from "effect/Schema";

export const SpellCategoryRowSchema = Schema.Struct({
  ID: Schema.Number,
  Name_lang: Schema.optional(Schema.String),
  Flags: Schema.Number,
  UsesPerWeek: Schema.Number,
  MaxCharges: Schema.Number,
  ChargeRecoveryTime: Schema.Number,
  TypeMask: Schema.Number,
});

export type SpellCategoryRow = Schema.Schema.Type<
  typeof SpellCategoryRowSchema
>;
