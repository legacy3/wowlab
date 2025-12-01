import * as Schema from "effect/Schema";

export const ContentTuningXExpectedRowSchema = Schema.Struct({
  ContentTuningID: Schema.NumberFromString,
  ExpectedStatModID: Schema.NumberFromString,
  ID: Schema.NumberFromString,
  MaxMythicPlusSeasonID: Schema.NumberFromString,
  MinMythicPlusSeasonID: Schema.NumberFromString,
});

export type ContentTuningXExpectedRow = Schema.Schema.Type<
  typeof ContentTuningXExpectedRowSchema
>;
