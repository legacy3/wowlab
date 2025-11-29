import * as Schema from "effect/Schema";

export const ContentTuningXExpectedRowSchema = Schema.Struct({
  ContentTuningID: Schema.Number,
  ExpectedStatModID: Schema.Number,
  ID: Schema.Number,
  MaxMythicPlusSeasonID: Schema.Number,
  MinMythicPlusSeasonID: Schema.Number,
});

export type ContentTuningXExpectedRow = Schema.Schema.Type<
  typeof ContentTuningXExpectedRowSchema
>;
