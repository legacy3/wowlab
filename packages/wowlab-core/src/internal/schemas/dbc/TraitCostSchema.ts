import * as Schema from "effect/Schema";

export const TraitCostRowSchema = Schema.Struct({
  InternalName: Schema.NumberFromString,
  ID: Schema.NumberFromString,
  Amount: Schema.NumberFromString,
  TraitCurrencyID: Schema.NumberFromString,
  CurveID: Schema.NumberFromString,
});

export type TraitCostRow = Schema.Schema.Type<typeof TraitCostRowSchema>;
