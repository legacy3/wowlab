import * as Schema from "effect/Schema";

export const ContentTuningXDifficultyRowSchema = Schema.Struct({
  ID: Schema.NumberFromString,
  DifficultyID: Schema.NumberFromString,
  ContentTuningID: Schema.NumberFromString,
});

export type ContentTuningXDifficultyRow = Schema.Schema.Type<
  typeof ContentTuningXDifficultyRowSchema
>;
