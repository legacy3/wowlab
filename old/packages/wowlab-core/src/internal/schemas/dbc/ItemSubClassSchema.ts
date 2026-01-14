import * as Schema from "effect/Schema";

export const ItemSubClassRowSchema = Schema.Struct({
  DisplayName_lang: Schema.NullOr(Schema.String),
  VerboseName_lang: Schema.NullOr(Schema.String),
  ID: Schema.NumberFromString,
  ClassID: Schema.NumberFromString,
  SubClassID: Schema.NumberFromString,
  AuctionHouseSortOrder: Schema.NumberFromString,
  PrerequisiteProficiency: Schema.NumberFromString,
  Flags: Schema.NumberFromString,
  DisplayFlags: Schema.NumberFromString,
  WeaponSwingSize: Schema.NumberFromString,
  PostrequisiteProficiency: Schema.NumberFromString,
});

export type ItemSubClassRow = Schema.Schema.Type<typeof ItemSubClassRowSchema>;
