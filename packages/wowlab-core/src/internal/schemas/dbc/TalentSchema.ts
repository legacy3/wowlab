import * as Schema from "effect/Schema";

export const TalentRowSchema = Schema.Struct({
  ID: Schema.NumberFromString,
  Description_lang: Schema.NullOr(Schema.String),
  TierID: Schema.NumberFromString,
  Flags: Schema.NumberFromString,
  ColumnIndex: Schema.NumberFromString,
  TabID: Schema.NumberFromString,
  ClassID: Schema.NumberFromString,
  SpecID: Schema.NumberFromString,
  SpellID: Schema.NumberFromString,
  OverridesSpellID: Schema.NumberFromString,
  RequiredSpellID: Schema.NumberFromString,
  CategoryMask_0: Schema.NumberFromString,
  CategoryMask_1: Schema.NumberFromString,
  SpellRank_0: Schema.NumberFromString,
  SpellRank_1: Schema.NumberFromString,
  SpellRank_2: Schema.NumberFromString,
  SpellRank_3: Schema.NumberFromString,
  SpellRank_4: Schema.NumberFromString,
  SpellRank_5: Schema.NumberFromString,
  SpellRank_6: Schema.NumberFromString,
  SpellRank_7: Schema.NumberFromString,
  SpellRank_8: Schema.NumberFromString,
  PrereqTalent_0: Schema.NumberFromString,
  PrereqTalent_1: Schema.NumberFromString,
  PrereqTalent_2: Schema.NumberFromString,
  PrereqRank_0: Schema.NumberFromString,
  PrereqRank_1: Schema.NumberFromString,
  PrereqRank_2: Schema.NumberFromString,
});

export type TalentRow = Schema.Schema.Type<typeof TalentRowSchema>;
