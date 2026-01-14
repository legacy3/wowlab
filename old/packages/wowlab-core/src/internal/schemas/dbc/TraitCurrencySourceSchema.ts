import * as Schema from "effect/Schema";

export const TraitCurrencySourceRowSchema = Schema.Struct({
  Requirement_lang: Schema.optional(Schema.String),
  ID: Schema.NumberFromString,
  TraitCurrencyID: Schema.NumberFromString,
  Amount: Schema.NumberFromString,
  QuestID: Schema.NumberFromString,
  AchievementID: Schema.NumberFromString,
  PlayerLevel: Schema.NumberFromString,
  TraitNodeEntryID: Schema.NumberFromString,
  OrderIndex: Schema.NumberFromString,
});

export type TraitCurrencySourceRow = Schema.Schema.Type<
  typeof TraitCurrencySourceRowSchema
>;
