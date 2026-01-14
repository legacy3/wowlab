import * as Schema from "effect/Schema";

export const GlobalStringsRowSchema = Schema.Struct({
  ID: Schema.NumberFromString,
  BaseTag: Schema.String,
  TagText_lang: Schema.String,
  Flags: Schema.NumberFromString,
});

export type GlobalStringsRow = Schema.Schema.Type<typeof GlobalStringsRowSchema>;
