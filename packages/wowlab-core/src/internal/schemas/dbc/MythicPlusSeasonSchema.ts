import * as Schema from "effect/Schema";

export const MythicPlusSeasonRowSchema = Schema.Struct({
  ID: Schema.NumberFromString,
  MilestoneSeason: Schema.NumberFromString,
  StartTimeEvent: Schema.NumberFromString,
  ExpansionLevel: Schema.NumberFromString,
  HeroicLFGDungeonMinGear: Schema.NumberFromString,
});

export type MythicPlusSeasonRow = Schema.Schema.Type<
  typeof MythicPlusSeasonRowSchema
>;
