import * as Schema from "effect/Schema";

export const TraitCurrencyRowSchema = Schema.Struct({
  ID: Schema.NumberFromString,
  Type: Schema.NumberFromString,
  CurrencyTypesID: Schema.NumberFromString,
  Flags: Schema.NumberFromString,
  Icon: Schema.NumberFromString,
  PlayerDataElementAccountID: Schema.NumberFromString,
  PlayerDataElementCharacterID: Schema.NumberFromString,
});

export type TraitCurrencyRow = Schema.Schema.Type<
  typeof TraitCurrencyRowSchema
>;
