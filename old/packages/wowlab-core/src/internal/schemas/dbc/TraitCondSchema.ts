import * as Schema from "effect/Schema";

export const TraitCondRowSchema = Schema.Struct({
  ID: Schema.NumberFromString,
  CondType: Schema.NumberFromString,
  TraitTreeID: Schema.NumberFromString,
  GrantedRanks: Schema.NumberFromString,
  QuestID: Schema.NumberFromString,
  AchievementID: Schema.NumberFromString,
  SpecSetID: Schema.NumberFromString,
  TraitNodeGroupID: Schema.NumberFromString,
  TraitNodeID: Schema.NumberFromString,
  TraitNodeEntryID: Schema.NumberFromString,
  TraitCurrencyID: Schema.NumberFromString,
  SpentAmountRequired: Schema.NumberFromString,
  Flags: Schema.NumberFromString,
  RequiredLevel: Schema.NumberFromString,
  FreeSharedStringID: Schema.NumberFromString,
  SpendMoreSharedStringID: Schema.NumberFromString,
  TraitCondAccountElementID: Schema.NumberFromString,
});

export type TraitCondRow = Schema.Schema.Type<typeof TraitCondRowSchema>;
