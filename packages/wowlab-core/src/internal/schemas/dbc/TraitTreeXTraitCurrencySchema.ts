import * as Schema from "effect/Schema";

export const TraitTreeXTraitCurrencyRowSchema = Schema.Struct({
  ID: Schema.NumberFromString,
  Index: Schema.NumberFromString,
  TraitTreeID: Schema.NumberFromString,
  TraitCurrencyID: Schema.NumberFromString,
});

export type TraitTreeXTraitCurrencyRow = Schema.Schema.Type<
  typeof TraitTreeXTraitCurrencyRowSchema
>;
