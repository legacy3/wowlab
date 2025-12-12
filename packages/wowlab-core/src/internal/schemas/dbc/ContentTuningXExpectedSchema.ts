import * as Schema from "effect/Schema";

export const ContentTuningXExpectedRowSchema = Schema.Struct({
  ID: Schema.NumberFromString,
  ExpectedStatModID: Schema.NumberFromString,
  MinMythicPlusSeasonID: Schema.NumberFromString,
  MaxMythicPlusSeasonID: Schema.NumberFromString,
  ContentTuningID: Schema.NumberFromString,
});

export type ContentTuningXExpectedRow = Schema.Schema.Type<
  typeof ContentTuningXExpectedRowSchema
>;
