import * as Schema from "effect/Schema";

export const MythicPlusSeasonRewardLevelsRowSchema = Schema.Struct({
  ID: Schema.NumberFromString,
  MythicPlusSeasonID: Schema.NumberFromString,
  Field_10_2_0_51521_001: Schema.NumberFromString,
  DifficultyLevel: Schema.NumberFromString,
  WeeklyRewardLevel: Schema.NumberFromString,
  EndOfRunRewardLevel: Schema.NumberFromString,
});

export type MythicPlusSeasonRewardLevelsRow = Schema.Schema.Type<typeof MythicPlusSeasonRewardLevelsRowSchema>;
