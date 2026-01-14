import * as Schema from "effect/Schema";

export const ChrSpecializationRowSchema = Schema.Struct({
  Name_lang: Schema.NullOr(Schema.String),
  FemaleName_lang: Schema.NullOr(Schema.String),
  Description_lang: Schema.NullOr(Schema.String),
  ID: Schema.NumberFromString,
  ClassID: Schema.NumberFromString,
  OrderIndex: Schema.NumberFromString,
  PetTalentType: Schema.NumberFromString,
  Role: Schema.NumberFromString,
  Flags: Schema.NumberFromString,
  SpellIconFileID: Schema.NumberFromString,
  PrimaryStatPriority: Schema.NumberFromString,
  AnimReplacements: Schema.NumberFromString,
  MasterySpellID_0: Schema.NumberFromString,
  MasterySpellID_1: Schema.NumberFromString,
});

export type ChrSpecializationRow = Schema.Schema.Type<
  typeof ChrSpecializationRowSchema
>;
