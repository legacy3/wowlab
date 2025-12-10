import * as Schema from "effect/Schema";

export const ChrSpecializationRowSchema = Schema.Struct({
  AnimReplacements: Schema.NumberFromString,
  ClassID: Schema.NumberFromString,
  Description_lang: Schema.NullOr(Schema.String),
  FemaleName_lang: Schema.NullOr(Schema.String),
  Flags: Schema.NumberFromString,
  ID: Schema.NumberFromString,
  MasterySpellID_0: Schema.NumberFromString,
  MasterySpellID_1: Schema.NumberFromString,
  Name_lang: Schema.NullOr(Schema.String),
  OrderIndex: Schema.NumberFromString,
  PetTalentType: Schema.NumberFromString,
  PrimaryStatPriority: Schema.NumberFromString,
  Role: Schema.NumberFromString,
  SpellIconFileID: Schema.NumberFromString,
});

export type ChrSpecializationRow = Schema.Schema.Type<
  typeof ChrSpecializationRowSchema
>;
