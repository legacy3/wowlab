import * as Schema from "effect/Schema";

export const JournalEncounterItemRowSchema = Schema.Struct({
  ID: Schema.NumberFromString,
  JournalEncounterID: Schema.NumberFromString,
  ItemID: Schema.NumberFromString,
  FactionMask: Schema.NumberFromString,
  Flags: Schema.NumberFromString,
  DifficultyMask: Schema.NumberFromString,
  DisplaySeasonID: Schema.NumberFromString,
  WorldStateExpressionID: Schema.NumberFromString,
});

export type JournalEncounterItemRow = Schema.Schema.Type<
  typeof JournalEncounterItemRowSchema
>;
