import * as Schema from "effect/Schema";

export const ChrClassRaceSexRowSchema = Schema.Struct({
  ClassID: Schema.NumberFromString,
  Flags: Schema.NumberFromString,
  ID: Schema.NumberFromString,
  RaceID: Schema.NumberFromString,
  Sex: Schema.NumberFromString,
  SoundID: Schema.NumberFromString,
  VoiceSoundFilterID: Schema.NumberFromString,
});

export type ChrClassRaceSexRow = Schema.Schema.Type<
  typeof ChrClassRaceSexRowSchema
>;
