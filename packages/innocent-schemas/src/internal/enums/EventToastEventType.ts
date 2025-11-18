import * as Schema from "effect/Schema";

/**
 * Auto-generated from World of Warcraft 11.2.5.63906
 * Source: https://github.com/Gethe/wow-ui-source/tree/7dd1c12d542cf2e0c46ce9282886287f3fd0a2c7
 */

/* eslint-disable perfectionist/sort-enums */
export enum EventToastEventType {
  LevelUp = 0,
  LevelUpSpell = 1,
  LevelUpDungeon = 2,
  LevelUpRaid = 3,
  LevelUpPvP = 4,
  PetBattleNewAbility = 5,
  PetBattleFinalRound = 6,
  PetBattleCapture = 7,
  BattlePetLevelChanged = 8,
  BattlePetLevelUpAbility = 9,
  QuestBossEmote = 10,
  MythicPlusWeeklyRecord = 11,
  QuestTurnedIn = 12,
  WorldStateChange = 13,
  Scenario = 14,
  LevelUpOther = 15,
  PlayerAuraAdded = 16,
  PlayerAuraRemoved = 17,
  SpellScript = 18,
  CriteriaUpdated = 19,
  PvPTierUpdate = 20,
  SpellLearned = 21,
  TreasureItem = 22,
  WeeklyRewardUnlock = 23,
  WeeklyRewardUpgrade = 24,
  FlightpointDiscovered = 25,
}

export const EventToastEventTypeSchema = Schema.Enums(EventToastEventType);
