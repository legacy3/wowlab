import * as Schema from "effect/Schema";

export const SkillLineAbilityRowSchema = Schema.Struct({
  RaceMask: Schema.NumberFromString,
  AbilityVerb_lang: Schema.NullOr(Schema.String),
  AbilityAllVerb_lang: Schema.NullOr(Schema.String),
  ID: Schema.NumberFromString,
  SkillLine: Schema.NumberFromString,
  Spell: Schema.NumberFromString,
  MinSkillLineRank: Schema.NumberFromString,
  ClassMask: Schema.NumberFromString,
  SupercedesSpell: Schema.NumberFromString,
  AcquireMethod: Schema.NumberFromString,
  TrivialSkillLineRankHigh: Schema.NumberFromString,
  TrivialSkillLineRankLow: Schema.NumberFromString,
  Flags: Schema.NumberFromString,
  NumSkillUps: Schema.NumberFromString,
  UniqueBit: Schema.NumberFromString,
  TradeSkillCategoryID: Schema.NumberFromString,
  SkillupSkillLineID: Schema.NumberFromString,
});

export type SkillLineAbilityRow = Schema.Schema.Type<
  typeof SkillLineAbilityRowSchema
>;
