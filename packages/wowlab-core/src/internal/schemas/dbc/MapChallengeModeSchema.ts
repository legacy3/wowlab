import * as Schema from "effect/Schema";

export const MapChallengeModeRowSchema = Schema.Struct({
  Name_lang: Schema.String,
  ID: Schema.NumberFromString,
  MapID: Schema.NumberFromString,
  Flags: Schema.NumberFromString,
  ExpansionLevel: Schema.NumberFromString,
  RequiredWorldStateID: Schema.NumberFromString,
  CriteriaCount_0: Schema.NumberFromString,
  CriteriaCount_1: Schema.NumberFromString,
  CriteriaCount_2: Schema.NumberFromString,
  FirstRewardQuestID_0: Schema.NumberFromString,
  FirstRewardQuestID_1: Schema.NumberFromString,
  FirstRewardQuestID_2: Schema.NumberFromString,
  FirstRewardQuestID_3: Schema.NumberFromString,
  FirstRewardQuestID_4: Schema.NumberFromString,
  FirstRewardQuestID_5: Schema.NumberFromString,
  RewardQuestID_0: Schema.NumberFromString,
  RewardQuestID_1: Schema.NumberFromString,
  RewardQuestID_2: Schema.NumberFromString,
  RewardQuestID_3: Schema.NumberFromString,
  RewardQuestID_4: Schema.NumberFromString,
  RewardQuestID_5: Schema.NumberFromString,
});

export type MapChallengeModeRow = Schema.Schema.Type<typeof MapChallengeModeRowSchema>;
