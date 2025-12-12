import * as Schema from "effect/Schema";

export const SkillLineAbilityRowSchema = Schema.Struct({
  AbilityAllVerb_lang: Schema.NullOr(Schema.String),
  AbilityVerb_lang: Schema.NullOr(Schema.String),
  AcquireMethod: Schema.NumberFromString,
  ClassMask: Schema.NumberFromString,
  Flags: Schema.NumberFromString,
  ID: Schema.NumberFromString,
  MinSkillLineRank: Schema.NumberFromString,
  NumSkillUps: Schema.NumberFromString,
  RaceMask: Schema.NumberFromString,
  SkillLine: Schema.NumberFromString,
  SkillupSkillLineID: Schema.NumberFromString,
  Spell: Schema.NumberFromString,
  SupercedesSpell: Schema.NumberFromString,
  TradeSkillCategoryID: Schema.NumberFromString,
  TrivialSkillLineRankHigh: Schema.NumberFromString,
  TrivialSkillLineRankLow: Schema.NumberFromString,
  UniqueBit: Schema.NumberFromString,
});

export type SkillLineAbilityRow = Schema.Schema.Type<
  typeof SkillLineAbilityRowSchema
>;
