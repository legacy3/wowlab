import * as Schema from "effect/Schema";

export const SpellCategoryRowSchema = Schema.Struct({
  ChargeRecoveryTime: Schema.NumberFromString,
  Flags: Schema.NumberFromString,
  ID: Schema.NumberFromString,
  MaxCharges: Schema.NumberFromString,
  Name_lang: Schema.optional(Schema.String),
  TypeMask: Schema.NumberFromString,
  UsesPerWeek: Schema.NumberFromString,
});

export type SpellCategoryRow = Schema.Schema.Type<
  typeof SpellCategoryRowSchema
>;
