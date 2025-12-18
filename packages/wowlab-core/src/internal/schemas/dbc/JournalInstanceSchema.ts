import * as Schema from "effect/Schema";

export const JournalInstanceRowSchema = Schema.Struct({
  ID: Schema.NumberFromString,
  Name_lang: Schema.NullOr(Schema.String),
  Description_lang: Schema.NullOr(Schema.String),
  MapID: Schema.NumberFromString,
  BackgroundFileDataID: Schema.NumberFromString,
  ButtonFileDataID: Schema.NumberFromString,
  ButtonSmallFileDataID: Schema.NumberFromString,
  LoreFileDataID: Schema.NumberFromString,
  Flags: Schema.NumberFromString,
  AreaID: Schema.NumberFromString,
  CovenantID: Schema.NumberFromString,
});

export type JournalInstanceRow = Schema.Schema.Type<
  typeof JournalInstanceRowSchema
>;
