import * as Schema from "effect/Schema";

export const SpellCategoryRowSchema = Schema.Struct({
  ID: Schema.NumberFromString,
  Name_lang: Schema.optional(Schema.String),
  Flags: Schema.NumberFromString,
  UsesPerWeek: Schema.NumberFromString,
  MaxCharges: Schema.NumberFromString,
  ChargeRecoveryTime: Schema.NumberFromString,
  TypeMask: Schema.NumberFromString,
});

export type SpellCategoryRow = Schema.Schema.Type<
  typeof SpellCategoryRowSchema
>;
