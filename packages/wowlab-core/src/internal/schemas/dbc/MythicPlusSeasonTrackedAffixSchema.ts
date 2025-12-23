import * as Schema from "effect/Schema";

export const MythicPlusSeasonTrackedAffixRowSchema = Schema.Struct({
  ID: Schema.NumberFromString,
  KeystoneAffixID: Schema.NumberFromString,
  BonusRating: Schema.NumberFromString,
  Field_9_1_0_38511_004: Schema.NumberFromString,
  DisplaySeasonID: Schema.NumberFromString,
});

export type MythicPlusSeasonTrackedAffixRow = Schema.Schema.Type<
  typeof MythicPlusSeasonTrackedAffixRowSchema
>;
