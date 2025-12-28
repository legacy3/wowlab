import * as Schema from "effect/Schema";

export const MythicPlusSeasonTrackedMapRowSchema = Schema.Struct({
  ID: Schema.NumberFromString,
  MapChallengeModeID: Schema.NumberFromString,
  DisplaySeasonID: Schema.NumberFromString,
});

export type MythicPlusSeasonTrackedMapRow = Schema.Schema.Type<
  typeof MythicPlusSeasonTrackedMapRowSchema
>;
