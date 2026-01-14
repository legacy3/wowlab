import * as Schema from "effect/Schema";

export const ItemBonusSeasonUpgradeCostRowSchema = Schema.Struct({
  SourceText_lang: Schema.NullOr(Schema.String),
  ID: Schema.NumberFromString,
  CostItemID: Schema.NumberFromString,
  CurrencyID: Schema.NumberFromString,
  OrderIndex: Schema.NumberFromString,
  ItemBonusSeasonID: Schema.NumberFromString,
  FragmentItemID: Schema.NumberFromString,
  FragmentsEarnedTrackingCurrencyID: Schema.NumberFromString,
});

export type ItemBonusSeasonUpgradeCostRow = Schema.Schema.Type<
  typeof ItemBonusSeasonUpgradeCostRowSchema
>;
