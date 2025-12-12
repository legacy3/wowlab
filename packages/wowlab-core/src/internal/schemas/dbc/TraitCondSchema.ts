import * as Schema from "effect/Schema";

export const TraitCondRowSchema = Schema.Struct({
  AchievementID: Schema.NumberFromString,
  CondType: Schema.NumberFromString,
  Flags: Schema.NumberFromString,
  FreeSharedStringID: Schema.NumberFromString,
  GrantedRanks: Schema.NumberFromString,
  ID: Schema.NumberFromString,
  QuestID: Schema.NumberFromString,
  RequiredLevel: Schema.NumberFromString,
  SpecSetID: Schema.NumberFromString,
  SpendMoreSharedStringID: Schema.NumberFromString,
  SpentAmountRequired: Schema.NumberFromString,
  TraitCondAccountElementID: Schema.NumberFromString,
  TraitCurrencyID: Schema.NumberFromString,
  TraitNodeEntryID: Schema.NumberFromString,
  TraitNodeGroupID: Schema.NumberFromString,
  TraitNodeID: Schema.NumberFromString,
  TraitTreeID: Schema.NumberFromString,
});

export type TraitCondRow = Schema.Schema.Type<typeof TraitCondRowSchema>;
