import * as Schema from "effect/Schema";

export const ChrClassRaceSexRowSchema = Schema.Struct({
  ID: Schema.NumberFromString,
  ClassID: Schema.NumberFromString,
  RaceID: Schema.NumberFromString,
  Sex: Schema.NumberFromString,
  Flags: Schema.NumberFromString,
  SoundID: Schema.NumberFromString,
  VoiceSoundFilterID: Schema.NumberFromString,
});

export type ChrClassRaceSexRow = Schema.Schema.Type<
  typeof ChrClassRaceSexRowSchema
>;
