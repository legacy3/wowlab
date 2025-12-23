import * as Schema from "effect/Schema";

export const KeystoneAffixRowSchema = Schema.Struct({
  Name_lang: Schema.String,
  Description_lang: Schema.String,
  ID: Schema.NumberFromString,
  FiledataID: Schema.NumberFromString,
});

export type KeystoneAffixRow = Schema.Schema.Type<typeof KeystoneAffixRowSchema>;
