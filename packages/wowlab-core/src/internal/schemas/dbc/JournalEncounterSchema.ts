import * as Schema from "effect/Schema";

export const JournalEncounterRowSchema = Schema.Struct({
  Name_lang: Schema.NullOr(Schema.String),
  Description_lang: Schema.NullOr(Schema.String),
  Map_0: Schema.NumberFromString,
  Map_1: Schema.NumberFromString,
  ID: Schema.NumberFromString,
  JournalInstanceID: Schema.NumberFromString,
  DungeonEncounterID: Schema.NumberFromString,
  OrderIndex: Schema.NumberFromString,
  FirstSectionID: Schema.NumberFromString,
  UiMapID: Schema.NumberFromString,
  MapDisplayConditionID: Schema.NumberFromString,
  Flags: Schema.NumberFromString,
  DifficultyMask: Schema.NumberFromString,
});

export type JournalEncounterRow = Schema.Schema.Type<
  typeof JournalEncounterRowSchema
>;
