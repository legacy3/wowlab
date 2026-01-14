import * as Schema from "effect/Schema";

export const ItemBonusSeasonRowSchema = Schema.Struct({
  ID: Schema.NumberFromString,
  SeasonID: Schema.NumberFromString,
});

export type ItemBonusSeasonRow = Schema.Schema.Type<
  typeof ItemBonusSeasonRowSchema
>;
