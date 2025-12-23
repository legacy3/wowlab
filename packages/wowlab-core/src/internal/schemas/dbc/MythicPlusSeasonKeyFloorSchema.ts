import * as Schema from "effect/Schema";

export const MythicPlusSeasonKeyFloorRowSchema = Schema.Struct({
  ID: Schema.NumberFromString,
  KeyFloor: Schema.NumberFromString,
  PlayerConditionID: Schema.NumberFromString,
  DisplaySeasonID: Schema.NumberFromString,
});

export type MythicPlusSeasonKeyFloorRow = Schema.Schema.Type<typeof MythicPlusSeasonKeyFloorRowSchema>;
