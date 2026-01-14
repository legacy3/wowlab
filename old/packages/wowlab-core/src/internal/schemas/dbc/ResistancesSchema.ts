import * as Schema from "effect/Schema";

export const ResistancesRowSchema = Schema.Struct({
  ID: Schema.NumberFromString,
  Name_lang: Schema.String,
  Flags: Schema.NumberFromString,
  FizzleSoundID: Schema.NumberFromString,
});

export type ResistancesRow = Schema.Schema.Type<typeof ResistancesRowSchema>;
